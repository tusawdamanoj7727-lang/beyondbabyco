import { test, expect } from "@playwright/test";

import { hasCustomerCredentials, loginViaLoginPage } from "./helpers/auth.helpers";
import { prepareAuthenticatedCheckoutCart } from "./helpers/cart.helpers";
import {
  expectCheckoutSuccess,
  fillCheckoutForm,
  gotoCheckoutWithItems,
  placeOrderFromReview,
  selectPaymentMethod,
} from "./helpers/checkout.helpers";
import { FAKE_ORDER_ID } from "./helpers/constants";
import { installRazorpayMock, skipIfRazorpayOrderUnavailable } from "./helpers/razorpay.mock";
import { launchProductHasStock, LAUNCH_PRODUCT_OUT_OF_STOCK_MESSAGE } from "./helpers/stock.helpers";

/**
 * Razorpay checkout tests use Playwright `page.route` to replace checkout.js and (on success)
 * `/api/verify-payment`. This validates client-side checkout routing only — not live Razorpay
 * signature verification or capture (Category C: environment / mock limitation on production).
 */
test.describe("Razorpay checkout", () => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "https://beyondbabyco.in";
  const isLocalTarget = /localhost|127\.0\.0\.1/.test(baseURL);

  test.beforeEach(async ({ page }) => {
    test.skip(!hasCustomerCredentials(), "Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD");
    test.skip(
      isLocalTarget,
      "Razorpay order-placement E2E requires production gateway credentials — run against https://beyondbabyco.in",
    );
    await loginViaLoginPage(page);
    await prepareAuthenticatedCheckoutCart(page);
  });

  test("mocked Razorpay success lands on success page", async ({ page, request }) => {
    test.skip(!(await launchProductHasStock(request)), LAUNCH_PRODUCT_OUT_OF_STOCK_MESSAGE);
    await installRazorpayMock(page, "success");
    await gotoCheckoutWithItems(page);
    await fillCheckoutForm(page);

    const razorpayRadio = page.getByRole("radio", { name: /Pay Online/ });
    if (await razorpayRadio.isDisabled()) {
      test.skip(true, "Razorpay not available in this environment");
    }
    await selectPaymentMethod(page, "razorpay");
    await page.getByRole("button", { name: "Review & Place Order" }).click();
    await page.getByRole("heading", { name: "Review your order" }).waitFor({ state: "visible" });
    await placeOrderFromReview(page);
    await skipIfRazorpayOrderUnavailable(page);

    await expectCheckoutSuccess(page);
  });

  test("mocked Razorpay dismiss navigates to failure page", async ({ page, request }) => {
    test.skip(!(await launchProductHasStock(request)), LAUNCH_PRODUCT_OUT_OF_STOCK_MESSAGE);
    await installRazorpayMock(page, "dismiss");
    await gotoCheckoutWithItems(page);
    await fillCheckoutForm(page);

    const razorpayRadio = page.getByRole("radio", { name: /Pay Online/ });
    if (await razorpayRadio.isDisabled()) {
      test.skip(true, "Razorpay not available in this environment");
    }
    await selectPaymentMethod(page, "razorpay");
    await page.getByRole("button", { name: "Review & Place Order" }).click();
    await page.getByRole("heading", { name: "Review your order" }).waitFor({ state: "visible" });
    await placeOrderFromReview(page);
    await skipIfRazorpayOrderUnavailable(page);

    await expect(page).toHaveURL(/\/checkout\/failure\?orderId=.*reason=cancelled/, {
      timeout: 45_000,
    });
    await expect(page.getByRole("heading", { name: "Payment not completed" })).toBeVisible();
  });

  test("mocked Razorpay payment.failed keeps user on checkout", async ({ page, request }) => {
    test.skip(!(await launchProductHasStock(request)), LAUNCH_PRODUCT_OUT_OF_STOCK_MESSAGE);
    await installRazorpayMock(page, "failed");
    await gotoCheckoutWithItems(page);
    await fillCheckoutForm(page);

    const razorpayRadio = page.getByRole("radio", { name: /Pay Online/ });
    if (await razorpayRadio.isDisabled()) {
      test.skip(true, "Razorpay not available in this environment");
    }
    await selectPaymentMethod(page, "razorpay");
    await page.getByRole("button", { name: "Review & Place Order" }).click();
    await page.getByRole("heading", { name: "Review your order" }).waitFor({ state: "visible" });
    await placeOrderFromReview(page);
    await skipIfRazorpayOrderUnavailable(page);

    await expect(page).toHaveURL(/\/checkout/, { timeout: 15_000 });
    await expect(page.getByText(/Payment failed\. Please try again/i)).toBeVisible({
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
