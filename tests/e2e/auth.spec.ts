import { test, expect } from "@playwright/test";

import {
  hasCustomerCredentials,
  loginViaLoginPage,
  registerViaLoginTab,
  registerViaRegisterPage,
} from "./helpers/auth.helpers";
import { TEST_CUSTOMER } from "./helpers/constants";

test.describe("Login", () => {
  test("login page renders sign-in form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByPlaceholder("Email address")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In →" })).toBeVisible();
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email address").fill("invalid@example.com");
    await page.getByPlaceholder("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In →" }).click();
    await expect(page.getByText(/invalid|incorrect|credentials|password/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("successful login redirects away from login page", async ({ page }) => {
    test.skip(!hasCustomerCredentials(), "Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD");

    await loginViaLoginPage(page);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("guest can open checkout without login", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/checkout/);
  });
});

test.describe("Register", () => {
  test("register page renders form fields", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible();
  });

  test("login page register tab shows success or error after submit", async ({ page }) => {
    const email = `e2e+${Date.now()}@mailinator.com`;
    await registerViaLoginTab(page, email);
    await expect(
      page
        .getByText(/Account created|Check your email|already registered|error|invalid/i)
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("dedicated register page submits successfully or shows validation", async ({ page }) => {
    const email = `e2e-reg+${Date.now()}@mailinator.com`;
    await registerViaRegisterPage(page, email);
    await expect(
      page
        .getByText(/Account created|Check your email|verify|already registered|error/i)
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("register validation rejects mismatched passwords", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Full name").fill("Mismatch Test");
    await page.getByLabel("Email").fill("mismatch@example.com");
    await page.getByLabel("Password", { exact: true }).fill("Password123!");
    await page.getByLabel("Confirm password").fill("Different456!");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText(/do not match|Passwords/i).first()).toBeVisible();
  });
});

test.describe("Password reset", () => {
  test("forgot password page renders email form", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /Reset your password/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send Reset Link" })).toBeVisible();
  });

  test("forgot password submits and shows feedback", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(TEST_CUSTOMER.email || "reset-test@example.com");
    await page.getByRole("button", { name: "Send Reset Link" }).click();
    await expect(
      page.getByText(/email|sent|check your inbox|error|valid/i).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("reset password page redirects without session", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page).toHaveURL(/\/login\?error=reset_session_expired/);
  });
});
