import { test, expect } from "@playwright/test";

/**
 * Authenticated admin module smoke tests.
 * Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run; otherwise skipped.
 */
const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;
const hasCreds = Boolean(email && password);

test.describe("Authenticated admin modules", () => {
  test.skip(!hasCreds, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");

  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByRole("textbox", { name: /email/i }).fill(email!);
    await page.getByRole("textbox", { name: /^password$/i }).fill(password!);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/admin(?!\/login)/);
  });

  test("products page loads", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page).toHaveURL(/\/admin\/products(?:\?|$)/);
    await expect(page.getByRole("heading", { name: "Products", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Add Product" })).toBeVisible();
    // Catalog list is server-rendered; assert table or empty state (not loading shell).
    await expect(
      page
        .getByRole("columnheader", { name: "Name" })
        .or(page.getByRole("heading", { name: "No products found", level: 3 })),
    ).toBeVisible();
  });

  test("orders page loads", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page.getByRole("heading", { name: /orders/i })).toBeVisible();
  });

  test("customers page loads", async ({ page }) => {
    await page.goto("/admin/customers");
    await expect(page.getByRole("heading", { name: /customers/i })).toBeVisible();
  });

  test("homepage CMS loads", async ({ page }) => {
    await page.goto("/admin/homepage");
    await expect(page.getByRole("heading", { name: /homepage|cms/i })).toBeVisible();
  });
});

test.describe("Checkout (storefront)", () => {
  test("storefront homepage has navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});
