import { expect, type Page } from "@playwright/test";

import { TEST_CUSTOMER, TEST_SHIPPING } from "./constants";

/** Waits for checkout cart hydration and the customer form (not empty-state). */
export async function waitForCheckoutForm(page: Page): Promise<void> {
  await page.getByRole("heading", { name: "Checkout", level: 1 }).waitFor({ state: "visible" });
  const emptyState = page.getByText(/Nothing to checkout yet/i);
  if (await emptyState.isVisible().catch(() => false)) {
    throw new Error("Checkout rendered empty-state — cart did not persist before checkout navigation.");
  }
  await page.locator("#cust-name").waitFor({ state: "visible", timeout: 30_000 });
}

export async function gotoCheckoutWithItems(page: Page): Promise<void> {
  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  await waitForCheckoutForm(page);
}

export async function fillCheckoutForm(page: Page): Promise<void> {
  await waitForCheckoutForm(page);
  await page.locator("#cust-name").fill(TEST_CUSTOMER.fullName);
  await page.locator("#cust-phone").fill(TEST_CUSTOMER.phone);
  await page.locator("#cust-email").fill(TEST_CUSTOMER.email || "e2e@beyondbabyco.com");

  await page.locator("#shipping-name").fill(TEST_SHIPPING.full_name);
  await page.locator("#shipping-phone").fill(TEST_SHIPPING.phone);
  await page.locator("#shipping-line1").fill(TEST_SHIPPING.line1);
  await page.locator("#shipping-line2").fill(TEST_SHIPPING.line2);
  await page.locator("#shipping-pin").fill(TEST_SHIPPING.pincode);
  await page.locator("#shipping-city").fill(TEST_SHIPPING.city);
  await page.locator("#shipping-state").selectOption(TEST_SHIPPING.state);

  await page
    .getByText(/Delivery available|Enter a 6-digit PIN|Checking delivery/i)
    .first()
    .waitFor({ state: "visible", timeout: 20_000 });
}

export async function openCheckoutReview(page: Page): Promise<void> {
  await fillCheckoutForm(page);
  await page.getByRole("button", { name: "Review & Place Order" }).click();
  await page.getByRole("heading", { name: "Review your order" }).waitFor({ state: "visible" });
}

export async function selectPaymentMethod(page: Page, method: "cod" | "razorpay"): Promise<void> {
  const label = method === "cod" ? /Cash on Delivery/ : /Pay Online/;
  await page.getByRole("radio", { name: label }).click();
}

export async function placeOrderFromReview(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog", { name: "Review your order" });
  await dialog.getByRole("button", { name: "Place Order" }).click();
}

/** Assert order placement reached success or surface a actionable skip reason. */
export async function expectCheckoutSuccess(page: Page): Promise<void> {
  const success = page.waitForURL(/\/checkout\/success\?orderId=/, { timeout: 45_000 });
  const failureToast = page
    .getByText(/Could not place order|not available|out of stock|schema|rpc/i)
    .first()
    .waitFor({ state: "visible", timeout: 45_000 })
    .then(() => "toast" as const)
    .catch(() => null);

  const result = await Promise.race([
    success.then(() => "success" as const),
    failureToast,
  ]);

  if (result === "toast") {
    throw new Error(
      "Order placement failed on server — confirm Supabase migrations 031_order_gst_breakdown and 038_fix_checkout_stock_rpcs are applied.",
    );
  }

  await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible();
}
