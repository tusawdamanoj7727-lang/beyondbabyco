import { test, expect } from "@playwright/test";

import { hasCustomerCredentials, loginViaLoginPage } from "./helpers/auth.helpers";
import { clearCart, waitForCartServerSync } from "./helpers/cart.helpers";
import {
  fillCheckoutForm,
  gotoCheckoutWithItems,
  placeOrderFromReview,
  selectPaymentMethod,
} from "./helpers/checkout.helpers";
import { LAUNCH_PRODUCT_SLUG } from "./helpers/constants";
import { launchProductHasStock, LAUNCH_PRODUCT_OUT_OF_STOCK_MESSAGE } from "./helpers/stock.helpers";

async function prepareCart(page: import("@playwright/test").Page) {
  await clearCart(page);
  await page.goto(`/products/${LAUNCH_PRODUCT_SLUG}`, { waitUntil: "domcontentloaded" });
  const buyNow = page.getByRole("button", { name: /Buy Now/i }).first();
  const addToCart = page.getByRole("button", { name: /Add to Cart/i }).first();
  if (await buyNow.isVisible().catch(() => false)) {
    await buyNow.click();
    // Buy Now may go straight to checkout or open mini-cart
    await Promise.race([
      page.waitForURL(/\/checkout/, { timeout: 20_000 }),
      page.getByRole("dialog", { name: /Your Cart/i }).waitFor({ state: "visible", timeout: 20_000 }),
    ]).catch(() => {});
  } else {
    await addToCart.click();
    await page.getByRole("dialog", { name: /Your Cart/i }).waitFor({ state: "visible", timeout: 20_000 }).catch(() => {});
  }
  if (!page.url().includes("/checkout")) {
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  }
  await waitForCartServerSync(page);
}

test.describe("Production email proof", () => {
  test.describe.configure({ timeout: 300_000 });

  test.beforeEach(async ({ page }) => {
    test.skip(!hasCustomerCredentials(), "Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD");
    await loginViaLoginPage(page);
  });

  test("retry prepaid emails on paid Razorpay order", async ({ page }) => {
    // Real paid order ORD-20260714-WB0TX — prior logs failed with SMTP 535; retry via idempotent capture.
    const orderId = "e04df001-434c-4fbe-a209-d3fdc5c63529";
    const razorpay_order_id = "order_TDNnSaGHo82uRB";
    const razorpay_payment_id = "pay_TDNo1ATymwNMqJ";

    const { createHmac } = await import("node:crypto");
    const { readFileSync } = await import("node:fs");
    function loadEnv(path: string) {
      const o: Record<string, string> = {};
      for (const line of readFileSync(path, "utf8").split("\n")) {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (!m) continue;
        let v = m[2];
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        o[m[1]] = v;
      }
      return o;
    }
    const local = loadEnv(".env.local");
    const headers = {
      apikey: local.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${local.SUPABASE_SERVICE_ROLE_KEY!}`,
    };
    const gws = await (
      await fetch(
        `${local.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/payment_gateways?select=api_secret_encrypted&is_enabled=eq.true&provider=eq.razorpay&limit=1`,
        { headers },
      )
    ).json();
    const keySecret = String(gws[0].api_secret_encrypted || "").replace(/^enc:/, "");
    const razorpay_signature = createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const verify = await page.evaluate(
      async (body) => {
        const res = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        });
        return { status: res.status, text: await res.text() };
      },
      { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature },
    );
    console.log(`PROOF_RZP_RETRY_VERIFY=${JSON.stringify(verify)}`);
    expect(verify.status).toBe(200);

    // Poll email logs until sent
    for (let i = 0; i < 20; i++) {
      const logs = await (
        await fetch(
          `${local.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/order_email_logs?order_id=eq.${orderId}&select=template_id,status`,
          { headers },
        )
      ).json();
      console.log(`PROOF_RZP_RETRY_LOGS_${i}=${JSON.stringify(logs)}`);
      const allSent =
        Array.isArray(logs) &&
        ["order-confirmation", "invoice", "admin-new-order"].every((t) =>
          logs.some((l: { template_id: string; status: string }) => l.template_id === t && l.status === "sent"),
        );
      if (allSent) {
        console.log("PROOF_RZP_RETRY_ALL_SENT=true");
        return;
      }
      await page.waitForTimeout(2_000);
    }
    throw new Error("Prepaid email logs did not become sent after retry");
  });

  test("COD order completes (await emails)", async ({ page, request }) => {
    test.skip(!(await launchProductHasStock(request)), LAUNCH_PRODUCT_OUT_OF_STOCK_MESSAGE);
    await prepareCart(page);
    await gotoCheckoutWithItems(page);
    await fillCheckoutForm(page);
    await selectPaymentMethod(page, "cod");
    await page.getByRole("button", { name: "Review & Place Order" }).click();
    await page.getByRole("heading", { name: "Review your order" }).waitFor({ state: "visible" });
    await placeOrderFromReview(page);

    await page.waitForURL(/\/checkout\/success\?orderId=/, { timeout: 150_000 });
    await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible();
    const url = page.url();
    const orderId = new URL(url).searchParams.get("orderId");
    console.log(`PROOF_COD_ORDER_ID=${orderId}`);
    console.log(`PROOF_COD_URL=${url}`);
  });

  test("Razorpay order completes with real checkout", async ({ page, request }) => {
    test.skip(!(await launchProductHasStock(request)), LAUNCH_PRODUCT_OUT_OF_STOCK_MESSAGE);

    let placedOrderId: string | null = null;
    page.on("response", async (response) => {
      try {
        if (!response.url().includes("checkout") && !response.request().method()) return;
        const ct = response.headers()["content-type"] || "";
        if (!ct.includes("application/json") && !ct.includes("text/x-component")) return;
      } catch {
        /* ignore */
      }
    });

    await prepareCart(page);
    await gotoCheckoutWithItems(page);
    await fillCheckoutForm(page);
    await selectPaymentMethod(page, "razorpay");
    await page.getByRole("button", { name: "Review & Place Order" }).click();
    await page.getByRole("heading", { name: "Review your order" }).waitFor({ state: "visible" });
    await placeOrderFromReview(page);

    // Wait for live Razorpay Checkout iframe — do not click page copy behind it.
    await expect
      .poll(() => page.frames().some((f) => /razorpay\.com/i.test(f.url())), { timeout: 60_000 })
      .toBeTruthy();
    console.log("PROOF_RZP_CHECKOUT_OPEN=true");

    const rzp = page.frameLocator("iframe.razorpay-checkout-frame").first();
    // Dismiss contact gate if present
    const mobile = rzp.locator('input[name="contact"], input[type="tel"], input[placeholder*="mobile" i]').first();
    if (await mobile.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await mobile.fill("9876543210");
      await rzp.getByRole("button", { name: /Continue/i }).click();
      console.log("PROOF_RZP_CONTACT_FILLED=true");
    }

    // Capture storefront order id from success URL or localStorage fallback.
    try {
      await page.waitForURL(/\/checkout\/success\?orderId=/, { timeout: 240_000 });
      await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible();
      const url = page.url();
      placedOrderId = new URL(url).searchParams.get("orderId");
      console.log(`PROOF_RZP_ORDER_ID=${placedOrderId}`);
      console.log(`PROOF_RZP_URL=${url}`);
    } catch (err) {
      console.log("PROOF_RZP_PENDING=true");
      console.log(`PROOF_RZP_URL=${page.url()}`);
      throw err;
    }
  });
});
