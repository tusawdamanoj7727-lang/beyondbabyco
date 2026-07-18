/**
 * Phase 11.4C — Resolve generated editorial assets with human-approved curation.
 * Only admin-approved slot assignments go live; auto-selection requires approval.
 */

import { EDITORIAL_QUALITY_THRESHOLD, GENERATED_ROOT } from "./art-direction";
import { STATIC_IMAGE_BLUR } from "@/lib/media/image-placeholder";

import { resolveRealVisual } from "./real-assets";
import {
  BABY_WIPES_PRODUCT_IMAGE,
  isLegacyOrMissingProductImage,
  resolveCategoryProductImage,
  resolveProductVisualGroup,
} from "@/lib/catalog/product-category-images";
import blurs from "./generated-blurs.json";
import selectionsData from "./asset-selections.json";
import reviewsData from "./asset-reviews.json";

export type GeneratedAngle =
  | "front"
  | "front-45"
  | "back"
  | "top"
  | "lifestyle"
  | "bathroom"
  | "nursery"
  | "shelf"
  | "reflection"
  | "packaging-closeup"
  | "transparent-png"
  | "white-background";

export type VisualRef = {
  category: string;
  slug: string;
};

const BLUR_MAP = blurs as Record<string, string>;

type SelectionEntry = {
  assigned: boolean;
  category: string;
  slug: string;
  score: number;
};

type AssetSelections = {
  threshold: number;
  slots: Record<string, SelectionEntry>;
  products: Record<string, Partial<Record<GeneratedAngle, SelectionEntry>>>;
};

const SELECTIONS = selectionsData as AssetSelections;

type ApprovedReviews = {
  reviews: Record<string, { status: string; category: string; slug: string }>;
  slotAssignments: Record<string, { assetId: string }>;
};

const REVIEWS = reviewsData as ApprovedReviews;

function approvedSlotVisual(slotKey: string): VisualRef | null {
  const assignment = REVIEWS.slotAssignments[slotKey];
  if (!assignment) return null;
  const review = REVIEWS.reviews[assignment.assetId];
  if (!review || review.status !== "approved") return null;
  return { category: review.category, slug: review.slug };
}

function isApprovedProductAsset(line: string, angle: GeneratedAngle): VisualRef | null {
  const assetId = `products/${line}/${angle}`;
  const review = REVIEWS.reviews[assetId];
  if (review?.status === "approved") return { category: "products", slug: `${line}/${angle}` };
  return null;
}

function isSelectionActive(entry: SelectionEntry | undefined): entry is SelectionEntry {
  return Boolean(entry?.assigned && entry.score >= EDITORIAL_QUALITY_THRESHOLD);
}

export function resolveSelectedVisual(slotKey: string, fallback: VisualRef) {
  const approved = approvedSlotVisual(slotKey);
  if (approved) return genVisual(approved);
  const sel = SELECTIONS.slots[slotKey];
  if (isSelectionActive(sel)) {
    const review = REVIEWS.reviews[`${sel.category}/${sel.slug}`];
    if (review?.status === "approved") return genVisual({ category: sel.category, slug: sel.slug });
  }
  return genVisual(fallback);
}

function resolveProductSelection(line: string, angle: GeneratedAngle, fallback: VisualRef) {
  const slotKey = `PRODUCT.${line}.${angle}`;
  const approved = approvedSlotVisual(slotKey);
  if (approved) return genVisual(approved);
  const assetApproved = isApprovedProductAsset(line, angle);
  if (assetApproved) return genVisual(assetApproved);
  const sel = SELECTIONS.products[line]?.[angle];
  if (isSelectionActive(sel)) {
    const review = REVIEWS.reviews[`products/${line}/${angle}`];
    if (review?.status === "approved") return genVisual({ category: sel.category, slug: sel.slug });
  }
  return genVisual(fallback);
}

/** Legacy / placeholder paths replaced by generated editorial assets. */
export const LEGACY_VISUAL_PATTERNS = [
  "product-botanical",
  "/images/brand/",
  "/images/placeholders/",
  "placehold.co",
  "images.unsplash.com",
  "/images/homepage/phase-8-2/",
  "/images/hero/phase-8-1/",
  "/images/generated/homepage/phase-8-2/",
  "/images/products/phase-",
  ".svg",
] as const;

