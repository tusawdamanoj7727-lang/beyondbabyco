/**
 * Phase 11.4B — Commercial FLUX prompt engineering.
 * ONE master style; category-specific scene bodies; packaging reference prompts.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");

const CONFIG = JSON.parse(
  readFileSync(join(__dirname, "..", "data", "prompt-engineering-11-4b.json"), "utf8"),
);

export const MASTER_PROMPT = CONFIG.masterPrompt;
export const NEGATIVE_PROMPT = CONFIG.negativePrompt;
export const GENERATION_CONFIG = CONFIG.generation;
export const HARD_REJECT = CONFIG.hardReject;

const PRODUCT_DISPLAY_NAMES = {
  "baby-wipes": "Baby Wipes",
  "baby-wash": "Baby Wash",
  "baby-lotion": "Baby Lotion",
  "baby-shampoo": "Baby Shampoo",
  "baby-oil": "Baby Oil",
  "baby-powder": "Baby Powder",
  "gift-box": "Gift Box",
  "newborn-kit": "Newborn Kit",
  "men-care": "Men Care",
  "women-care": "Women Care",
};

const PRODUCT_SCENE_STYLES = {
  front: "folded cream cotton towel in luxury nursery, centered hero composition",
  "front-45": "natural oak surface with soft sage botanical accent, 45 degree angle",
  back: "minimal cream backdrop, back panel visible, soft contact shadow",
  top: "linen flat lay on warm ivory surface, top-down editorial",
  lifestyle: "luxury nursery shelf with morning window light, lifestyle context",
  bathroom: "marble bathroom shelf with soft steam light and cotton towel",
  nursery: "minimal nursery changing table with cream walls and botanical stem",
  shelf: "natural oak wood shelf display with warm ivory background",
  reflection: "subtle glass reflection on premium vanity surface",
  "transparent-png": "isolated on pure white seamless, soft studio daylight",
  "white-background": "pure white ecommerce background with gentle contact shadow",
};

const HERO_SUBJECT =
  "Indian mother holding healthy happy baby in luxury home, natural morning window light, minimal styling, editorial warmth, mother looking at baby with tender natural emotion, no camera pose, no studio flash";

const LIFESTYLE_SCENES = {
  "mother-baby": "Indian mother and baby 0-18 months, white cotton cream linen, natural warm smile, looking at baby not camera",
  "father-baby": "Indian father bonding with baby, quiet natural expression, luxury nursery, no posing for camera",
  "bath-time": "gentle baby bath on cream cotton towel, soft window light, luxury bathroom, calm tender moment",
  "diaper-change": "calm diaper change on natural oak changing table, cream nursery, natural expression",
  "sleeping-baby": "peaceful sleeping baby on cream linen, soft shadows, minimal luxury nursery",
};

const SCIENCE_SUBJECT =
  "Indian dermatologist in cream luxury research center, ingredient testing at microscope, natural window light, warm ivory laboratory, scientific credibility, editorial portrait";

const RESEARCH_SUBJECT =
  "premium baby care research laboratory, ingredient testing bench, cream walls, natural light, luxury research center aesthetic";

const INGREDIENT_MACRO = {
  calendula: "Calendula flower petals, dew drops, magazine macro quality, organic botanical detail",
  chamomile: "Chamomile blossoms, soft petals, magazine macro quality, warm natural light",
  oat: "Colloidal oat grains, creamy texture, magazine macro quality, soft ivory background",
  aloe: "Aloe vera gel slice, translucent green, water droplets, magazine macro quality",
  coconut: "Coconut oil golden droplets, creamy macro, magazine quality, warm highlights",
  shea: "Shea butter creamy texture swirl, magazine macro quality, natural ivory surface",
};

/** Resolve on-disk packaging reference PNG for img2img / prompt anchoring. */
export function resolveProductReferencePath(productLine) {
  const base = join(ROOT, CONFIG.productReferenceRoot, productLine);
  for (const candidate of ["reference-packaging.png", "front.png", "front-45.png", "white-background.png"]) {
    const path = join(base, candidate);
    if (existsSync(path)) return path;
  }
  return null;
}

