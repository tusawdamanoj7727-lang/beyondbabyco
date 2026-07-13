import { test, expect } from "@playwright/test";

import { hasCustomerCredentials, loginViaLoginPage } from "./helpers/auth.helpers";

test.describe("Account page", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Faccount/);
  });

  test("authenticated user sees account dashboard", async ({ page }) => {
    test.skip(!hasCustomerCredentials(), "Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD");

    await loginViaLoginPage(page);
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: /My Account/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /My Orders/i })).toBeVisible();
  });

  test("account orders page loads for signed-in user", async ({ page }) => {
    test.skip(!hasCustomerCredentials(), "Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD");

    await loginViaLoginPage(page);
    await page.goto("/account/orders");
    await expect(page.getByRole("heading", { name: /My Orders/i })).toBeVisible();
  });

  test("account profile page loads for signed-in user", async ({ page }) => {
    test.skip(!hasCustomerCredentials(), "Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD");

    await loginViaLoginPage(page);
    await page.goto("/account/profile");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