export function genPath(category: string, slug: string, format: "webp" | "avif" | "png" = "webp"): string {
  return `${GENERATED_ROOT}/${category}/${slug}.${format}`;
}

export function genBlur(category: string, slug: string): string {
  return BLUR_MAP[`${category}/${slug}`] ?? STATIC_IMAGE_BLUR;
}

export function genVisual({ category, slug }: VisualRef, format: "webp" | "avif" = "webp") {
  const real = resolveRealVisual(category, slug);
  if (real) return real;
  return {
    url: genPath(category, slug, format),
    blur: genBlur(category, slug),
  };
}

export function shouldUseGeneratedAsset(url: string | null | undefined): boolean {
  if (!url?.trim()) return true;
  const lower = url.toLowerCase();
  // Prefer generated/self-hosted product assets over placeholders, Unsplash, and SVGs.
  if (lower.includes("/images/placeholders/") || lower.includes(".svg")) return true;
  if (lower.includes("/images/generated/products/")) return false;
  if (isLegacyOrMissingProductImage(url)) return true;
  return LEGACY_VISUAL_PATTERNS.some((p) => lower.includes(p));
}

export function resolveVisualUrl(
  url: string | null | undefined,
  fallback: VisualRef,
  format: "webp" | "avif" = "webp",
): { url: string; blur: string } {
  if (!shouldUseGeneratedAsset(url)) {
    return { url: url!.trim(), blur: STATIC_IMAGE_BLUR };
  }
  return genVisual(fallback, format);
}

/** Map product / category slug to Phase 11.3 product line folder. */
export function resolveProductLine(slug: string, categorySlug?: string | null): string {
  const s = slug.toLowerCase();
  const cat = (categorySlug ?? "").toLowerCase();

  if (s.includes("wipes") || cat.includes("baby-wipes")) return "baby-wipes";
  if (s.includes("shampoo") || s.includes("wash-shampoo") || cat.includes("baby-shampoo")) return "baby-shampoo";
  if (s.includes("powder") || cat.includes("baby-powder")) return "baby-powder";
  if (s.includes("lotion") || cat.includes("baby-lotion")) return "baby-lotion";
  if (s.includes("oil") || s.includes("massage") || cat.includes("baby-oil") || cat.includes("massage")) return "baby-oil";
  if (s.includes("gift") || s.includes("hamper") || cat.includes("gift")) return "gift-box";
  if (s.includes("newborn") || s.includes("essentials-kit") || s.includes("discovery")) return "newborn-kit";
  if (s.includes("wash") || s.includes("soap") || cat.includes("baby-wash") || cat.includes("baby-soap")) return "baby-wash";
  if (s.includes("cream") || s.includes("rash") || cat.includes("baby-cream")) return "baby-lotion";

  if (cat.includes("baby-wipes")) return "baby-wipes";
  if (cat.includes("baby-shampoo")) return "baby-shampoo";
  if (cat.includes("baby-lotion")) return "baby-lotion";
  if (cat.includes("baby-oil")) return "baby-oil";
  if (cat.includes("baby-powder")) return "baby-powder";
  if (cat.includes("gift")) return "gift-box";

  return "baby-wash";
}

export function productRenderPath(line: string, angle: GeneratedAngle): string {
  return genPath("products", `${line}/${angle}`);
}

export function productRenderBlur(line: string, angle: GeneratedAngle): string {
  return genBlur("products", `${line}/${angle}`);
}

export function resolveProductVisual(input: {
  slug: string;
  categorySlug?: string | null;
  imageUrl?: string | null;
  imageBlurDataUrl?: string | null;
  angle?: GeneratedAngle;
}): { imageUrl: string; imageBlurDataUrl: string } {
  const group = resolveProductVisualGroup(input.categorySlug, input.slug);

  if (group === "wipes") {
    if (!isLegacyOrMissingProductImage(input.imageUrl)) {
      return {
        imageUrl: input.imageUrl!.trim(),
        imageBlurDataUrl: input.imageBlurDataUrl?.trim() || STATIC_IMAGE_BLUR,
      };
    }
    return {
      imageUrl: BABY_WIPES_PRODUCT_IMAGE,
      imageBlurDataUrl: input.imageBlurDataUrl?.trim() || STATIC_IMAGE_BLUR,
    };
  }

  if (!isLegacyOrMissingProductImage(input.imageUrl)) {
    return {
      imageUrl: input.imageUrl!.trim(),
      imageBlurDataUrl: input.imageBlurDataUrl?.trim() || STATIC_IMAGE_BLUR,
    };
  }

  return resolveCategoryProductImage({
    categorySlug: input.categorySlug,
    productSlug: input.slug,
  });
}

