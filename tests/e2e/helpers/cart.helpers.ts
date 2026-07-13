import type { Page } from "@playwright/test";

import { LAUNCH_PRODUCT_SLUG } from "./constants";

export async function clearCart(page: Page): Promise<void> {
  await page.goto("/products");
  await page.evaluate(() => {
    localStorage.removeItem("bbc-cart");
    localStorage.removeItem("beyondbabyco-cart");
    sessionStorage.removeItem("bbc-guest-cart-session");
  });
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
  await page.goto("/cart");
  await page.getByRole("heading", { name: /My Cart/i }).waitFor({ state: "visible" });
}
