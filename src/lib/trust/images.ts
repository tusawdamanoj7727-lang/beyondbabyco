/** Illustration paths for trust center sections — Phase 11.4 editorial assets. */
import { TRUST_EDITORIAL } from "@/lib/brand/generated-assets";

export const TRUST_IMAGES = {
  research: TRUST_EDITORIAL.research.url,
  ingredient: TRUST_EDITORIAL.ingredient.url,
  laboratory: TRUST_EDITORIAL.laboratory.url,
  safety: TRUST_EDITORIAL.safety.url,
  dermatology: TRUST_EDITORIAL.dermatology.url,
  pediatric: TRUST_EDITORIAL.pediatric.url,
  clinical: TRUST_EDITORIAL.clinical.url,
  manufacturing: TRUST_EDITORIAL.manufacturing.url,
  quality: TRUST_EDITORIAL.quality.url,
  feedback: TRUST_EDITORIAL.feedback.url,
  rawMaterials: TRUST_EDITORIAL.rawMaterials.url,
  inspection: TRUST_EDITORIAL.inspection.url,
  production: TRUST_EDITORIAL.production.url,
  packaging: TRUST_EDITORIAL.packaging.url,
  warehouse: TRUST_EDITORIAL.warehouse.url,
  shipping: TRUST_EDITORIAL.shipping.url,
  delivery: TRUST_EDITORIAL.delivery.url,
  sustainability: TRUST_EDITORIAL.sustainability.url,
  doctorAdvisory: TRUST_EDITORIAL.doctorAdvisory.url,
  trustHero: TRUST_EDITORIAL.trustHero.url,
} as const;

export const TRUST_IMAGE_BLURS = Object.fromEntries(
  Object.entries(TRUST_EDITORIAL).map(([k, v]) => [k, v.blur]),
) as Record<keyof typeof TRUST_EDITORIAL, string>;

export { TRUST_BADGES } from "@/lib/content/images";