const PDP_GALLERY_ANGLES: GeneratedAngle[] = [
  "front",
  "front-45",
  "lifestyle",
  "bathroom",
  "nursery",
  "white-background",
  "reflection",
  "transparent-png",
];

export function resolveProductGalleryImages(
  slug: string,
  categorySlug: string | null | undefined,
  dbImages: { id: string; url: string; alt: string | null; isPrimary: boolean; blurDataUrl?: string | null }[],
): { id: string; url: string; alt: string | null; isPrimary: boolean; blurDataUrl: string | null }[] {
  const usable = dbImages.filter((img) => !isLegacyOrMissingProductImage(img.url));
  if (usable.length > 0) {
    return usable.map((img) => ({
      ...img,
      blurDataUrl: img.blurDataUrl ?? STATIC_IMAGE_BLUR,
    }));
  }

  const visual = resolveProductVisual({ slug, categorySlug });
  const productName = slug.replace(/-/g, " ");

  return [
    {
      id: `category-${slug}`,
      url: visual.imageUrl,
      alt: `${productName} | BeyondBabyCo`,
      isPrimary: true,
      blurDataUrl: visual.imageBlurDataUrl,
    },
  ];
}

/** Category card slug → generated categories asset. */
export function categoryGeneratedSlug(titleOrSlug: string): VisualRef {
  const key = titleOrSlug.toLowerCase();
  if (key.includes("wipes")) return { category: "categories", slug: "baby-wipes" };
  if (key.includes("shampoo")) return { category: "categories", slug: "baby-shampoo" };
  if (key.includes("wash") || key.includes("bath")) return { category: "categories", slug: "baby-wash" };
  if (key.includes("lotion")) return { category: "categories", slug: "baby-lotion" };
  if (key.includes("oil")) return { category: "categories", slug: "baby-oil" };
  if (key.includes("powder")) return { category: "categories", slug: "baby-powder" };
  if (key.includes("gift")) return { category: "categories", slug: "gift-sets" };
  if (key.includes("newborn")) return { category: "gift", slug: "newborn-kit-flatlay" };
  return { category: "categories", slug: "baby-wipes" };
}

export function categoryCardUrl(titleOrSlug: string): string {
  const ref = categoryGeneratedSlug(titleOrSlug);
  return resolveSelectedVisual(`CATEGORY.${ref.slug}`, ref).url;
}

export function categoryCardBlur(titleOrSlug: string): string {
  const ref = categoryGeneratedSlug(titleOrSlug);
  return resolveSelectedVisual(`CATEGORY.${ref.slug}`, ref).blur;
}

/** Unique editorial image per research timeline year (6 entries). */
export const TIMELINE_VISUALS: VisualRef[] = [
  { category: "timeline", slug: "founding" },
  { category: "research", slug: "ingredient-study" },
  { category: "timeline", slug: "first-formulation" },
  { category: "research", slug: "safety-testing" },
  { category: "timeline", slug: "dermatology-review" },
  { category: "timeline", slug: "today" },
];

export function timelineVisual(index: number): { url: string; blur: string } {
  const ref = TIMELINE_VISUALS[index % TIMELINE_VISUALS.length];
  return resolveSelectedVisual(`TIMELINE.${index % TIMELINE_VISUALS.length}`, ref);
}

/** Editorial portrait fallbacks for testimonials. */
export const TESTIMONIAL_VISUALS: VisualRef[] = [
  { category: "lifestyle", slug: "applying-lotion" },
  { category: "lifestyle", slug: "family" },
  { category: "lifestyle", slug: "morning-routine" },
  { category: "lifestyle", slug: "father-holding-baby" },
  { category: "science", slug: "dermatologist" },
  { category: "reviews", slug: "five-star-moment" },
  { category: "lifestyle", slug: "premium-home" },
  { category: "trust", slug: "parent-approved" },
];

