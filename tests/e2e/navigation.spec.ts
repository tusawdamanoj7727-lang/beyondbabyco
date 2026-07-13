import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("primary nav links are visible on desktop", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Site navigation" });
    await expect(nav.getByRole("link", { name: "Products" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Contact" })).toBeVisible();
  });

  test("Products link navigates to catalog", async ({ page }) => {
    await page.getByRole("navigation", { name: "Site navigation" }).getByRole("link", { name: "Products" }).click();
    await expect(page).toHaveURL(/\/products/);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("Cart link navigates to cart page", async ({ page }) => {
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL(/\/cart/);
  });

  test("mobile menu opens and closes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const menuBtn = page.getByRole("button", { name: /Open menu/i });
    await menuBtn.click();
    const drawer = page.getByRole("dialog", { name: "Mobile navigation menu" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Products" })).toBeVisible();
    await drawer.getByRole("button", { name: /Close menu/i }).click();
    await expect(drawer).toBeHidden();
  });
});
