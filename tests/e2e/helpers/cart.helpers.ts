import type { Page } from "@playwright/test";

import { LAUNCH_PRODUCT_SLUG } from "./constants";

async function waitForPersistedCartItems(page: Page, minCount = 1): Promise<void> {
  await page.waitForFunction(
    (min) => {
      const raw = localStorage.getItem("bbc-cart");
      if (!raw) return min === 0;
      const parsed = JSON.parse(raw) as {
        state?: { items?: { quantity: number }[] };
        items?: { quantity: number }[];
      };
      const items = parsed.state?.items ?? parsed.items ?? [];
      const count = items.reduce((sum, item) => sum + item.quantity, 0);
      return min === 0 ? count === 0 : count >= min;
    },
    minCount,
    { timeout: 20_000 },
  );
}

async function closeMiniCartIfOpen(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog", { name: /Your Cart/i });
  if (await dialog.isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Close cart" }).click();
    await dialog.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
  }
}

async function removeAllLineItemsFromCartPage(page: Page): Promise<void> {
  const removeButtons = page.getByRole("button", { name: /Remove .+ from cart/i });
  for (let i = 0; i < 20 && (await removeButtons.count()) > 0; i += 1) {
    await removeButtons.first().click();
    await page.waitForTimeout(400);
  }
}

async function clearClientCartStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem("bbc-cart");
    localStorage.removeItem("beyondbabyco-cart");
    sessionStorage.removeItem("bbc-guest-cart-session");
  });
}

/** Allow debounced server cart sync to finish for logged-in sessions. */
export async function waitForCartServerSync(page: Page): Promise<void> {
  await page.waitForTimeout(2_000);
}

export async function verifyEmptyCart(page: Page): Promise<void> {
  await page
    .getByText(/Your cart is empty|Your bag is waiting|Nothing to checkout yet/i)
    .first()
    .waitFor({ state: "visible", timeout: 10_000 });
  await waitForPersistedCartItems(page, 0);
}

export async function assertLaunchProductInCart(page: Page): Promise<void> {
  await page.goto("/cart");
  await page.getByRole("heading", { name: /My Cart|Your Cart/i }).waitFor({ state: "visible" });
  await page.getByText(/Baby Wipes/i).first().waitFor({ state: "visible", timeout: 30_000 });
}

/** Clears client cart, server-synced cart (when logged in), reloads, and verifies empty state. */
export async function clearCart(page: Page): Promise<void> {
  await closeMiniCartIfOpen(page);
  await page.goto("/cart");
  await page
    .getByRole("heading", { name: /My Cart|Your Cart|Your bag/i })
    .waitFor({ state: "visible", timeout: 15_000 })
    .catch(() => {});

  await removeAllLineItemsFromCartPage(page);
  await waitForCartServerSync(page);

  await clearClientCartStorage(page);
  await page.reload({ waitUntil: "domcontentloaded" });

  // Logged-in sessions rehydrate from server — repeat if items came back.
  if ((await page.getByRole("button", { name: /Remove .+ from cart/i }).count()) > 0) {
    await removeAllLineItemsFromCartPage(page);
    await waitForCartServerSync(page);
    await clearClientCartStorage(page);
    await page.reload({ waitUntil: "domcontentloaded" });
  }

  await verifyEmptyCart(page).catch(() => {});
  await waitForPersistedCartItems(page, 0);
  await waitForCartServerSync(page);
}

export async function addLaunchProductFromListing(page: Page): Promise<void> {
  await page.goto("/products");
  const addBtn = page.getByRole("button", { name: "Add to Cart" }).first();
  await addBtn.scrollIntoViewIfNeeded();
  await addBtn.click();
}

export async function addLaunchProductFromPdp(page: Page, slug = LAUNCH_PRODUCT_SLUG): Promise<void> {
  await page.goto(`/products/${slug}`, { waitUntil: "domcontentloaded" });
  const addBtn = page.getByRole("button", { name: /Add to Cart/ }).first();
  await addBtn.waitFor({ state: "visible", timeout: 30_000 });
  await addBtn.scrollIntoViewIfNeeded();
  await addBtn.click();
  await page.getByRole("dialog", { name: /Your Cart/i }).waitFor({ state: "visible", timeout: 30_000 });
  await waitForPersistedCartItems(page, 1);
  await waitForCartServerSync(page);
}

export async function readCartItemCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const raw = localStorage.getItem("bbc-cart");
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { state?: { items?: { quantity: number }[] } };
    return (parsed.state?.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
  });
}

export async function openCartPage(page: Page): Promise<void> {
  await closeMiniCartIfOpen(page);
  await page.goto("/cart");
  await page.getByRole("heading", { name: /My Cart|Your Cart/i }).waitFor({ state: "visible" });
}

/** Logged-in checkout prep: login first, clear server/local cart, add launch SKU, sync. */
export async function prepareAuthenticatedCheckoutCart(page: Page): Promise<void> {
  await clearCart(page);
  await addLaunchProductFromPdp(page);
  await assertLaunchProductInCart(page);
  await waitForCartServerSync(page);
}
