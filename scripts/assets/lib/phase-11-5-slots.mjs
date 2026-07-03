/**
 * Phase 11.5 — Complete storefront slot map for editorial assignment.
 */

export const PHASE_11_5_THRESHOLD = 90;

/** Editorial asset pools (assetId prefixes or exact ids). */
export const ASSET_POOLS = {
  hero: ["hero/phase-8-1/hero-background/", "hero/phase-8-1/mother-baby/", "hero/gentle-care-hero"],
  trustHero: ["hero/phase-8-1/trust-background/", "hero/phase-8-1/hero-glass/"],
  motherBaby: ["hero/phase-8-1/mother-baby/"],
  lifestyle: ["hero/phase-8-1/mother-baby/", "hero/phase-8-1/hero-background/"],
  science: ["hero/phase-8-1/hero-glass/", "hero/phase-8-1/trust-background/"],
  newsletter: ["hero/phase-8-1/mother-baby/", "hero/phase-8-1/hero-background/"],
  community: ["hero/phase-8-1/mother-baby/"],
  timeline: ["hero/phase-8-1/hero-background/", "hero/phase-8-1/trust-background/", "hero/phase-8-1/mother-baby/"],
  product: ["hero/phase-8-1/hero-glass/"],
  ingredient: ["hero/phase-8-1/hero-glass/"],
  background: ["hero/phase-8-1/hero-glass/", "hero/phase-8-1/trust-background/"],
};

export const PRODUCT_LINES = [
  "baby-wipes",
  "baby-wash",
  "baby-lotion",
  "baby-shampoo",
  "baby-oil",
  "baby-powder",
  "gift-box",
  "newborn-kit",
  "men-care",
  "women-care",
];

export const PRODUCT_ANGLES_11_5 = [
  "front",
  "front-45",
  "bathroom",
  "nursery",
  "shelf",
  "lifestyle",
  "reflection",
  "transparent-png",
];

export const CATEGORY_SLUGS = [
  "baby-wipes",
  "baby-shampoo",
  "baby-wash",
  "baby-lotion",
  "baby-oil",
  "baby-powder",
  "gift-sets",
  "men-care",
  "women-care",
];

