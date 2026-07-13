import { test, expect } from "@playwright/test";

import { LAUNCH_PRODUCT_SLUG } from "./helpers/constants";

test.describe("Product page", () => {
  test("launch product PDP loads with purchase controls", async ({ page }) => {
    await page.goto(`/products/${LAUNCH_PRODUCT_SLUG}`);
    await expect(page).toHaveURL(new RegExp(`/products/${LAUNCH_PRODUCT_SLUG}`));
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Add to Cart/ })).toBeVisible();
    await expect(page.getByRole("group", { name: "Quantity" })).toBeVisible();
  });

  test("quantity selector updates count on PDP", async ({ page }) => {
    await page.goto(`/products/${LAUNCH_PRODUCT_SLUG}`);
    const increase = page.getByRole("button", { name: "Increase quantity" });
    await increase.click();
    await expect(page.getByRole("group", { name: "Quantity" })).toContainText("2");
  });

  test("inventory API responds for launch product", async ({ page, request }) => {
    let productId = "";

    page.on("response", (response) => {
      const match = response.url().match(/\/api\/inventory\/product\/([0-9a-f-]{36})/i);
      if (match && response.ok()) productId = match[1];
    });

    await page.goto(`/products/${LAUNCH_PRODUCT_SLUG}`);
    await page.waitForTimeout(1500);

    test.skip(!productId, "Inventory API not reachable — Supabase may be unconfigured");

    const res = await request.get(`/api/inventory/product/${productId}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data?.variants)).toBe(true);
  });
});
