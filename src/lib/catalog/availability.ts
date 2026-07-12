import type { StorefrontProduct } from "@/lib/catalog/types";

/** Products currently available for purchase on the storefront. */
export const LAUNCH_PRODUCT_SLUGS = new Set([
  "baby-wipes",
  "baby-hair-oil-100ml",
  "baby-massage-oil-100ml",
  "baby-body-wash-200ml",
  "baby-lotion-200ml",
  "baby-diaper-rash-cream-50gm",
  "baby-shampoo-200ml",
  "tummy-rollon-40ml",
]);

export const LAUNCH_PRODUCT_MIN_STOCK = 500;

export function isLaunchProductSlug(slug: string): boolean {
  return LAUNCH_PRODUCT_SLUGS.has(slug);
}

export function canPurchaseProduct(
  product: Pick<StorefrontProduct, "status" | "inStock">,
): boolean {
  return product.status === "active" && product.inStock;
}

/** When variant stock is known, require at least one unit for that SKU. */
export function canPurchaseVariant(
  product: Pick<StorefrontProduct, "status" | "inStock" | "slug">,
  variantStockQuantity?: number,
): boolean {
  if (product.status !== "active") return false;
  if (variantStockQuantity != null) return variantStockQuantity > 0;
  return product.inStock;
}

export function shouldShowNotifyMe(
  product: Pick<StorefrontProduct, "status" | "inStock">,
): boolean {
  return product.status === "coming_soon" || !canPurchaseProduct(product);
}