/** Slots → pool + fallback { category, slug }. */
export function buildPhase115Slots() {
  const slots = {};

  const editorial = {
    "EDITORIAL.hero": { pool: "hero", fallback: { category: "hero", slug: "gentle-care-hero" } },
    "EDITORIAL.heroAlt": { pool: "hero", fallback: { category: "hero", slug: "science-backed-hero" } },
    "EDITORIAL.science": { pool: "science", fallback: { category: "science", slug: "dermatologist" } },
    "EDITORIAL.lifestyleHero": { pool: "motherBaby", fallback: { category: "lifestyle", slug: "premium-home" } },
    "EDITORIAL.lifestyleCards.0": { pool: "lifestyle", fallback: { category: "lifestyle", slug: "diaper-change" } },
    "EDITORIAL.lifestyleCards.1": { pool: "lifestyle", fallback: { category: "lifestyle", slug: "bath-time" } },
    "EDITORIAL.lifestyleCards.2": { pool: "motherBaby", fallback: { category: "lifestyle", slug: "applying-lotion" } },
    "EDITORIAL.brandPromise.0": { pool: "lifestyle", fallback: { category: "lifestyle", slug: "premium-home" } },
    "EDITORIAL.brandPromise.1": { pool: "ingredient", fallback: { category: "lifestyle", slug: "organic-ingredients" } },
    "EDITORIAL.brandPromise.2": { pool: "community", fallback: { category: "lifestyle", slug: "family" } },
    "EDITORIAL.newsletter": { pool: "newsletter", fallback: { category: "newsletter", slug: "care-tips" } },
    "EDITORIAL.newsletterAlt": { pool: "motherBaby", fallback: { category: "lifestyle", slug: "baby-sleeping" } },
    "EDITORIAL.beyondCareMen": { pool: "lifestyle", fallback: { category: "men-care", slug: "grooming-routine" } },
    "EDITORIAL.beyondCareWomen": { pool: "lifestyle", fallback: { category: "women-care", slug: "self-care-routine" } },
    "EDITORIAL.trustBackdrop": { pool: "trustHero", fallback: { category: "reviews", slug: "testimonial-backdrop" } },
    "EDITORIAL.meetFriendsBg": { pool: "background", fallback: { category: "backgrounds", slug: "nursery" } },
  };

  const content = {
    "CONTENT_EDITORIAL.about": { pool: "community", fallback: { category: "lifestyle", slug: "family" } },
    "CONTENT_EDITORIAL.story": { pool: "timeline", fallback: { category: "timeline", slug: "founding" } },
    "CONTENT_EDITORIAL.research": { pool: "science", fallback: { category: "research", slug: "lab-bench" } },
    "CONTENT_EDITORIAL.ingredients": { pool: "ingredient", fallback: { category: "ingredients", slug: "calendula" } },
    "CONTENT_EDITORIAL.why": { pool: "lifestyle", fallback: { category: "lifestyle", slug: "premium-home" } },
    "CONTENT_EDITORIAL.manufacturing": { pool: "science", fallback: { category: "research", slug: "formulation" } },
    "CONTENT_EDITORIAL.certifications": { pool: "science", fallback: { category: "science", slug: "testing" } },
    "CONTENT_EDITORIAL.safety": { pool: "trustHero", fallback: { category: "trust", slug: "hypoallergenic" } },
    "CONTENT_EDITORIAL.contact": { pool: "newsletter", fallback: { category: "newsletter", slug: "research-updates" } },
    "CONTENT_EDITORIAL.careers": { pool: "lifestyle", fallback: { category: "lifestyle", slug: "morning-routine" } },
    "CONTENT_EDITORIAL.scienceLab": { pool: "science", fallback: { category: "science", slug: "lab-environment" } },
    "CONTENT_EDITORIAL.family": { pool: "community", fallback: { category: "lifestyle", slug: "family" } },
    "CONTENT_EDITORIAL.ingredientOat": { pool: "ingredient", fallback: { category: "ingredients", slug: "oat-extract" } },
    "CONTENT_EDITORIAL.ingredientChamomile": { pool: "ingredient", fallback: { category: "ingredients", slug: "chamomile" } },
    "CONTENT_EDITORIAL.ingredientAloe": { pool: "ingredient", fallback: { category: "ingredients", slug: "aloe-vera" } },
    "CONTENT_EDITORIAL.microscope": { pool: "science", fallback: { category: "science", slug: "microscope" } },
    "CONTENT_EDITORIAL.scientist": { pool: "science", fallback: { category: "science", slug: "scientist-portrait" } },
  };

  const trust = {
    "TRUST_EDITORIAL.research": { pool: "science", fallback: { category: "research", slug: "lab-bench" } },
    "TRUST_EDITORIAL.ingredient": { pool: "ingredient", fallback: { category: "ingredients", slug: "calendula" } },
    "TRUST_EDITORIAL.laboratory": { pool: "science", fallback: { category: "science", slug: "lab-environment" } },
    "TRUST_EDITORIAL.safety": { pool: "science", fallback: { category: "science", slug: "testing" } },
    "TRUST_EDITORIAL.dermatology": { pool: "science", fallback: { category: "science", slug: "dermatologist" } },
    "TRUST_EDITORIAL.pediatric": { pool: "science", fallback: { category: "science", slug: "scientist-portrait" } },
    "TRUST_EDITORIAL.clinical": { pool: "science", fallback: { category: "research", slug: "safety-testing" } },
    "TRUST_EDITORIAL.manufacturing": { pool: "science", fallback: { category: "research", slug: "formulation" } },
    "TRUST_EDITORIAL.quality": { pool: "trustHero", fallback: { category: "trust", slug: "research-backed" } },
    "TRUST_EDITORIAL.feedback": { pool: "community", fallback: { category: "reviews", slug: "five-star-moment" } },
    "TRUST_EDITORIAL.rawMaterials": { pool: "ingredient", fallback: { category: "ingredients", slug: "oat-extract" } },
    "TRUST_EDITORIAL.inspection": { pool: "ingredient", fallback: { category: "research", slug: "ingredient-study" } },
    "TRUST_EDITORIAL.production": { pool: "science", fallback: { category: "research", slug: "parent-feedback" } },
    "TRUST_EDITORIAL.packaging": { pool: "product", fallback: { category: "products", slug: "baby-wipes/packaging-closeup" } },
    "TRUST_EDITORIAL.warehouse": { pool: "background", fallback: { category: "backgrounds", slug: "premium-home" } },
    "TRUST_EDITORIAL.shipping": { pool: "lifestyle", fallback: { category: "lifestyle", slug: "morning-routine" } },
    "TRUST_EDITORIAL.delivery": { pool: "community", fallback: { category: "lifestyle", slug: "family" } },
    "TRUST_EDITORIAL.sustainability": { pool: "lifestyle", fallback: { category: "lifestyle", slug: "organic-ingredients" } },
    "TRUST_EDITORIAL.doctorAdvisory": { pool: "science", fallback: { category: "science", slug: "dermatologist" } },
    "TRUST_EDITORIAL.trustHero": { pool: "trustHero", fallback: { category: "trust", slug: "dermatologist-tested" } },
  };

  Object.assign(slots, editorial, content, trust);

  for (let i = 0; i < 6; i++) {
    slots[`TIMELINE.${i}`] = { pool: "timeline", fallback: { category: "timeline", slug: ["founding", "first-formulation", "dermatology-review", "today"][i] ?? "founding" } };
  }

  const testimonialFallbacks = [
    "applying-lotion",
    "family",
    "morning-routine",
    "father-holding-baby",
    "dermatologist",
    "five-star-moment",
    "premium-home",
    "parent-approved",
  ];
  for (let i = 0; i < 8; i++) {
    slots[`TESTIMONIAL.${i}`] = {
      pool: i % 2 === 0 ? "motherBaby" : "community",
      fallback: { category: i < 4 ? "lifestyle" : i === 4 ? "science" : i === 5 ? "reviews" : i === 6 ? "lifestyle" : "trust", slug: testimonialFallbacks[i] },
    };
  }

  slots["SCENE.lifestyle"] = { pool: "lifestyle", fallback: { category: "lifestyle", slug: "family" } };
  slots["SCENE.science"] = { pool: "science", fallback: { category: "science", slug: "lab-environment" } };
  slots["SCENE.product"] = { pool: "product", fallback: { category: "products", slug: "baby-wipes/front" } };
  slots["SCENE.forest"] = { pool: "background", fallback: { category: "backgrounds", slug: "botanical" } };

  for (const cat of CATEGORY_SLUGS) {
    slots[`CATEGORY.${cat}`] = { pool: "product", fallback: { category: "categories", slug: cat } };
  }

  for (const line of PRODUCT_LINES) {
    for (const angle of PRODUCT_ANGLES_11_5) {
      slots[`PRODUCT.${line}.${angle}`] = { pool: "product", fallback: { category: "products", slug: `${line}/${angle}` } };
    }
  }

  return slots;
}

