export { TRUST_IMAGES, TRUST_BADGES, QUALITY_PROMISE_BADGES } from "./images";
export { RESEARCH_PROCESS_STEPS, RESEARCH_PROCESS_FAQ } from "./research-process";
export type { ResearchProcessStep } from "./research-process";
export { CORE_INGREDIENTS, getIngredientById, getAllIngredientIds } from "./ingredients";
export type { IngredientProfile } from "./ingredients";
export { QUALITY_STANDARDS } from "./quality-standards";
export type { QualityStandard } from "./quality-standards";
export {
  TRUST_TESTIMONIALS,
  computeAverageRating,
  getFeaturedTestimonial,
  mergeTestimonials,
  mapStorefrontTestimonials,
  mapCommunityReviewToTestimonial,
} from "./testimonials";
export type { TrustTestimonial, TestimonialCategory } from "./testimonials";
export { DOCTOR_ADVISORY_BLOCKS, DOCTOR_ADVISORY_DISCLAIMER, DOCTOR_ADVISORY_IMAGE } from "./doctor-advisory";
export { MANUFACTURING_STEPS } from "./manufacturing";
export type { ManufacturingStep } from "./manufacturing";
export { SUSTAINABILITY_ITEMS, SUSTAINABILITY_GOALS, SUSTAINABILITY_INTRO } from "./sustainability";
export { TRUST_WIDGETS } from "./widgets";
export type { TrustWidget } from "./widgets";
