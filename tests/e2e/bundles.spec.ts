import { test, expect } from "@playwright/test";

import { clearCart, openCartPage, readCartItemCount } from "./helpers/cart.helpers";

test.describe("Bundles", () => {
  test.beforeEach(async ({ page }) => {
    await clearCart(page);
  });

  test("Daily Bath Routine adds wash, shampoo, and lotion once each", async ({ page }) => {
    await page.goto("/products");
    const bathCard = page.locator("div").filter({ hasText: "Daily Bath Routine" }).first();
    await expect(bathCard).toBeVisible();

    const addBtn = bathCard.getByRole("button", { name: /Add Bundle/i });
    await expect(addBtn).toBeEnabled({ timeout: 15_000 });
    await addBtn.click();

    await expect.poll(() => readCartItemCount(page), { timeout: 15_000 }).toBe(3);

    await openCartPage(page);
    await expect(page.getByText(/Baby Body Wash/i).first()).toBeVisible();
    await expect(page.getByText(/Baby Shampoo/i).first()).toBeVisible();
    await expect(page.getByText(/Baby Lotion/i).first()).toBeVisible();

    // Three distinct lines — not one merged line with qty 3
    const decreaseButtons = page.getByRole("button", { name: /Decrease quantity/i });
    await expect(decreaseButtons).toHaveCount(3);
  });

  test("removing one bundle line leaves the other products", async ({ page }) => {
    await page.goto("/products");
    const bathCard = page.locator("div").filter({ hasText: "Daily Bath Routine" }).first();
    await bathCard.getByRole("button", { name: /Add Bundle/i }).click();
    await expect.poll(() => readCartItemCount(page), { timeout: 15_000 }).toBe(3);

    await openCartPage(page);
    await page.getByRole("button", { name: /Remove Baby Body Wash/i }).click();

    await expect.poll(() => readCartItemCount(page)).toBe(2);
    await expect(page.getByText(/Baby Shampoo/i).first()).toBeVisible();
    await expect(page.getByText(/Baby Lotion/i).first()).toBeVisible();
    await expect(page.getByText(/Baby Body Wash/i)).toHaveCount(0);
  });
});
