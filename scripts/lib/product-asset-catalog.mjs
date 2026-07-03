/** Product shot definitions — Phase 8.5 premium photography. */

export const PHASE = "phase-8-5";

export const NEGATIVE =
  "text, watermark, logo, brand name, typography, letters, readable label, deformed hands, extra fingers, distorted fingers, blurry face, blurry, low quality, cartoon, oversaturated, cluttered, hallucinated packaging";

const STYLE =
  "85mm lens, shallow depth of field, soft morning sunlight, warm luxury editorial lighting, commercial advertising quality, cream pastel sage warm beige palette, safe clean premium natural family mood, minimal BeyondBabyCo-style baby care packaging without readable text or logos, correct proportions, no watermark";

export function productPrompt(product, scene) {
  const name = product.name?.trim() || "baby care product";
  const category = product.categoryName?.trim() || "baby care";
  return `${STYLE}, BeyondBabyCo ${category}, ${name}, ${scene}`;
}

/** @type {Array<{ slug: string; group: string; scene: string; w: number; h: number; packagingBoost?: number; emotionBoost?: number }>} */
export const PACKAGING_SHOTS = [
  { slug: "front", group: "packaging", scene: "front pack shot centered on white seamless, studio lighting", w: 1024, h: 1024, packagingBoost: 18 },
  { slug: "front-45", group: "packaging", scene: "front 45 degree angle packaging hero shot", w: 1024, h: 1024, packagingBoost: 17 },
  { slug: "back", group: "packaging", scene: "back of package ingredients panel area, no readable text", w: 1024, h: 1024, packagingBoost: 14 },
  { slug: "side", group: "packaging", scene: "side profile packaging with soft shadow", w: 1024, h: 1024, packagingBoost: 14 },
  { slug: "top", group: "packaging", scene: "top down view cap and lid flat lay", w: 1024, h: 1024, packagingBoost: 12 },
  { slug: "open-package", group: "packaging", scene: "open package showing product inside", w: 1024, h: 1024, packagingBoost: 15 },
  { slug: "macro-packaging", group: "packaging", scene: "macro close-up packaging texture and material quality", w: 1024, h: 1024, packagingBoost: 13 },
  { slug: "white-background", group: "packaging", scene: "hero product pure white background soft shadow", w: 1024, h: 1024, packagingBoost: 18 },
  { slug: "transparent-cutout", group: "packaging", scene: "product isolated cutout floating on white", w: 1024, h: 1024, packagingBoost: 15 },
  { slug: "shelf-display", group: "packaging", scene: "premium retail shelf display cream backdrop", w: 1280, h: 960, packagingBoost: 14 },
  { slug: "cap-detail", group: "packaging", scene: "close-up pump cap closure detail premium packaging", w: 1024, h: 1024, packagingBoost: 12 },
];

export const LIFESTYLE_SHOTS = [
  { slug: "mother-holding", group: "lifestyle", scene: "Indian mother holding product smiling, nursery morning light", w: 1280, h: 960, emotionBoost: 14 },
  { slug: "mother-applying", group: "lifestyle", scene: "mother gently applying product on baby, tender care", w: 1280, h: 960, emotionBoost: 14 },
  { slug: "baby-using", group: "lifestyle", scene: "happy baby during gentle care routine with product", w: 1280, h: 960, emotionBoost: 13 },
  { slug: "nursery-scene", group: "lifestyle", scene: "premium nursery changing table with product, cream sage decor", w: 1280, h: 960, emotionBoost: 11 },
  { slug: "bathroom-scene", group: "lifestyle", scene: "luxury bathroom marble shelf with product soft steam light", w: 1280, h: 960, emotionBoost: 10 },
  { slug: "morning-routine", group: "lifestyle", scene: "morning sunlight family care routine", w: 1280, h: 960, emotionBoost: 12 },
  { slug: "bedtime-routine", group: "lifestyle", scene: "bedtime lamp warm calm baby care moment", w: 1280, h: 960, emotionBoost: 11 },
  { slug: "cotton-towel", group: "lifestyle", scene: "white cotton towel spa composition with product", w: 1280, h: 960, emotionBoost: 9 },
  { slug: "wood-table", group: "lifestyle", scene: "natural light wood table composition botanical props", w: 1280, h: 960, emotionBoost: 9 },
  { slug: "gift-composition", group: "lifestyle", scene: "premium gift ribbon cream paper composition", w: 1280, h: 960, emotionBoost: 10 },
  { slug: "family-moment", group: "lifestyle", scene: "Indian family bonding moment product visible authentic warmth", w: 1280, h: 960, emotionBoost: 13 },
];

