import { test } from "@playwright/test";

import { assertAccessibilitySmoke } from "./helpers/a11y.helpers";
import { LAUNCH_PRODUCT_SLUG } from "./helpers/constants";

const PAGES: {
  path: string;
  name: string;
  requireNav?: boolean;
  headingLevel?: "h1" | "any";
}[] = [
  { path: "/", name: "homepage" },
  { path: "/products", name: "products" },
  { path: `/products/${LAUNCH_PRODUCT_SLUG}`, name: "product-detail" },
  { path: "/cart", name: "cart", headingLevel: "any" },
  { path: "/login", name: "login", requireNav: false, headingLevel: "any" },
  { path: "/register", name: "register", requireNav: false, headingLevel: "any" },
  { path: "/forgot-password", name: "forgot-password", requireNav: false, headingLevel: "any" },
  { path: "/contact", name: "contact" },
  { path: "/faq", name: "faq" },
];

test.describe("Accessibility smoke checks", () => {
  for (const { path, name, requireNav, headingLevel } of PAGES) {
    test(`${name} (${path}) passes smoke checks`, async ({ page }) => {
      await page.goto(path);
      await assertAccessibilitySmoke(page, name, { requireNav, headingLevel });
    });
  }
});
