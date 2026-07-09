/**
 * Category-based product imagery — Unsplash editorial photos + approved wipes hero.
 */

import { IMAGES, PRODUCT_IMAGES_BY_SLUG } from "@/lib/images";
import { STATIC_IMAGE_BLUR } from "@/lib/media/image-placeholder";

/** Approved wipes hero — only real product photo in catalog placeholders. */
export const BABY_WIPES_PRODUCT_IMAGE = IMAGES.products.baby_wipes;

export type ProductVisualGroup = "wipes" | "wash" | "lotion" | "oil" | "gift" | "mother-care";

export const CATEGORY_PLACEHOLDER_IMAGES: Record<Exclude<ProductVisualGroup, "wipes">, string> = {
  wash: IMAGES.products.baby_wash,
  lotion: IMAGES.products.baby_lotion,
  oil: IMAGES.products.massage_oil,
  gift: IMAGES.products.gift_set,
  "mother-care": IMAGES.products.baby_cream,
};

const CATEGORY_SLUG_TO_GROUP: Record<string, ProductVisualGroup> = {
  "baby-wipes": "wipes",
  "baby-wash": "wash",
  "baby-shampoo": "wash",
  "baby-soap": "wash",
  "baby-lotion": "lotion",
  "baby-cream": "lotion",
  "baby-powder": "lotion",
  "diaper-rash-cream": "lotion",
  "baby-oil": "oil",
  "massage-oil": "oil",
  "gift-sets": "gift",
  "travel-kits": "gift",
  accessories: "gift",
  "mother-care": "mother-care",
};

/** Gradient tokens for CSS fallback cards (match SVG placeholders). */
export const CATEGORY_PLACEHOLDER_GRADIENTS: Record<Exclude<ProductVisualGroup, "wipes">, string> = {
  wash: "linear-gradient(145deg, #dbeafe 0%, #7dd3fc 48%, #e0f2fe 100%)",
  lotion: "linear-gradient(145deg, #fef3c7 0%, #fde68a 42%, #fff7ed 100%)",
  oil: "linear-gradient(145deg, #fef9c3 0%, #fcd34d 45%, #fffbeb 100%)",
  gift: "linear-gradient(145deg, #fce7f3 0%, #f9a8d4 42%, #fdf2f8 100%)",
  "mother-care": "linear-gradient(145deg, #ede9fe 0%, #c4b5fd 45%, #f5f3ff 100%)",
};

export const CATEGORY_PLACEHOLDER_LABELS: Record<Exclude<ProductVisualGroup, "wipes">, string> = {
  wash: "Baby Wash",
  lotion: "Baby Lotion",
  oil: "Baby Oil",
  gift: "Gift Sets",
  "mother-care": "Mother Care",
};

export function resolveProductVisualGroup(
  categorySlug?: string | null,
  productSlug?: string,
): ProductVisualGroup {
  const cat = (categorySlug ?? "").toLowerCase();
  if (cat && CATEGORY_SLUG_TO_GROUP[cat]) return CATEGORY_SLUG_TO_GROUP[cat];

  const slug = (productSlug ?? "").toLowerCase();
  if (slug.includes("wipes")) return "wipes";
  if (slug.includes("shampoo") || slug.includes("wash") || slug.includes("soap")) return "wash";
  if (slug.includes("lotion") || slug.includes("cream") || slug.includes("powder") || slug.includes("rash"))
    return "lotion";
  if (slug.includes("oil") || slug.includes("massage")) return "oil";
  if (slug.includes("gift") || slug.includes("hamper") || slug.includes("travel") || slug.includes("accessories"))
    return "gift";
  if (slug.includes("mother")) return "mother-care";

  return "wash";
}

export function categoryPlaceholderImage(group: ProductVisualGroup): string {
  if (group === "wipes") return BABY_WIPES_PRODUCT_IMAGE;
  return CATEGORY_PLACEHOLDER_IMAGES[group];
}

export function resolveCategoryProductImage(input: {
  categorySlug?: string | null;
  productSlug?: string;
}): { imageUrl: string; imageBlurDataUrl: string } {
  const slug = (input.productSlug ?? "").toLowerCase();
  const slugImage = slug ? PRODUCT_IMAGES_BY_SLUG[slug] : undefined;
  if (slugImage) {
    return { imageUrl: slugImage, imageBlurDataUrl: STATIC_IMAGE_BLUR };
  }

  const group = resolveProductVisualGroup(input.categorySlug, input.productSlug);
  return {
    imageUrl: categoryPlaceholderImage(group),
    imageBlurDataUrl: STATIC_IMAGE_BLUR,
  };
}

export function isLegacyOrMissingProductImage(url: string | null | undefined): boolean {
  if (!url?.trim()) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes("product-botanical") ||
    lower.includes("/images/placeholders/") ||
    lower.includes("placehold.co") ||
    lower.includes("/images/products/phase-") ||
    lower.includes("images.unsplash.com")
  );
}
