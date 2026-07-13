import { test, expect } from "@playwright/test";

test.describe("Public storefront", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Beyond|Baby/i);
  });
});

test.describe("Admin", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("unauthenticated admin redirects to login", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe("Health", () => {
  test("health endpoint responds", async ({ request }) => {
    const res = await request.get("/api/health/memory");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.memory).toBeDefined();
  });
});
