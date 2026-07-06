import type { CartItem } from "./cart-types";

export const CART_STORAGE_KEY = "bbc_cart_v1";
export const SAVED_STORAGE_KEY = "bbc_saved_v1";

export function normalizeCartItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Partial<CartItem>;
      if (!row.productId || typeof row.quantity !== "number") return null;
      return {
        productId: row.productId,
        variantId: row.variantId ?? null,
        quantity: row.quantity,
        addedAt: row.addedAt ?? Date.now(),
        name: row.name ?? "Product",
        slug: row.slug ?? "",
        price: row.price ?? 0,
        compareAtPrice: row.compareAtPrice ?? null,
        variantName: row.variantName ?? null,
        imageUrl: row.imageUrl ?? null,
        categoryId: row.categoryId ?? null,
        brandId: row.brandId ?? null,
        stock: row.stock ?? 99,
        inStock: row.inStock ?? true,
        gstRate: row.gstRate ?? 12,
      };
    })
    .filter((item): item is CartItem => item !== null);
}

export function readCartStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    return normalizeCartItems(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writeCartStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function readSavedStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    if (!raw) return [];
    return normalizeCartItems(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writeSavedStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(items));
}