export function testimonialPortrait(index: number): { url: string; blur: string } {
  const ref = TESTIMONIAL_VISUALS[index % TESTIMONIAL_VISUALS.length];
  return resolveSelectedVisual(`TESTIMONIAL.${index % TESTIMONIAL_VISUALS.length}`, ref);
}

/** BrandSceneImage variant fallbacks — never SVG gradients. */
export const SCENE_FALLBACKS: Record<string, VisualRef> = {
  lifestyle: { category: "lifestyle", slug: "family" },
  science: { category: "science", slug: "lab-environment" },
  product: { category: "products", slug: "baby-wipes/front" },
  forest: { category: "backgrounds", slug: "botanical" },
};

export function sceneFallbackUrl(variant: string): { url: string; blur: string } {
  const ref = SCENE_FALLBACKS[variant] ?? SCENE_FALLBACKS.lifestyle;
  return resolveSelectedVisual(`SCENE.${variant}`, ref);
}

/** Homepage hero & section defaults — auto-selected when FLUX score >= 90. */
export const EDITORIAL = {
  hero: resolveSelectedVisual("EDITORIAL.hero", { category: "hero", slug: "gentle-care-hero" }),
  heroAlt: resolveSelectedVisual("EDITORIAL.heroAlt", { category: "hero", slug: "science-backed-hero" }),
  science: resolveSelectedVisual("EDITORIAL.science", { category: "science", slug: "dermatologist" }),
  lifestyleHero: resolveSelectedVisual("EDITORIAL.lifestyleHero", { category: "lifestyle", slug: "premium-home" }),
  lifestyleCards: [
    resolveSelectedVisual("EDITORIAL.lifestyleCards.0", { category: "lifestyle", slug: "diaper-change" }),
    resolveSelectedVisual("EDITORIAL.lifestyleCards.1", { category: "lifestyle", slug: "bath-time" }),
    resolveSelectedVisual("EDITORIAL.lifestyleCards.2", { category: "lifestyle", slug: "applying-lotion" }),
  ],
  brandPromise: [
    resolveSelectedVisual("EDITORIAL.brandPromise.0", { category: "lifestyle", slug: "premium-home" }),
    resolveSelectedVisual("EDITORIAL.brandPromise.1", { category: "lifestyle", slug: "organic-ingredients" }),
    resolveSelectedVisual("EDITORIAL.brandPromise.2", { category: "lifestyle", slug: "family" }),
  ],
  newsletter: resolveSelectedVisual("EDITORIAL.newsletter", { category: "newsletter", slug: "care-tips" }),
  newsletterAlt: resolveSelectedVisual("EDITORIAL.newsletterAlt", { category: "lifestyle", slug: "baby-sleeping" }),
  trustBackdrop: resolveSelectedVisual("EDITORIAL.trustBackdrop", { category: "reviews", slug: "testimonial-backdrop" }),
  meetFriendsBg: resolveSelectedVisual("EDITORIAL.meetFriendsBg", { category: "backgrounds", slug: "nursery" }),
} as const;

