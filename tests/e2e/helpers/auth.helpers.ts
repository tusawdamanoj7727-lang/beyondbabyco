import { expect, type Page } from "@playwright/test";

import { TEST_CUSTOMER } from "./constants";
import { loadProductionEnv } from "./load-production-env";

export function hasCustomerCredentials(): boolean {
  loadProductionEnv();
  return Boolean(TEST_CUSTOMER.email && TEST_CUSTOMER.password);
}

async function fillControlledInput(
  page: Page,
  placeholder: string,
  value: string,
): Promise<void> {
  const input = page.getByPlaceholder(placeholder);
  await input.click();
  await input.fill("");
  await input.pressSequentially(value, { delay: 15 });
  await expect(input).toHaveValue(value);
}

export async function loginViaLoginPage(
  page: Page,
  email = TEST_CUSTOMER.email,
  password = TEST_CUSTOMER.password,
): Promise<void> {
  loadProductionEnv();

  const resolvedEmail = email || TEST_CUSTOMER.email;
  const resolvedPassword = password || TEST_CUSTOMER.password;

  if (!resolvedEmail || !resolvedPassword) {
    throw new Error("E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD must be set for login tests.");
  }

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  const authCard = page.locator(".auth-modal-card");
  await authCard.waitFor({ state: "visible", timeout: 30_000 });
  await page.getByRole("button", { name: "Sign In →" }).waitFor({ state: "visible", timeout: 30_000 });

  await fillControlledInput(page, "Email address", resolvedEmail);
  await fillControlledInput(page, "Password", resolvedPassword);

  const formError = authCard.locator(".auth-modal-alert--error");

  await page.getByRole("button", { name: "Sign In →" }).click();

  const leftLogin = page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 45_000,
    waitUntil: "commit",
  });

  const loginRejected = formError
    .waitFor({ state: "visible", timeout: 45_000 })
    .then(async () => {
      const message = (await formError.innerText()).trim();
      throw new Error(`Login rejected: ${message || "unknown error"}`);
    });

  try {
    await Promise.race([leftLogin, loginRejected]);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Login rejected:")) {
      throw error;
    }
  }

  if (page.url().includes("/login")) {
    if (await formError.isVisible()) {
      const message = (await formError.innerText()).trim();
      throw new Error(`Login rejected: ${message || "unknown error"}`);
    }

    await page.goto("/account", { waitUntil: "domcontentloaded" });
    if (page.url().includes("/login")) {
      throw new Error("Login did not establish a session — still redirected to login.");
    }
  }
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
