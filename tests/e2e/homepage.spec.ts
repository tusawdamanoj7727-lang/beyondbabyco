import { test, expect } from "@playwright/test";

import { assertAccessibilitySmoke } from "./helpers/a11y.helpers";

test.describe("Homepage", () => {
  test("loads with brand title and primary content", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Beyond|Baby/i);
    await expect(
      page.getByRole("navigation", { name: "Site navigation" }).getByRole("link", { name: "BeyondBabyCo home" }),
    ).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("passes accessibility smoke checks", async ({ page }) => {
    await page.goto("/");
    await assertAccessibilitySmoke(page, "homepage");
  });
});
