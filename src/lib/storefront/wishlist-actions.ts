"use server";

import { getStorefrontProductsByIds } from "@/lib/catalog/storefront";
import {
  listWishlistProductIds,
  listWishlistProducts,
  removeWishlistProduct,
  toggleWishlistProduct,
  type WishlistActionResult,
} from "@/lib/storefront/wishlist-service";

export type { WishlistActionResult };

/** Server-component helpers — prefer /api/wishlist from client code. */
export async function toggleWishlistAction(productId: string): Promise<WishlistActionResult> {
  return toggleWishlistProduct(productId);
}

export async function removeFromWishlistAction(productId: string): Promise<WishlistActionResult> {
  return removeWishlistProduct(productId);
}

export async function getWishlistProductIds(): Promise<string[]> {
  return listWishlistProductIds();
}

export async function getWishlistProducts() {
  return listWishlistProducts();
}

export async function getPublicProductsByIds(ids: string[]) {
  return getStorefrontProductsByIds(ids);
}
