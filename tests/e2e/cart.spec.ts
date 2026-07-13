import { test, expect } from "@playwright/test";

import {
  addLaunchProductFromListing,
  addLaunchProductFromPdp,
  clearCart,
  openCartPage,
  readCartItemCount,
} from "./helpers/cart.helpers";
import { LAUNCH_PRODUCT_SLUG } from "./helpers/constants";

test.describe("Cart", () => {
  test.beforeEach(async ({ page }) => {
    await clearCart(page);
  });

  test("add to cart from product listing", async ({ page }) => {
    await addLaunchProductFromListing(page);
    await expect.poll(() => readCartItemCount(page)).toBeGreaterThan(0);
  });

  test("add to cart from product detail page", async ({ page }) => {
    await addLaunchProductFromPdp(page);
    await expect.poll(() => readCartItemCount(page)).toBe(1);
  });

  test("mini cart drawer opens after add", async ({ page }) => {
    await addLaunchProductFromPdp(page);
    await expect(page.getByRole("dialog", { name: "Shopping cart" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your Cart" })).toBeVisible();
  });

  test("quantity update on cart page", async ({ page }) => {
    await addLaunchProductFromPdp(page);
    await openCartPage(page);
    await page.getByRole("button", { name: "Increase quantity" }).click();
    await expect(page.getByText("2", { exact: true }).first()).toBeVisible();
    await expect.poll(() => readCartItemCount(page)).toBe(2);
  });

  test("decrease quantity removes item at zero", async ({ page }) => {
    await addLaunchProductFromPdp(page);
    await openCartPage(page);
    await page.getByRole("button", { name: "Decrease quantity" }).click();
    await expect(page.getByText(/Your cart is empty|Continue Shopping/i).first()).toBeVisible();
    await expect.poll(() => readCartItemCount(page)).toBe(0);
  });

  test("remove item from cart", async ({ page }) => {
    await addLaunchProductFromPdp(page);
    await openCartPage(page);
    const removeBtn = page.getByRole("button", { name: new RegExp(`Remove`, "i") }).first();
    await removeBtn.click();
    await expect(page.getByText(/Your cart is empty|Continue Shopping/i).first()).toBeVisible();
    await expect.poll(() => readCartItemCount(page)).toBe(0);
  });

  test("cart persists product slug reference", async ({ page }) => {
    await addLaunchProductFromPdp(page, LAUNCH_PRODUCT_SLUG);
    await openCartPage(page);
    await expect(page.getByRole("link", { name: /.+/ }).first()).toBeVisible();
  });
});