/** Science & content page imagery — auto-selected when FLUX score >= 90. */
export const CONTENT_EDITORIAL = {
  about: resolveSelectedVisual("CONTENT_EDITORIAL.about", { category: "lifestyle", slug: "family" }),
  story: resolveSelectedVisual("CONTENT_EDITORIAL.story", { category: "timeline", slug: "founding" }),
  research: resolveSelectedVisual("CONTENT_EDITORIAL.research", { category: "research", slug: "lab-bench" }),
  ingredients: resolveSelectedVisual("CONTENT_EDITORIAL.ingredients", { category: "ingredients", slug: "calendula" }),
  why: resolveSelectedVisual("CONTENT_EDITORIAL.why", { category: "lifestyle", slug: "premium-home" }),
  manufacturing: resolveSelectedVisual("CONTENT_EDITORIAL.manufacturing", { category: "research", slug: "formulation" }),
  certifications: resolveSelectedVisual("CONTENT_EDITORIAL.certifications", { category: "science", slug: "testing" }),
  safety: resolveSelectedVisual("CONTENT_EDITORIAL.safety", { category: "trust", slug: "hypoallergenic" }),
  contact: resolveSelectedVisual("CONTENT_EDITORIAL.contact", { category: "newsletter", slug: "research-updates" }),
  careers: resolveSelectedVisual("CONTENT_EDITORIAL.careers", { category: "lifestyle", slug: "morning-routine" }),
  press: genVisual({ category: "marketing", slug: "campaign-spring" }),
  scienceLab: resolveSelectedVisual("CONTENT_EDITORIAL.scienceLab", { category: "science", slug: "lab-environment" }),
  family: resolveSelectedVisual("CONTENT_EDITORIAL.family", { category: "lifestyle", slug: "family" }),
  ingredientOat: resolveSelectedVisual("CONTENT_EDITORIAL.ingredientOat", { category: "ingredients", slug: "oat-extract" }),
  ingredientChamomile: resolveSelectedVisual("CONTENT_EDITORIAL.ingredientChamomile", { category: "ingredients", slug: "chamomile" }),
  ingredientAloe: resolveSelectedVisual("CONTENT_EDITORIAL.ingredientAloe", { category: "ingredients", slug: "aloe-vera" }),
  microscope: resolveSelectedVisual("CONTENT_EDITORIAL.microscope", { category: "science", slug: "microscope" }),
  scientist: resolveSelectedVisual("CONTENT_EDITORIAL.scientist", { category: "science", slug: "scientist-portrait" }),
} as const;

export { blurForGeneratedUrl } from "./generated-blur";

/** Trust center editorial photography — auto-selected when FLUX score >= 90. */
export const TRUST_EDITORIAL = {
  research: resolveSelectedVisual("TRUST_EDITORIAL.research", { category: "research", slug: "lab-bench" }),
  ingredient: resolveSelectedVisual("TRUST_EDITORIAL.ingredient", { category: "ingredients", slug: "calendula" }),
  laboratory: resolveSelectedVisual("TRUST_EDITORIAL.laboratory", { category: "science", slug: "lab-environment" }),
  safety: resolveSelectedVisual("TRUST_EDITORIAL.safety", { category: "science", slug: "testing" }),
  dermatology: resolveSelectedVisual("TRUST_EDITORIAL.dermatology", { category: "science", slug: "dermatologist" }),
  pediatric: resolveSelectedVisual("TRUST_EDITORIAL.pediatric", { category: "science", slug: "scientist-portrait" }),
  clinical: resolveSelectedVisual("TRUST_EDITORIAL.clinical", { category: "research", slug: "safety-testing" }),
  manufacturing: resolveSelectedVisual("TRUST_EDITORIAL.manufacturing", { category: "research", slug: "formulation" }),
  quality: resolveSelectedVisual("TRUST_EDITORIAL.quality", { category: "trust", slug: "research-backed" }),
  feedback: resolveSelectedVisual("TRUST_EDITORIAL.feedback", { category: "reviews", slug: "five-star-moment" }),
  rawMaterials: resolveSelectedVisual("TRUST_EDITORIAL.rawMaterials", { category: "ingredients", slug: "oat-extract" }),
  inspection: resolveSelectedVisual("TRUST_EDITORIAL.inspection", { category: "research", slug: "ingredient-study" }),
  production: resolveSelectedVisual("TRUST_EDITORIAL.production", { category: "research", slug: "parent-feedback" }),
  packaging: resolveSelectedVisual("TRUST_EDITORIAL.packaging", { category: "products", slug: "baby-wipes/packaging-closeup" }),
  warehouse: resolveSelectedVisual("TRUST_EDITORIAL.warehouse", { category: "backgrounds", slug: "premium-home" }),
  shipping: resolveSelectedVisual("TRUST_EDITORIAL.shipping", { category: "lifestyle", slug: "morning-routine" }),
  delivery: resolveSelectedVisual("TRUST_EDITORIAL.delivery", { category: "lifestyle", slug: "family" }),
  sustainability: resolveSelectedVisual("TRUST_EDITORIAL.sustainability", { category: "lifestyle", slug: "organic-ingredients" }),
  doctorAdvisory: resolveSelectedVisual("TRUST_EDITORIAL.doctorAdvisory", { category: "science", slug: "dermatologist" }),
  trustHero: resolveSelectedVisual("TRUST_EDITORIAL.trustHero", { category: "trust", slug: "dermatologist-tested" }),
} as const;
