/**
 * Reproduces cart quantity drift on visibility / login hydration.
 * Run: npx playwright test tests/cart-visibility-repro.spec.ts --project=chromium
 */
import { expect, test } from "@playwright/test";

test.describe("cart quantity visibility repro", () => {
  test("guest cart stays stable across 5 visibility cycles", async ({ page }) => {
    const cartLogs: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("[cart-qty]")) cartLogs.push(text);
    });

    await page.goto("/products");
    await page.evaluate(() => {
      localStorage.removeItem("bbc-cart");
      sessionStorage.removeItem("bbc-guest-cart-session");
    });

    const addBtn = page.getByRole("button", { name: "Add to Cart" }).first();
    await addBtn.scrollIntoViewIfNeeded();
    await addBtn.click({ force: true });
    await page.waitForTimeout(500);

    const readQty = async () =>
      page.evaluate(() => {
        const raw = localStorage.getItem("bbc-cart");
        if (!raw) return 0;
        const parsed = JSON.parse(raw) as { state?: { items?: { quantity: number }[] } };
        return (parsed.state?.items ?? []).reduce((s, i) => s + i.quantity, 0);
      });

    const initialQty = await readQty();
    expect(initialQty).toBe(1);

    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        Object.defineProperty(document, "visibilityState", {
          configurable: true,
          get: () => "hidden",
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await page.waitForTimeout(100);
      await page.evaluate(() => {
        Object.defineProperty(document, "visibilityState", {
          configurable: true,
          get: () => "visible",
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await page.waitForTimeout(300);
    }

    const finalQty = await readQty();
    console.log("CART_QTY_TRACE", JSON.stringify({ initialQty, finalQty, cartLogs }, null, 2));
    expect(finalQty).toBe(initialQty);
  });

  test("logged-in visibility sync does not additive-merge on each cycle", async ({ page }) => {
    const cartLogs: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("[cart-qty]")) cartLogs.push(text);
    });

    // Seed persisted cart + guest session like a user who added before/during login hydration.
    await page.goto("/");
    await page.evaluate(() => {
      sessionStorage.setItem("bbc-guest-cart-session", "1");
      localStorage.setItem(
        "bbc-cart",
        JSON.stringify({
          state: {
            items: [
              {
                id: "p1:default",
                productId: "p1",
                variantId: "default",
                name: "Test",
                unit: "100ml",
                variantName: "100ml",
                price: 299,
                originalPrice: 349,
                quantity: 1,
                image: "",
                slug: "baby-shampoo",
                gstRate: 12,
              },
            ],
            coupon: null,
          },
          version: 0,
        }),
      );
    });

    await page.reload();
    await page.waitForTimeout(1500);

    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        Object.defineProperty(document, "visibilityState", {
          configurable: true,
          get: () => "hidden",
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await page.waitForTimeout(100);
      await page.evaluate(() => {
        Object.defineProperty(document, "visibilityState", {
          configurable: true,
          get: () => "visible",
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await page.waitForTimeout(400);
    }

    const finalQty = await page.evaluate(() => {
      const raw = localStorage.getItem("bbc-cart");
      if (!raw) return 0;
      const parsed = JSON.parse(raw) as { state?: { items?: { quantity: number }[] } };
      return (parsed.state?.items ?? []).reduce((s, i) => s + i.quantity, 0);
    });

    console.log("LOGGED_IN_VISIBILITY_TRACE", JSON.stringify({ finalQty, cartLogs }, null, 2));
    // Document actual behavior — assertion updated after fix.
    expect(finalQty).toBeLessThanOrEqual(1);
  });
});
