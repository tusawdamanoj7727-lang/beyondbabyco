/** Unsplash hero images for the 7-product launch catalog. */
export const SEVEN_PRODUCT_UNSPLASH: Record<string, string> = {
  "baby-hair-oil-100ml":
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=85",
  "baby-massage-oil-100ml":
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=85",
  "baby-body-wash-200ml":
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=85",
  "baby-lotion-200ml":
    "https://images.unsplash.com/photo-1556228578-626d52e9793d?w=600&q=85",
  "baby-diaper-rash-cream-50gm":
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=85",
  "baby-shampoo-200ml":
    "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=85",
  "tummy-rollon-40ml":
    "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=85",
};

export const PRODUCT_UNITS_BY_SLUG: Record<string, string> = {
  "baby-hair-oil-100ml": "100 ml",
  "baby-massage-oil-100ml": "100 ml",
  "baby-body-wash-200ml": "200 ml",
  "baby-lotion-200ml": "200 ml",
  "baby-diaper-rash-cream-50gm": "50 gm",
  "baby-shampoo-200ml": "200 ml",
  "tummy-rollon-40ml": "40 ml",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=85";

export function resolveSevenProductImage(slug: string, dbUrl?: string | null): string {
  return dbUrl?.trim() || SEVEN_PRODUCT_UNSPLASH[slug] || FALLBACK_IMAGE;
}

export function productUnit(slug: string): string {
  return PRODUCT_UNITS_BY_SLUG[slug] ?? "";
}
