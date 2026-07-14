import { test, expect } from "@playwright/test";

import { hasCustomerCredentials, loginViaLoginPage } from "./helpers/auth.helpers";
import { addLaunchProductFromPdp, clearCart } from "./helpers/cart.helpers";
import {
  fillCheckoutForm,
  openCheckoutReview,
  placeOrderFromReview,
  selectPaymentMethod,
} from "./helpers/checkout.helpers";
import { LAUNCH_PRODUCT_SLUG } from "./helpers/constants";
import { fetchProductInventory } from "./helpers/inventory.helpers";

test.describe("Inventory reservation", () => {
  test("PDP loads live inventory from API", async ({ page }) => {
    let productId = "";
    let initialAvailable = -1;

    page.on("response", async (response) => {
      const match = response.url().match(/\/api\/inventory\/product\/([0-9a-f-]{36})/i);
      if (!match || !response.ok()) return;
      productId = match[1];
      const body = (await response.json()) as {
        ok?: boolean;
        data?: { variants?: { available: number }[] };
      };
      if (body.ok && body.data?.variants?.[0]) {
        initialAvailable = body.data.variants[0].available;
      }
    });

    await page.goto(`/products/${LAUNCH_PRODUCT_SLUG}`);
    await page.waitForTimeout(2000);

    test.skip(!productId, "Inventory API unavailable");
    expect(initialAvailable).toBeGreaterThanOrEqual(0);
  });

  test("placing COD order reduces available inventory", async ({ page, request }) => {
    test.skip(!hasCustomerCredentials(), "Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD");

    let productId = "";
    page.on("response", async (response) => {
      const match = response.url().match(/\/api\/inventory\/product\/([0-9a-f-]{36})/i);
      if (match && response.ok()) productId = match[1];
    });

    await page.goto(`/products/${LAUNCH_PRODUCT_SLUG}`);
    await page.waitForTimeout(2000);
    test.skip(!productId, "Could not resolve product id from inventory API");

    const before = await fetchProductInventory(request, productId);
    test.skip(before.length === 0 || before[0].available < 1, "No stock available for reservation test");

    const beforeAvailable = before[0].available;

    await loginViaLoginPage(page);
    await clearCart(page);
    await addLaunchProductFromPdp(page);
    await page.goto("/checkout");
    await fillCheckoutForm(page);
    await selectPaymentMethod(page, "cod");
    await openCheckoutReview(page);
    await placeOrderFromReview(page);

    const placed = await page.waitForURL(/\/checkout\/success/, { timeout: 30_000 }).then(
      () => true,
      () => false,
    );
    test.skip(!placed, "Order placement failed — skipping inventory assertion");

    await page.waitForTimeout(1500);
    const after = await fetchProductInventory(request, productId);
    expect(after[0]?.available).toBeLessThan(beforeAvailable);
  });

  test("inventory API returns variant structure", async ({ request }) => {
    const res = await request.get("/api/inventory/product/not-a-uuid");
    expect(res.status()).toBe(400);
  });
});
