/**
 * One-off production cross-browser/viewport audit.
 * Run: npx playwright test production-audit.spec.ts --config=playwright.production.config.ts
 */
import { test, expect } from "@playwright/test";

import { hasCustomerCredentials, loginViaLoginPage } from "./helpers/auth.helpers";
import { addLaunchProductFromPdp, clearCart } from "./helpers/cart.helpers";
import { gotoCheckoutWithItems, selectPaymentMethod } from "./helpers/checkout.helpers";

const VIEWPORTS = [
  { name: "iPhone 14", width: 390, height: 844, isMobile: true },
  { name: "Android Pixel 5", width: 393, height: 851, isMobile: true },
  { name: "iPad Tablet", width: 768, height: 1024, isMobile: true },
  { name: "Desktop", width: 1280, height: 800, isMobile: false },
] as const;

const MIN_TOUCH_TARGET = 44;

for (const vp of VIEWPORTS) {
  test.describe(`Production audit — ${vp.name}`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });

    test("homepage, nav, and search work", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("navigation", { name: "Site navigation" })).toBeVisible();

      if (vp.width < 1024) {
        await page.getByRole("button", { name: /Open menu/i }).click();
        await page.getByRole("dialog", { name: "Mobile navigation menu" }).getByRole("link", { name: "Products" }).click();
      } else {
        await page.getByRole("navigation", { name: "Site navigation" }).getByRole("link", { name: "Products" }).click();
      }
      await expect(page).toHaveURL(/\/products/);

      const searchInput = page.locator("#catalog-q").or(page.getByLabel("Search products"));
      await searchInput.fill("wipes");
      await searchInput.press("Enter");
      await expect(page).toHaveURL(/\/search\?q=wipes/);
    });

    test("cart add and mini-cart on touch viewport", async ({ page }) => {
      await clearCart(page);
      await addLaunchProductFromPdp(page);
      await expect(page.getByRole("dialog", { name: /Your Cart/i })).toBeVisible();
      await page.getByRole("button", { name: "Close cart" }).click();
      await page.goto("/cart");
      await expect(page.getByRole("heading", { name: /My Cart/i })).toBeVisible();
    });

    test("primary touch targets meet 44px minimum", async ({ page }) => {
      await page.goto("/");
      const selectors = [
        'button:has-text("Open menu")',
        'a[href="/cart"]',
        'button:has-text("Add to Cart")',
      ];

      if (vp.width < 1024) {
        const menuBtn = page.getByRole("button", { name: /Open menu/i });
        const box = await menuBtn.boundingBox();
        expect(box, "Open menu touch target").not.toBeNull();
        if (box) {
          expect(Math.min(box.width, box.height), "Open menu min dimension").toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        }
      }

      await page.goto("/products/baby-wipes");
      const addBtn = page.getByRole("button", { name: /Add to Cart/i }).first();
      await addBtn.waitFor({ state: "visible" });
      const addBox = await addBtn.boundingBox();
      expect(addBox, "Add to Cart touch target").not.toBeNull();
      if (addBox) {
        expect(Math.min(addBox.width, addBox.height), "Add to Cart min dimension").toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      }
    });
  });
}

test.describe("Production audit — Safari mobile viewport", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("Safari-class mobile homepage and cart", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Open menu/i })).toBeVisible();
    await clearCart(page);
    await addLaunchProductFromPdp(page);
    await expect(page.getByRole("dialog", { name: /Your Cart/i })).toBeVisible();
  });
});

test.describe("Production audit — Razorpay UI", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasCustomerCredentials(), "Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD");
    await loginViaLoginPage(page);
    await clearCart(page);
    await addLaunchProductFromPdp(page);
  });

  test("Razorpay option visible and selectable at checkout", async ({ page }) => {
    await gotoCheckoutWithItems(page);
    const razorpayRadio = page.getByRole("radio", { name: /Pay Online/ });
    await expect(razorpayRadio).toBeVisible();
    const disabled = await razorpayRadio.isDisabled();
    if (!disabled) {
      await selectPaymentMethod(page, "razorpay");
      await expect(razorpayRadio).toBeChecked();
    }
  });
});
