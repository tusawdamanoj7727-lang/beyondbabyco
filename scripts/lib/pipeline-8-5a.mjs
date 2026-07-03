/**
 * Phase 8.5A — Layered pipeline routing.
 * Layer 1: master scenes (once)
 * Layer 2: pack renders (per product, FLUX)
 * Layer 3: composites (per product, Sharp)
 * Layer 4: FLUX heroes only (per product)
 */

import {
  LIFESTYLE_SHOTS,
  MARKETING_SHOTS,
  PACKAGING_SHOTS,
  INGREDIENT_SHOTS,
} from "./product-asset-catalog.mjs";

/** Layer 2 — FLUX pack renders per product (7 shots). */
export const PACK_RENDER_SLUGS = [
  "front",
  "front-45",
  "back",
  "side",
  "top",
  "transparent-cutout",
  "white-background",
];

export const PACK_RENDER_SHOTS = PACKAGING_SHOTS.filter((s) => PACK_RENDER_SLUGS.includes(s.slug));

/** Layer 4 — Full FLUX heroes per product (people / campaign). */
export const FLUX_HERO_SLUGS = [
  "mother-holding",
  "mother-applying",
  "baby-using",
  "family-moment",
  "premium-ad",
  "hero-banner",
  "pastel-banner",
];

const ALL_FLUX_SHOTS = [...PACKAGING_SHOTS, ...LIFESTYLE_SHOTS, ...MARKETING_SHOTS, ...INGREDIENT_SHOTS];
export const FLUX_HERO_SHOTS = ALL_FLUX_SHOTS.filter((s) => FLUX_HERO_SLUGS.includes(s.slug));

/** Layer 3 — Composite shot definitions. */
export const COMPOSITE_SHOTS = [
  { slug: "open-package", group: "packaging", pack: "front", scene: "cream-studio", placement: { scale: 0.34 } },
  { slug: "macro-packaging", group: "packaging", mode: "crop", pack: "front", crop: { left: 0.28, top: 0.15, width: 0.44, height: 0.55 } },
  { slug: "shelf-display", group: "packaging", pack: "front-45", scene: "cream-studio", placement: { x: 0.48, y: 0.5, scale: 0.24 } },
  { slug: "cap-detail", group: "packaging", mode: "crop", pack: "top", crop: { left: 0.2, top: 0.2, width: 0.6, height: 0.6 } },
  { slug: "nursery-scene", group: "lifestyle", pack: "front-45", scene: "nursery" },
  { slug: "bathroom-scene", group: "lifestyle", pack: "front", scene: "bathroom" },
  { slug: "morning-routine", group: "lifestyle", pack: "front-45", scene: "morning-window" },
  { slug: "bedtime-routine", group: "lifestyle", pack: "front", scene: "bedroom" },
  { slug: "cotton-towel", group: "lifestyle", pack: "front", scene: "cotton-towel" },
  { slug: "wood-table", group: "lifestyle", pack: "front-45", scene: "wood-table" },
  { slug: "gift-composition", group: "lifestyle", pack: "front", scene: "gift-composition" },
  { slug: "floating-product", group: "marketing", pack: "transparent-cutout", scene: "floating-botanical", useIsolation: false },
  { slug: "glass-composition", group: "marketing", pack: "front", scene: "cream-studio", placement: { scale: 0.26 } },
  { slug: "cream-background", group: "marketing", pack: "white-background", scene: "cream-studio", useIsolation: false },
  { slug: "botanical-composition", group: "marketing", pack: "front-45", scene: "floating-botanical" },
  { slug: "social-square", group: "marketing", pack: "front", scene: "pastel-studio" },
  { slug: "ingredient-flat-lay", group: "ingredients", pack: "top", scene: "wood-table", placement: { scale: 0.22 } },
  { slug: "botanical-composition", group: "ingredients", pack: "front-45", scene: "floating-botanical", placement: { scale: 0.2 } },
  { slug: "water-droplets", group: "ingredients", pack: "side", scene: "cream-studio", placement: { scale: 0.28 } },
  { slug: "texture-closeup", group: "ingredients", mode: "crop", pack: "front", crop: { left: 0.32, top: 0.28, width: 0.36, height: 0.44 } },
  { slug: "natural-composition", group: "ingredients", pack: "side", scene: "nursery" },
  { slug: "vitamin-composition", group: "ingredients", pack: "front-45", scene: "wood-table", placement: { scale: 0.24 } },
];

/** All output shots per product (same 36 as Phase 8.5). */
export const ALL_OUTPUT_SHOTS = [
  ...PACK_RENDER_SHOTS,
  ...COMPOSITE_SHOTS.map((c) => {
    const catalog = [...PACKAGING_SHOTS, ...LIFESTYLE_SHOTS, ...MARKETING_SHOTS, ...INGREDIENT_SHOTS];
    const base = catalog.find((s) => s.slug === c.slug && s.group === c.group);
    return {
      slug: c.slug,
      group: c.group,
      w: base?.w ?? 1280,
      h: base?.h ?? 960,
      packagingBoost: base?.packagingBoost ?? 8,
      emotionBoost: base?.emotionBoost ?? 6,
      pipeline: c.mode === "crop" ? "crop" : "composite",
      composite: c,
    };
  }),
  ...FLUX_HERO_SHOTS.map((s) => ({ ...s, pipeline: "flux-hero" })),
];

export function estimatePipelineMetrics(productCount = 22, candidates = 1) {
  const masterScenes = 10;
  const fluxPerProduct = PACK_RENDER_SHOTS.length + FLUX_HERO_SHOTS.length;
  const compositePerProduct = COMPOSITE_SHOTS.length;

  const oldFluxCalls = 36 * 2 * productCount;
  const newFluxCalls = (masterScenes + fluxPerProduct * productCount) * candidates;
  const compositeCalls = compositePerProduct * productCount;

  const oldMsPerFlux = 480_000;
  const newMsPerFlux = 480_000;
  const msPerComposite = 2_500;

  const oldTotalMs = oldFluxCalls * oldMsPerFlux;
  const newTotalMs = newFluxCalls * newMsPerFlux + compositeCalls * msPerComposite;

  return {
    productCount,
    candidates,
    masterScenes,
    fluxPerProduct,
    compositePerProduct,
    oldFluxCalls,
    newFluxCalls,
    compositeCalls,
    fluxReductionPct: Math.round((1 - newFluxCalls / oldFluxCalls) * 1000) / 10,
    oldTotalMinutes: Math.round(oldTotalMs / 60_000),
    newTotalMinutes: Math.round(newTotalMs / 60_000),
    timeSavedPct: Math.round((1 - newTotalMs / oldTotalMs) * 1000) / 10,
    oldMsPerAsset: Math.round(oldTotalMs / (36 * productCount)),
    newMsPerAsset: Math.round(newTotalMs / (36 * productCount)),
  };
}

export function shotPipelineKey(productSlug, shotSlug) {
  return `${productSlug}/${shotSlug}`;
}
