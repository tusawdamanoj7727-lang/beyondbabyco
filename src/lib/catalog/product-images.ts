import { isLegacyOrMissingProductImage } from "@/lib/catalog/product-category-images";
import { IMAGES, PRODUCT_IMAGES_BY_SLUG } from "@/lib/images";

/** Hero images for the launch storefront catalog (self-hosted). */
export const SEVEN_PRODUCT_UNSPLASH: Record<string, string> = {
  "baby-wipes": IMAGES.products.baby_wipes,
  "baby-hair-oil-100ml": PRODUCT_IMAGES_BY_SLUG["baby-hair-oil-100ml"]!,
  "baby-massage-oil-100ml": PRODUCT_IMAGES_BY_SLUG["baby-massage-oil-100ml"]!,
  "baby-body-wash-200ml": PRODUCT_IMAGES_BY_SLUG["baby-body-wash-200ml"]!,
  "baby-lotion-200ml": PRODUCT_IMAGES_BY_SLUG["baby-lotion-200ml"]!,
  "baby-diaper-rash-cream-50gm": PRODUCT_IMAGES_BY_SLUG["baby-diaper-rash-cream-50gm"]!,
  "baby-shampoo-200ml": PRODUCT_IMAGES_BY_SLUG["baby-shampoo-200ml"]!,
  "tummy-rollon-40ml": PRODUCT_IMAGES_BY_SLUG["tummy-rollon-40ml"]!,
};

export const PRODUCT_UNITS_BY_SLUG: Record<string, string> = {
  "baby-wipes": "72 wipes",
  "baby-hair-oil-100ml": "100 ml",
  "baby-massage-oil-100ml": "100 ml",
  "baby-body-wash-200ml": "200 ml",
  "baby-lotion-200ml": "200 ml",
  "baby-diaper-rash-cream-50gm": "50 gm",
  "baby-shampoo-200ml": "200 ml",
  "tummy-rollon-40ml": "40 ml",
};

const FALLBACK_IMAGE = IMAGES.products.placeholder;

export function resolveSevenProductImage(slug: string, dbUrl?: string | null): string {
  const mapped = SEVEN_PRODUCT_UNSPLASH[slug];
  if (slug === "baby-wipes") {
    const db = dbUrl?.trim();
    if (db && !isLegacyOrMissingProductImage(db)) return db;
  }
  return mapped ?? FALLBACK_IMAGE;
}

export function productUnit(slug: string): string {
  return PRODUCT_UNITS_BY_SLUG[slug] ?? "";
}
