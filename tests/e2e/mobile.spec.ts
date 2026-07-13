import { test, expect } from "@playwright/test";

import { assertAccessibilitySmoke } from "./helpers/a11y.helpers";
import { addLaunchProductFromPdp, clearCart } from "./helpers/cart.helpers";
import { LAUNCH_PRODUCT_SLUG } from "./helpers/constants";

test.describe("Mobile viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("homepage renders on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("navigation", { name: "Site navigation" }).getByRole("link", { name: "BeyondBabyCo home" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Open menu/i })).toBeVisible();
  });

  test("mobile nav reaches products", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Open menu/i }).click();
    const drawer = page.getByRole("dialog", { name: "Mobile navigation menu" });
    await drawer.getByRole("link", { name: "Products" }).click();
    await expect(page).toHaveURL(/\/products/);
  });

  test("product page add to cart works on mobile", async ({ page }) => {
    await clearCart(page);
    await addLaunchProductFromPdp(page, LAUNCH_PRODUCT_SLUG);
    await expect(page.getByRole("dialog", { name: "Shopping cart" })).toBeVisible();
  });

  test("cart page is usable on mobile", async ({ page }) => {
    await clearCart(page);
    await addLaunchProductFromPdp(page);
    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: /My Cart/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Increase quantity" })).toBeVisible();
  });
});

test.describe("Mobile accessibility smoke", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("homepage passes mobile a11y smoke", async ({ page }) => {
    await page.goto("/");
    await assertAccessibilitySmoke(page, "mobile-homepage");
  });

  test("products page passes mobile a11y smoke", async ({ page }) => {
    await page.goto("/products");
    await assertAccessibilitySmoke(page, "mobile-products");
  });
});