export const MARKETING_SHOTS = [
  { slug: "floating-product", group: "marketing", scene: "floating product soft shadow minimal premium", w: 1024, h: 1024, packagingBoost: 14 },
  { slug: "glass-composition", group: "marketing", scene: "glass morphism panel modern premium product showcase", w: 1280, h: 960, packagingBoost: 11 },
  { slug: "cream-background", group: "marketing", scene: "soft cream gradient background hero product", w: 1280, h: 720, packagingBoost: 12 },
  { slug: "botanical-composition", group: "marketing", scene: "botanical leaves sage cream marketing composition", w: 1280, h: 960, packagingBoost: 10 },
  { slug: "premium-ad", group: "marketing", scene: "luxury advertising composition dramatic soft light", w: 1280, h: 960, packagingBoost: 12 },
  { slug: "hero-banner", group: "marketing", scene: "wide cinematic hero banner product left third negative space", w: 1920, h: 800, packagingBoost: 13 },
  { slug: "pastel-banner", group: "marketing", scene: "pastel sage wide banner composition ecommerce", w: 1536, h: 864, packagingBoost: 10 },
  { slug: "social-square", group: "marketing", scene: "square social media product composition centered", w: 1024, h: 1024, packagingBoost: 9 },
];

export const INGREDIENT_SHOTS = [
  { slug: "ingredient-flat-lay", group: "ingredients", scene: "ingredient flat lay aloe chamomile calendula with product", w: 1024, h: 1024, packagingBoost: 8 },
  { slug: "botanical-composition", group: "ingredients", scene: "botanical leaves flowers natural ingredient arrangement", w: 1024, h: 1024, packagingBoost: 7 },
  { slug: "water-droplets", group: "ingredients", scene: "fresh water droplets pure clean ingredient mood", w: 1024, h: 1024, packagingBoost: 6 },
  { slug: "texture-closeup", group: "ingredients", scene: "cream lotion texture macro close-up smooth", w: 1024, h: 1024, packagingBoost: 7 },
  { slug: "natural-composition", group: "ingredients", scene: "natural organic ingredient premium cosmetic layout", w: 1024, h: 1024, packagingBoost: 7 },
  { slug: "vitamin-composition", group: "ingredients", scene: "vitamin E golden drops coconut shea ingredient story", w: 1024, h: 1024, packagingBoost: 6 },
];

export const ALL_SHOTS = [...PACKAGING_SHOTS, ...LIFESTYLE_SHOTS, ...MARKETING_SHOTS, ...INGREDIENT_SHOTS];

export const PRODUCT_SUBFOLDERS = ["Packaging", "Lifestyle", "Marketing", "Ingredients"];

export const BATCHES = {
  1: [
    "pure-gentle-water-baby-wipes",
    "sensitive-skin-water-wipes",
    "calendula-gentle-baby-wash",
    "organic-botanical-baby-wash",
    "tear-free-baby-shampoo",
    "2-in-1-wash-shampoo",
  ],
  2: [
    "shea-butter-baby-lotion",
    "sensitive-daily-lotion",
    "diaper-rash-protection-cream",
    "soothing-night-cream",
    "coconut-nourishing-baby-oil",
    "ayurvedic-massage-oil",
  ],
  3: [
    "natural-talc-free-powder",
    "mild-baby-soap-bars",
    "zinc-diaper-rash-cream",
    "newborn-essentials-gift-set",
    "daily-care-gift-hamper",
    "premium-discovery-gift-set",
    "travel-essentials-kit",
    "on-the-go-wipes-wash-kit",
    "soft-cotton-washcloth-set",
    "bamboo-wipes-dispenser",
  ],
};

export function altText(product, shot) {
  const group = shot.group.charAt(0).toUpperCase() + shot.group.slice(1);
  const label = shot.slug.replace(/-/g, " ");
  return `${product.name} — ${group}: ${label} | BeyondBabyCo`;
}

export function folderGroupKey(group) {
  const map = {
    packaging: "Packaging",
    lifestyle: "Lifestyle",
    ingredients: "Ingredients",
    marketing: "Marketing",
  };
  return map[group] ?? "Packaging";
}

export function shotKey(productSlug, shotSlug) {
  return `${productSlug}/${shotSlug}`;
}
