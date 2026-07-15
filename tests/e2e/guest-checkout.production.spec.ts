import { test, expect } from "@playwright/test";

import {
  addLaunchProductFromPdp,
  assertLaunchProductInCart,
  clearCart,
  waitForCartServerSync,
} from "./helpers/cart.helpers";
import {
  gotoCheckoutWithItems,
  placeOrderFromReview,
  selectPaymentMethod,
} from "./helpers/checkout.helpers";
import { TEST_SHIPPING } from "./helpers/constants";
import { launchProductHasStock, LAUNCH_PRODUCT_OUT_OF_STOCK_MESSAGE } from "./helpers/stock.helpers";

/** Unique guest email so claim/orphan logic doesn't collide with registered E2E customer. */
function guestEmail(): string {
  return `guest.checkout.${Date.now()}@beyondbabyco.in`;
}

async function prepareGuestCart(page: import("@playwright/test").Page) {
  await clearCart(page);
  await addLaunchProductFromPdp(page);
  await assertLaunchProductInCart(page);
  await waitForCartServerSync(page);
}

test.describe("Guest checkout (production)", () => {
  test.describe.configure({ timeout: 300_000 });

  test("checkout is public — no login redirect", async ({ page }) => {
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByRole("heading", { name: "Checkout", level: 1 })).toBeVisible();
    await expect(page.getByText(/no account required|Guest checkout|Checkout as a guest/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("guest COD: cart → email → ship → COD → success + create-account CTA", async ({
    page,
    request,
  }) => {
    test.skip(!(await launchProductHasStock(request)), LAUNCH_PRODUCT_OUT_OF_STOCK_MESSAGE);

    const email = guestEmail();
    await prepareGuestCart(page);
    await gotoCheckoutWithItems(page);

    await expect(page).not.toHaveURL(/\/login/);

    await page.locator("#cust-name").fill("Guest Checkout Probe");
    await page.locator("#cust-phone").fill(TEST_SHIPPING.phone);
    await page.locator("#cust-email").fill(email);

    await page.locator("#shipping-name").fill("Guest Checkout Probe");
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

    await selectPaymentMethod(page, "cod");
    await page.getByRole("button", { name: "Review & Place Order" }).click();
    await page.getByRole("heading", { name: "Review your order" }).waitFor({ state: "visible" });
    await placeOrderFromReview(page);

    await page.waitForURL(/\/checkout\/success\?orderId=/, { timeout: 150_000 });
    await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Create your BeyondBabyCo account/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Create your BeyondBabyCo account/i })).toHaveAttribute(
      "href",
      new RegExp(`email=${encodeURIComponent(email).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
    );

    const orderId = new URL(page.url()).searchParams.get("orderId");
    console.log(`GUEST_COD_ORDER_ID=${orderId}`);
    console.log(`GUEST_COD_EMAIL=${email}`);
    console.log(`GUEST_COD_URL=${page.url()}`);
  });
});
