"use server";

import { searchStorefrontProducts } from "@/lib/catalog/storefront";
import type { StorefrontProduct } from "@/lib/catalog/types";

export async function searchProductsAction(query: string): Promise<StorefrontProduct[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  return searchStorefrontProducts(q, 8);
}
