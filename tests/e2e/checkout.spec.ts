import { test, expect } from "@playwright/test";

import { hasCustomerCredentials, loginViaLoginPage } from "./helpers/auth.helpers";
import { addLaunchProductFromPdp, clearCart } from "./helpers/cart.helpers";
import {
  fillCheckoutForm,
  openCheckoutReview,
  placeOrderFromReview,
  selectPaymentMethod,
} from "./helpers/checkout.helpers";

test.describe("Checkout", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasCustomerCredentials(), "Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD");
    await clearCart(page);
    await loginViaLoginPage(page);
    await addLaunchProductFromPdp(page);
  });

  test("authenticated user reaches checkout page", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByRole("heading", { name: "Checkout", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Review & Place Order" })).toBeVisible();
  });

  test("checkout form sections are present", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByText("1. Customer Information")).toBeVisible();
    await expect(page.getByText("2. Shipping Address")).toBeVisible();
    await expect(page.getByText("5. Payment Method")).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Payment method" })).toBeVisible();
  });

  test("review dialog opens with order summary", async ({ page }) => {
    await page.goto("/checkout");
    await openCheckoutReview(page);
    await expect(page.getByText("Deliver to")).toBeVisible();
    await expect(page.getByRole("button", { name: "Place Order" })).toBeVisible();
  });

  test("empty cart redirects or shows empty state at checkout", async ({ page }) => {
    await clearCart(page);
    await page.goto("/checkout");
    const onCheckout = page.url().includes("/checkout");
    if (onCheckout) {
      await expect(
        page.getByText(/cart is empty|add items|Continue Shopping/i).first(),
      ).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/login|\/cart/);
    }
  });
});

test.describe("Cash on Delivery", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasCustomerCredentials(), "Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD");
    await clearCart(page);
    await loginViaLoginPage(page);
    await addLaunchProductFromPdp(page);
  });

  test("COD order completes to success page", async ({ page }) => {
    await page.goto("/checkout");
    await fillCheckoutForm(page);
    await selectPaymentMethod(page, "cod");
    await page.getByRole("button", { name: "Review & Place Order" }).click();
    await page.getByRole("heading", { name: "Review your order" }).waitFor({ state: "visible" });
    await placeOrderFromReview(page);

    await expect(page).toHaveURL(/\/checkout\/success\?orderId=/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible();
  });
});
