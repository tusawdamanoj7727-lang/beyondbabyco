/**
 * Category-based product imagery — distinct placeholders per care line.
 * Wipes use the approved generated hero only; all other categories use placeholders.
 */

import { STATIC_IMAGE_BLUR } from "@/lib/media/image-placeholder";

/** Approved wipes hero — only real product photo in catalog placeholders. */
export const BABY_WIPES_PRODUCT_IMAGE = "/images/generated/products/baby-wipes/front.webp";

export type ProductVisualGroup = "wipes" | "wash" | "lotion" | "oil" | "gift" | "mother-care";

export const CATEGORY_PLACEHOLDER_IMAGES: Record<Exclude<ProductVisualGroup, "wipes">, string> = {
  wash: "/images/placeholders/products/baby-wash.svg",
  lotion: "/images/placeholders/products/baby-lotion.svg",
  oil: "/images/placeholders/products/baby-oil.svg",
  gift: "/images/placeholders/products/gift-sets.svg",
  "mother-care": "/images/placeholders/products/mother-care.svg",
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
    lower.includes("placeholder") ||
    lower.includes("placehold") ||
    lower.includes("unsplash") ||
    lower.includes("/images/products/phase-")
  );
}
