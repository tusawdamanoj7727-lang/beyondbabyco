/** Self-hosted editorial & product imagery (generated asset library). */
const GEN = "/images/generated";

export const IMAGES = {
  // ── HERO ──
  hero: {
    main: `${GEN}/hero/gentle-care-hero.webp`,
    mother_baby: `${GEN}/hero/gentle-care-hero.webp`,
    bath_time: `${GEN}/lifestyle/bath-time.webp`,
  },

  // ── PRODUCTS ──
  products: {
    baby_wipes: `${GEN}/products/baby-wipes/front.webp`,
    baby_lotion: `${GEN}/products/baby-lotion/front.webp`,
    baby_wash: `${GEN}/products/baby-wash/front.webp`,
    baby_oil: `${GEN}/products/baby-oil/front.webp`,
    baby_shampoo: `${GEN}/products/baby-shampoo/front.webp`,
    baby_cream: `${GEN}/products/baby-lotion/front.webp`,
    gift_set: `${GEN}/products/gift-box/front.webp`,
    massage_oil: `${GEN}/products/baby-oil/front.webp`,
    placeholder: `${GEN}/products/baby-wash/front.webp`,
  },

  // ── LIFESTYLE ──
  lifestyle: {
    bath_routine: `${GEN}/lifestyle/bath-time.webp`,
    massage_time: `${GEN}/lifestyle/applying-lotion.webp`,
    play_time: `${GEN}/lifestyle/father-holding-baby.webp`,
    sleep_time: `${GEN}/lifestyle/baby-sleeping.webp`,
    feeding_time: `${GEN}/lifestyle/morning-routine.webp`,
    outdoor: `${GEN}/lifestyle/premium-home.webp`,
  },

  // ── SCIENCE / RESEARCH ──
  research: {
    lab: `${GEN}/science/lab-environment.webp`,
    ingredients: `${GEN}/science/ingredient-research.webp`,
    testing: `${GEN}/science/testing.webp`,
    certificate: `${GEN}/science/dermatologist.webp`,
    botanicals: `${GEN}/science/microscope.webp`,
  },

  // ── CATEGORIES ──
  categories: {
    skin_care: `${GEN}/lifestyle/applying-lotion.webp`,
    hair_care: `${GEN}/lifestyle/father-holding-baby.webp`,
    bath_body: `${GEN}/lifestyle/bath-time.webp`,
    massage: `${GEN}/lifestyle/applying-lotion.webp`,
    gift_sets: `${GEN}/products/gift-box/front.webp`,
    wellness: `${GEN}/lifestyle/family.webp`,
  },

  // ── OG / SOCIAL ──
  og: {
    home: "/images/og/og-home.jpg",
    products: "/images/og/og-products.jpg",
    default: "/images/og/og-home.jpg",
  },
} as const;

/** Tracked SVG placeholders — safe for production until generated webps are deployed. */
const PRODUCT_SVG = "/images/placeholders/products";

export const LAUNCH_PRODUCT_PLACEHOLDER_IMAGES: Record<string, string> = {
  "baby-hair-oil-100ml": `${PRODUCT_SVG}/baby-oil.svg`,
  "baby-massage-oil-100ml": `${PRODUCT_SVG}/baby-oil.svg`,
  "baby-body-wash-200ml": `${PRODUCT_SVG}/baby-wash.svg`,
  "baby-lotion-200ml": `${PRODUCT_SVG}/baby-lotion.svg`,
  "baby-diaper-rash-cream-50gm": `${PRODUCT_SVG}/baby-lotion.svg`,
  "baby-shampoo-200ml": `${PRODUCT_SVG}/baby-wash.svg`,
  "tummy-rollon-40ml": `${PRODUCT_SVG}/baby-oil.svg`,
};

/** Product slug → hero image (self-hosted generated assets). */
export const PRODUCT_IMAGES_BY_SLUG: Record<string, string> = {
  "baby-wipes": IMAGES.products.baby_wipes,
  "baby-hair-oil-100ml": LAUNCH_PRODUCT_PLACEHOLDER_IMAGES["baby-hair-oil-100ml"]!,
  "baby-massage-oil-100ml": LAUNCH_PRODUCT_PLACEHOLDER_IMAGES["baby-massage-oil-100ml"]!,
  "baby-body-wash-200ml": LAUNCH_PRODUCT_PLACEHOLDER_IMAGES["baby-body-wash-200ml"]!,
  "baby-lotion-200ml": LAUNCH_PRODUCT_PLACEHOLDER_IMAGES["baby-lotion-200ml"]!,
  "baby-diaper-rash-cream-50gm": LAUNCH_PRODUCT_PLACEHOLDER_IMAGES["baby-diaper-rash-cream-50gm"]!,
  "baby-shampoo-200ml": LAUNCH_PRODUCT_PLACEHOLDER_IMAGES["baby-shampoo-200ml"]!,
  "tummy-rollon-40ml": LAUNCH_PRODUCT_PLACEHOLDER_IMAGES["tummy-rollon-40ml"]!,
  "pure-gentle-water-baby-wipes": IMAGES.products.baby_wipes,
  "ayurvedic-massage-oil": IMAGES.products.massage_oil,
  "shea-butter-baby-lotion": IMAGES.products.baby_lotion,
  "shea-butter-lotion": IMAGES.products.baby_lotion,
  "calendula-baby-wash": IMAGES.products.baby_wash,
  "gift-set": IMAGES.products.gift_set,
  "newborn-essentials-gift-set": IMAGES.products.gift_set,
  "gift-sets": IMAGES.products.gift_set,
};
