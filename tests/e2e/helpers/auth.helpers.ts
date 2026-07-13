import type { Page } from "@playwright/test";

import { TEST_CUSTOMER } from "./constants";

export function hasCustomerCredentials(): boolean {
  return Boolean(TEST_CUSTOMER.email && TEST_CUSTOMER.password);
}

export async function loginViaLoginPage(
  page: Page,
  email = TEST_CUSTOMER.email,
  password = TEST_CUSTOMER.password,
): Promise<void> {
  await page.goto("/login");
  await page.getByPlaceholder("Email address").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign In →" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 });
}

export async function registerViaLoginTab(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByRole("button", { name: "Create Account", exact: true }).click();
  await page.getByPlaceholder("Your full name").fill("E2E Register User");
  await page.getByPlaceholder("Email address").fill(email);
  await page.getByPlaceholder("Password").fill("E2eTestPass123!");
  await page.getByRole("button", { name: "Create Account →" }).click();
}

export async function registerViaRegisterPage(page: Page, email: string): Promise<void> {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("E2E Register User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("E2eTestPass123!");
  await page.getByLabel("Confirm password").fill("E2eTestPass123!");
  await page.getByRole("button", { name: "Create Account" }).click();
}
