import { test, expect } from "@playwright/test";

import { addLaunchProductFromPdp, clearCart, openCartPage } from "./helpers/cart.helpers";
import { TEST_COUPON_CODE } from "./helpers/constants";

test.describe("Coupon", () => {
  test.beforeEach(async ({ page }) => {
    await clearCart(page);
    await addLaunchProductFromPdp(page);
    await openCartPage(page);
  });

  test("apply valid coupon shows savings message", async ({ page }) => {
    await page.getByLabel("Coupon code").fill(TEST_COUPON_CODE);
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(
      page.getByText(/Coupon applied|You save|applied/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("invalid coupon shows error", async ({ page }) => {
    await page.getByLabel("Coupon code").fill("NOTAVALIDCODE999");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/Invalid|not valid|could not/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("coupon validate API accepts known code", async ({ request }) => {
    const res = await request.post("/api/coupons/validate", {
      data: { code: TEST_COUPON_CODE, cartTotal: 999 },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data?.valid).toBe(true);
  });
});
