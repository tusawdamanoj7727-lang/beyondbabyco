import "server-only";

import { revalidatePath } from "next/cache";

/** Refresh storefront surfaces when product media changes. */
export function revalidateProductStorefront(productSlug?: string | null) {
  revalidatePath("/");
  revalidatePath("/products");
  if (productSlug) revalidatePath(`/products/${productSlug}`);
  revalidatePath("/search");
  revalidatePath("/wishlist");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}
