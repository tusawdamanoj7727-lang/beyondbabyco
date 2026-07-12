import "server-only";

import { revalidatePath } from "next/cache";

/** Refresh shared storefront shells (footer, nav chrome) across major routes. */
export function revalidateStorefrontPages() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/search");
  revalidatePath("/wishlist");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

/** Refresh storefront surfaces when product media changes. */
export function revalidateProductStorefront(productSlug?: string | null) {
  revalidateStorefrontPages();
  if (productSlug) revalidatePath(`/products/${productSlug}`);
}
