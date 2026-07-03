/**
 * Phase 11.4B — Reusable FLUX commercial prompt templates.
 * ONE master style; every prompt begins with MASTER_PROMPT.
 */

import { ART_DIRECTION } from "./art-direction";

export type PromptTemplateId =
  | "hero"
  | "lifestyle"
  | "research"
  | "science"
  | "product"
  | "macro-ingredient"
  | "newsletter"
  | "timeline"
  | "category"
  | "trust"
  | "marketing"
  | "decorative"
  | "background";

export type PromptVars = Record<string, string | number | undefined>;

export const MASTER_PROMPT =
  "Luxury commercial baby skincare campaign photograph for BeyondBabyCo. Ultra realistic. Shot on Canon EOS R5. 85mm RF lens. Natural morning window light. Premium editorial photography. Indian parents. Healthy happy baby. Luxury nursery. Cream walls. Soft sage botanical accents. Warm ivory palette. Natural skin texture. Professional commercial color grading. Shallow depth of field. Magazine quality. Award-winning advertising photography.";

const { negativePrompt } = ART_DIRECTION;

function joinParts(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(". ");
}

export const PROMPT_TEMPLATES: Record<
  PromptTemplateId,
  { body: string; defaultWidth: number; defaultHeight: number }
> = {
  hero: {
    body: joinParts(
      MASTER_PROMPT,
      "{subject}",
      "Indian mother and baby in luxury home, natural window light, minimal styling, editorial warmth, looking at baby not camera, no camera pose",
      "Wide cinematic hero composition with negative space for headline",
    ),
    defaultWidth: 1920,
    defaultHeight: 1080,
  },
  lifestyle: {
    body: joinParts(
      MASTER_PROMPT,
      "{subject}",
      "Indian parents natural warm expression, white cotton cream linen, no studio posing",
    ),
    defaultWidth: 1280,
    defaultHeight: 960,
  },
  research: {
    body: joinParts(
      MASTER_PROMPT,
      "{subject}",
      "Premium baby care research laboratory, ingredient testing, cream walls, natural light, luxury research center",
    ),
    defaultWidth: 1280,
    defaultHeight: 960,
  },
  science: {
    body: joinParts(
      MASTER_PROMPT,
      "{subject}",
      "Indian dermatologist, luxury research center, microscope, ingredient testing, cream laboratory, natural window light",
    ),
    defaultWidth: 1280,
    defaultHeight: 960,
  },
  product: {
    body: joinParts(
      MASTER_PROMPT,
      "Professional commercial product photography of the uploaded BeyondBabyCo {product} packaging placed on {scene}",
      "Soft daylight, subtle reflections, natural oak surface, minimal styling",
      "No text, no extra products, no distortion, packaging exactly preserved",
    ),
    defaultWidth: 1024,
    defaultHeight: 1024,
  },
  "macro-ingredient": {
    body: joinParts(
      MASTER_PROMPT,
      "100mm RF macro lens",
      "{ingredient}",
      "Magazine macro quality, shallow depth of field, organic botanical detail",
    ),
    defaultWidth: 1024,
    defaultHeight: 1024,
  },
  newsletter: {
    body: joinParts(MASTER_PROMPT, "Newsletter editorial banner", "{subject}", "Cream sage minimal, campaign negative space"),
    defaultWidth: 1600,
    defaultHeight: 900,
  },
  timeline: {
    body: joinParts(MASTER_PROMPT, "Brand research timeline", "{subject}", "Heritage and innovation premium editorial"),
    defaultWidth: 1280,
    defaultHeight: 800,
  },
  category: {
    body: joinParts(MASTER_PROMPT, "Category collection hero", "{subject}", "Ecommerce editorial category banner"),
    defaultWidth: 1280,
    defaultHeight: 960,
  },
  trust: {
    body: joinParts(MASTER_PROMPT, "Trust and safety editorial", "{subject}", "Dermatologist-tested premium credibility"),
    defaultWidth: 1280,
    defaultHeight: 960,
  },
  marketing: {
    body: joinParts(MASTER_PROMPT, "Luxury advertising campaign", "{subject}", "Commercial negative space"),
    defaultWidth: 1280,
    defaultHeight: 960,
  },
  decorative: {
    body: joinParts("Abstract premium brand texture", "{subject}", "Ivory cream soft sage, no text no logo", MASTER_PROMPT),
    defaultWidth: 1024,
    defaultHeight: 1024,
  },
  background: {
    body: joinParts(MASTER_PROMPT, "Empty premium backdrop without people or products", "{subject}", "Soft morning window light"),
    defaultWidth: 1920,
    defaultHeight: 1080,
  },
};

export function interpolateTemplate(template: string, vars: PromptVars): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = vars[key];
    return val !== undefined ? String(val) : "";
  });
}

export function buildPrompt(templateId: PromptTemplateId, vars: PromptVars = {}): string {
  const tpl = PROMPT_TEMPLATES[templateId];
  return interpolateTemplate(tpl.body, vars).replace(/\s{2,}/g, " ").replace(/\.\s*\./g, ".").trim();
}

export function getNegativePrompt(): string {
  return negativePrompt;
}

export function getTemplateDimensions(
  templateId: PromptTemplateId,
  overrides?: { width?: number; height?: number },
): { width: number; height: number } {
  const tpl = PROMPT_TEMPLATES[templateId];
  return {
    width: overrides?.width ?? tpl.defaultWidth,
    height: overrides?.height ?? tpl.defaultHeight,
  };
}

export const PRODUCT_ANGLES = {
  front: "folded cream cotton towel in luxury nursery, centered hero composition",
  "front-45": "natural oak surface with soft sage botanical accent, 45 degree angle",
  back: "minimal cream backdrop, back panel visible, soft contact shadow",
  top: "linen flat lay on warm ivory surface, top-down editorial",
  lifestyle: "luxury nursery shelf with morning window light",
  bathroom: "marble bathroom shelf with soft steam light and cotton towel",
  nursery: "minimal nursery changing table with cream walls",
  shelf: "natural oak wood shelf display with warm ivory background",
  reflection: "subtle glass reflection on premium vanity surface",
  "transparent-png": "isolated on pure white seamless, soft studio daylight",
  "white-background": "pure white ecommerce background with gentle contact shadow",
  "packaging-closeup": "macro packaging texture detail, soft daylight",
} as const;

export type ProductAngle = keyof typeof PRODUCT_ANGLES;

export function buildProductPrompt(productName: string, angle: ProductAngle): string {
  return buildPrompt("product", {
    product: productName,
    scene: PRODUCT_ANGLES[angle],
  });
}
