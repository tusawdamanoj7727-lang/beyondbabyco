/** Shared image paths for marketing content pages — Phase 11.4 editorial assets. */
import { CONTENT_EDITORIAL } from "@/lib/brand/generated-assets";

export const CONTENT_IMAGES = {
  about: CONTENT_EDITORIAL.about.url,
  story: CONTENT_EDITORIAL.story.url,
  research: CONTENT_EDITORIAL.research.url,
  ingredients: CONTENT_EDITORIAL.ingredients.url,
  why: CONTENT_EDITORIAL.why.url,
  manufacturing: CONTENT_EDITORIAL.manufacturing.url,
  certifications: CONTENT_EDITORIAL.certifications.url,
  safety: CONTENT_EDITORIAL.safety.url,
  contact: CONTENT_EDITORIAL.contact.url,
  careers: CONTENT_EDITORIAL.careers.url,
  press: CONTENT_EDITORIAL.press.url,
  scienceLab: CONTENT_EDITORIAL.scienceLab.url,
  family: CONTENT_EDITORIAL.family.url,
} as const;

export const CONTENT_IMAGE_BLURS = {
  about: CONTENT_EDITORIAL.about.blur,
  story: CONTENT_EDITORIAL.story.blur,
  research: CONTENT_EDITORIAL.research.blur,
  ingredients: CONTENT_EDITORIAL.ingredients.blur,
  why: CONTENT_EDITORIAL.why.blur,
  manufacturing: CONTENT_EDITORIAL.manufacturing.blur,
  certifications: CONTENT_EDITORIAL.certifications.blur,
  safety: CONTENT_EDITORIAL.safety.blur,
  contact: CONTENT_EDITORIAL.contact.blur,
  careers: CONTENT_EDITORIAL.careers.blur,
  press: CONTENT_EDITORIAL.press.blur,
  scienceLab: CONTENT_EDITORIAL.scienceLab.blur,
  family: CONTENT_EDITORIAL.family.blur,
} as const;

/** SVG trust badges — keep as-is per Phase 11.4 spec. */
export const TRUST_BADGES = {
  dermatologicallyTested: "/images/homepage/phase-8-2/trust/dermatologically-tested.svg",
  clinicallyTested: "/images/homepage/phase-8-2/trust/clinically-tested.svg",
  madeInIndia: "/images/homepage/phase-8-2/trust/made-in-india.svg",
  naturalIngredients: "/images/homepage/phase-8-2/trust/natural-ingredients.svg",
  crueltyFree: "/images/homepage/phase-8-2/trust/cruelty-free.svg",
  parabenFree: "/images/homepage/phase-8-2/trust/paraben-free.svg",
  sulfateFree: "/images/homepage/phase-8-2/trust/sulfate-free.svg",
  gmpManufacturing: "/images/homepage/phase-8-2/trust/gmp-manufacturing.svg",
  isoQuality: "/images/homepage/phase-8-2/trust/iso-quality.svg",
  pediatricianRecommended: "/images/homepage/phase-8-2/trust/pediatrician-recommended.svg",
} as const;
