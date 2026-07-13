import { test, expect } from "@playwright/test";

import { hasCustomerCredentials, loginViaLoginPage } from "./helpers/auth.helpers";
import { addLaunchProductFromPdp, clearCart } from "./helpers/cart.helpers";
import {
  fillCheckoutForm,
  openCheckoutReview,
  placeOrderFromReview,
  selectPaymentMethod,
} from "./helpers/checkout.helpers";
import { FAKE_ORDER_ID } from "./helpers/constants";
import { installRazorpayMock } from "./helpers/razorpay.mock";

test.describe("Razorpay checkout", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasCustomerCredentials(), "Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD");
    await clearCart(page);
    await loginViaLoginPage(page);
    await addLaunchProductFromPdp(page);
  });

  test("mocked Razorpay success lands on success page", async ({ page }) => {
    await installRazorpayMock(page, "success");
    await page.goto("/checkout");
    await fillCheckoutForm(page);

    const razorpayRadio = page.getByRole("radio", { name: /Pay Online/ });
    if (await razorpayRadio.isDisabled()) {
      test.skip(true, "Razorpay not available in this environment");
    }
    await selectPaymentMethod(page, "razorpay");
    await page.getByRole("button", { name: "Review & Place Order" }).click();
    await page.getByRole("heading", { name: "Review your order" }).waitFor({ state: "visible" });
    await placeOrderFromReview(page);

    await expect(page).toHaveURL(/\/checkout\/success\?orderId=/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible();
  });

  test("mocked Razorpay dismiss navigates to failure page", async ({ page }) => {
    await installRazorpayMock(page, "dismiss");
    await page.goto("/checkout");
    await fillCheckoutForm(page);

    const razorpayRadio = page.getByRole("radio", { name: /Pay Online/ });
    if (await razorpayRadio.isDisabled()) {
      test.skip(true, "Razorpay not available in this environment");
    }
    await selectPaymentMethod(page, "razorpay");
    await openCheckoutReview(page);
    await placeOrderFromReview(page);

    await expect(page).toHaveURL(/\/checkout\/failure\?orderId=.*reason=cancelled/, {
      timeout: 30_000,
    });
    await expect(page.getByRole("heading", { name: "Payment not completed" })).toBeVisible();
  });

  test("mocked Razorpay payment.failed keeps user on checkout", async ({ page }) => {
    await installRazorpayMock(page, "failed");
    await page.goto("/checkout");
    await fillCheckoutForm(page);

    const razorpayRadio = page.getByRole("radio", { name: /Pay Online/ });
    if (await razorpayRadio.isDisabled()) {
      test.skip(true, "Razorpay not available in this environment");
    }
    await selectPaymentMethod(page, "razorpay");
    await openCheckoutReview(page);
    await placeOrderFromReview(page);

    await expect(page).toHaveURL(/\/checkout/, { timeout: 15_000 });
    await expect(page.getByText(/Payment failed|try again/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe("Payment failure page", () => {
  test("shows cancelled message", async ({ page }) => {
    await page.goto(`/checkout/failure?orderId=${FAKE_ORDER_ID}&reason=cancelled`);
    await expect(page.getByRole("heading", { name: "Payment not completed" })).toBeVisible();
    await expect(page.getByText(/cancelled the payment/i)).toBeVisible();
    await expect(page.getByRole("link", { name: "Retry Checkout" })).toBeVisible();
  });

  test("shows verify failure message", async ({ page }) => {
    await page.goto(`/checkout/failure?orderId=${FAKE_ORDER_ID}&reason=verify`);
    await expect(page.getByText(/couldn't verify|verify your payment/i)).toBeVisible();
  });

  test("shows generic failed message", async ({ page }) => {
    await page.goto(`/checkout/failure?orderId=${FAKE_ORDER_ID}&reason=failed`);
    await expect(page.getByText(/Payment failed/i)).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Cart" })).toBeVisible();
  });

  test("shows timeout message", async ({ page }) => {
    await page.goto(`/checkout/failure?orderId=${FAKE_ORDER_ID}&reason=timeout`);
    await expect(page.getByText(/timed out/i)).toBeVisible();
  });
});