export function buildProductPrompt(productLine, angle, sceneOverride) {
  const name = PRODUCT_DISPLAY_NAMES[productLine] ?? productLine.replace(/-/g, " ");
  const scene = sceneOverride ?? PRODUCT_SCENE_STYLES[angle] ?? PRODUCT_SCENE_STYLES.front;
  const refPath = resolveProductReferencePath(productLine);
  const refClause = refPath
    ? `Reference the exact BeyondBabyCo ${name} packaging from uploaded product photo — shape, colors, and label layout preserved.`
    : `BeyondBabyCo ${name} packaging exactly as brand reference — sage cream palette preserved.`;

  return [
    MASTER_PROMPT,
    `Professional commercial product photography of the uploaded BeyondBabyCo ${name} packaging placed on ${scene}.`,
    refClause,
    "Soft daylight. Subtle reflections. Natural oak surface. Minimal styling.",
    "No text. No extra products. No distortion. Packaging exactly preserved.",
  ].join(" ");
}

export function buildHeroPrompt(subjectOverride) {
  return [MASTER_PROMPT, subjectOverride ?? HERO_SUBJECT, "Wide cinematic hero composition with negative space for headline."].join(" ");
}

export function buildLifestylePrompt(subcategory, subjectOverride) {
  const base = LIFESTYLE_SCENES[subcategory] ?? subjectOverride ?? "Indian family natural moment in luxury home";
  return [MASTER_PROMPT, base, subjectOverride].filter(Boolean).join(". ");
}

export function buildSciencePrompt(subjectOverride) {
  return [MASTER_PROMPT, subjectOverride ?? SCIENCE_SUBJECT].join(". ");
}

export function buildResearchPrompt(subjectOverride) {
  return [MASTER_PROMPT, subjectOverride ?? RESEARCH_SUBJECT].join(". ");
}

export function buildIngredientPrompt(ingredientSlug, subjectOverride) {
  const macro = INGREDIENT_MACRO[ingredientSlug] ?? `${ingredientSlug} botanical macro`;
  return [MASTER_PROMPT, "100mm RF macro lens.", subjectOverride ?? macro, "Magazine macro quality. Shallow depth of field."].join(" ");
}

export function buildTrustPrompt(subject) {
  return [MASTER_PROMPT, "Trust and safety editorial.", subject, "Dermatologist-tested credibility, premium commercial advertising."].join(" ");
}

export function buildNewsletterPrompt(subject) {
  return [MASTER_PROMPT, "Newsletter editorial banner.", subject, "Calm research invitation, cream sage minimal, campaign-ready negative space."].join(" ");
}

export function buildCommunityPrompt(subject) {
  return [MASTER_PROMPT, "Indian parents community moment.", subject, "Natural warmth, premium home, botanical styling, no camera pose."].join(" ");
}

export function buildGenericPrompt(templateId, vars = {}) {
  switch (templateId) {
    case "hero":
      return buildHeroPrompt(vars.subject);
    case "lifestyle":
      return buildLifestylePrompt(vars.subcategory, vars.subject);
    case "science":
      return buildSciencePrompt(vars.subject);
    case "research":
      return buildResearchPrompt(vars.subject);
    case "macro-ingredient":
      return buildIngredientPrompt(vars.ingredientSlug ?? vars.ingredient, vars.subject);
    case "product":
      return buildProductPrompt(vars.productLine ?? vars.product, vars.angle, vars.scene);
    case "trust":
      return buildTrustPrompt(vars.subject);
    case "newsletter":
      return buildNewsletterPrompt(vars.subject);
    default:
      return [MASTER_PROMPT, vars.subject ?? ""].filter(Boolean).join(". ");
  }
}

export function buildPrompt(templateId, vars = {}) {
  return buildGenericPrompt(templateId, vars).replace(/\s{2,}/g, " ").replace(/\.\s*\./g, ".").trim();
}

export function getNegativePrompt() {
  return NEGATIVE_PROMPT;
}

export function candidateSubjectVariation(baseSubject, candidateIndex) {
  const variations = [
    "slightly closer framing",
    "gentle three-quarter angle",
    "soft background bokeh emphasis",
    "intimate medium shot",
    "environmental wide with subject sharp",
    "subtle golden rim light",
    "minimal prop adjustment",
    "natural candid micro-expression",
  ];
  return `${baseSubject}. ${variations[candidateIndex % variations.length]}.`;
}