/** FLUX scenes to generate when category has no QC-pass asset on disk. */
export const PHASE_11_5_GENERATION_GROUPS = [
  { group: "hero", count: 10, note: "Premium hero — mother, father, baby, luxury nursery" },
  { group: "science/dermatologist", count: 4, note: "Dermatologist + laboratory" },
  { group: "research/lab", count: 4, note: "Research + microscope" },
  { group: "lifestyle/diaper-change", count: 2, note: "Diaper change" },
  { group: "lifestyle/bath-time", count: 2, note: "Bath time" },
  { group: "lifestyle/sleeping-baby", count: 2, note: "Sleeping baby" },
  { group: "lifestyle/mother-baby", count: 4, note: "Morning routine, reading, playing" },
  { group: "ingredients/calendula", count: 2, note: "Macro" },
  { group: "ingredients/chamomile", count: 2, note: "Macro" },
  { group: "ingredients/aloe", count: 2, note: "Macro" },
  { group: "ingredients/oat", count: 2, note: "Macro" },
  { group: "ingredients/shea", count: 2, note: "Macro" },
  { group: "ingredients/coconut", count: 2, note: "Macro" },
  { group: "newsletter", count: 3, note: "Newsletter editorial" },
  { group: "community", count: 4, note: "Community lifestyle" },
  { group: "trust", count: 3, note: "Trust editorial" },
];

export function countPhase115Slots() {
  return Object.keys(buildPhase115Slots()).length;
}
