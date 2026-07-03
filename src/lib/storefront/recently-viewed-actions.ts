"use server";

import { getStorefrontProductsByIds } from "@/lib/catalog/storefront";
import type { StorefrontProduct } from "@/lib/catalog/types";

export async function fetchRecentlyViewedProducts(
  ids: string[],
  excludeId?: string,
): Promise<StorefrontProduct[]> {
  const filtered = ids.filter((id) => id !== excludeId).slice(0, 8);
  if (filtered.length === 0) return [];
  return getStorefrontProductsByIds(filtered);
}
