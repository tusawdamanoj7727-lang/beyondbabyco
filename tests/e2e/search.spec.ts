import { test, expect } from "@playwright/test";

test.describe("Search", () => {
  test("catalog search bar navigates to search results", async ({ page }) => {
    await page.goto("/products");
    const searchInput = page.locator("#catalog-q").or(page.getByLabel("Search products"));
    await searchInput.waitFor({ state: "visible", timeout: 30_000 });
    await searchInput.fill("wipes");
    await searchInput.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=wipes/);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("search page accepts query parameter", async ({ page }) => {
    await page.goto("/search?q=baby");
    await expect(page).toHaveURL(/\/search\?q=baby/);
    await expect(page.getByLabel("Search products")).toBeVisible();
  });

  test("empty search stays on search page", async ({ page }) => {
    await page.goto("/search");
    await page.getByLabel("Search products").fill("");
    await page.getByLabel("Search products").press("Enter");
    await expect(page).toHaveURL(/\/search/);
  });
});
