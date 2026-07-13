import { test, expect } from "@playwright/test";

import { hasCustomerCredentials, loginViaLoginPage } from "./helpers/auth.helpers";
import { clearCart, prepareAuthenticatedCheckoutCart } from "./helpers/cart.helpers";
import {
  expectCheckoutSuccess,
  fillCheckoutForm,
  gotoCheckoutWithItems,
  openCheckoutReview,
  placeOrderFromReview,
  selectPaymentMethod,
} from "./helpers/checkout.helpers";
import { launchProductHasStock, LAUNCH_PRODUCT_OUT_OF_STOCK_MESSAGE } from "./helpers/stock.helpers";

test.describe("Checkout", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasCustomerCredentials(), "Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD");
    await loginViaLoginPage(page);
    await prepareAuthenticatedCheckoutCart(page);
  });

  test("authenticated user reaches checkout page", async ({ page }) => {
    await gotoCheckoutWithItems(page);
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByRole("button", { name: "Review & Place Order" })).toBeVisible();
  });

  test("checkout form sections are present", async ({ page }) => {
    await gotoCheckoutWithItems(page);
    await expect(page.getByText("1. Customer Information")).toBeVisible();
    await expect(page.getByText("2. Shipping Address")).toBeVisible();
    await expect(page.getByText("5. Payment Method")).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Payment method" })).toBeVisible();
  });

  test("review dialog opens with order summary", async ({ page }) => {
    await gotoCheckoutWithItems(page);
    await openCheckoutReview(page);
    await expect(page.getByText("Deliver to")).toBeVisible();
    await expect(page.getByRole("button", { name: "Place Order" })).toBeVisible();
  });
});

test.describe("Checkout empty state", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasCustomerCredentials(), "Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD");
    await loginViaLoginPage(page);
  });

  test("empty cart redirects or shows empty state at checkout", async ({ page }) => {
    await clearCart(page);
    await page.goto("/checkout");
    const onCheckout = page.url().includes("/checkout");
    if (onCheckout) {
      await expect(
        page.getByText(/Nothing to checkout yet|Explore the collection|Your bag is waiting/i).first(),
      ).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/login|\/cart/);
    }
  });
});

test.describe("Cash on Delivery", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasCustomerCredentials(), "Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD");
    await loginViaLoginPage(page);
    await prepareAuthenticatedCheckoutCart(page);
  });

  test("COD order completes to success page", async ({ page, request }) => {
    test.skip(!(await launchProductHasStock(request)), LAUNCH_PRODUCT_OUT_OF_STOCK_MESSAGE);
    await gotoCheckoutWithItems(page);
    await fillCheckoutForm(page);
    await selectPaymentMethod(page, "cod");
    await page.getByRole("button", { name: "Review & Place Order" }).click();
    await page.getByRole("heading", { name: "Review your order" }).waitFor({ state: "visible" });
    await placeOrderFromReview(page);

    await expectCheckoutSuccess(page);
  });
});
