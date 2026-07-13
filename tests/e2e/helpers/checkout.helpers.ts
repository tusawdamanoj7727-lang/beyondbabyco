import type { Page } from "@playwright/test";

import { TEST_CUSTOMER, TEST_SHIPPING } from "./constants";

export async function fillCheckoutForm(page: Page): Promise<void> {
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
  await page.getByRole("button", { name: "Place Order" }).click();
}
