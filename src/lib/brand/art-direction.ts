/**
 * Phase 11.4B — BeyondBabyCo commercial FLUX art direction.
 * ONE master style for every generated asset.
 */

export const MASTER_PROMPT =
  "Luxury commercial baby skincare campaign photograph for BeyondBabyCo. Ultra realistic. Shot on Canon EOS R5. 85mm RF lens. Natural morning window light. Premium editorial photography. Indian parents. Healthy happy baby. Luxury nursery. Cream walls. Soft sage botanical accents. Warm ivory palette. Natural skin texture. Professional commercial color grading. Shallow depth of field. Magazine quality. Award-winning advertising photography." as const;

export const ART_DIRECTION = {
  phase: "11.4b",
  brand: "BeyondBabyCo",
  mood: "Luxury commercial baby skincare advertising — ultra realistic editorial photography",

  lighting: {
    primary: "Soft natural daylight",
    variants: [
      "Golden morning light through sheer curtains",
      "Luxury editorial warm white",
      "Premium commercial soft box with natural fill",
    ],
    avoid: ["Harsh flash", "Neon", "Cold blue clinic light", "Over-HDR"],
  },

  colorPalette: {
    ivory: "#FFFDF8",
    cream: "#FEF9EB",
    warmWhite: "#FAF7F2",
    softSage: "#B8CEB5",
    mutedEucalyptus: "#8BA888",
    naturalWood: "#C4A882",
    cotton: "#F5F0E8",
    linen: "#EDE6DA",
    accentGreen: "#2D6A4F",
    accentTerra: "#CD6A45",
  },

  camera: {
    body: "Canon EOS R5",
    lenses: [
      { focal: "85mm", use: "Portrait, parent-baby intimacy, hero subjects" },
      { focal: "50mm", use: "Editorial lifestyle, environmental storytelling" },
      { focal: "100mm macro", use: "Ingredient texture, packaging detail, droplets" },
    ],
    settings: "Shallow depth of field, f/2–f/2.8, natural bokeh, tack-sharp product plane",
  },

  wardrobe: {
    palette: ["Neutral white", "Warm beige", "Soft oatmeal", "Cotton cream", "Minimal linen"],
    avoid: ["Bold patterns", "Logos", "Neon colors", "Heavy jewelry"],
  },

  subjects: {
    parents: "Indian family, young parents, natural expressions, warm smiles — no studio posing",
    babies: "0–18 months, natural skin, healthy, happy — no unrealistic AI faces",
    products: "BeyondBabyCo-style premium baby care packaging, sage-cream palette, no readable text or logos in AI output",
  },

  backgrounds: [
    "Minimal nursery with cream walls and sage accents",
    "Luxury bathroom with marble and soft steam light",
    "Natural wood table with linen and botanical props",
    "White cotton towel spa composition",
    "Warm cream wall with soft shadow",
    "Botanical eucalyptus and cotton stems",
    "Premium Indian home interior, uncluttered",
  ],

  negativePrompt:
    "plastic skin, cgi, cartoon, anime, illustration, painting, duplicate child, deformed hands, extra fingers, text, watermark, logo, cropped face, blurry, bad anatomy, wrong packaging, dark lighting, harsh shadows, oversaturated, low resolution, 3D render, deformed face, unrealistic eyes, fake smile, busy background, neon, AI artifacts, wrong colors, packaging distortion, incorrect logos",

  styleSuffix:
    "Ultra realistic luxury commercial baby skincare campaign. Canon EOS R5 85mm RF lens. Natural morning window light. Magazine quality award-winning advertising photography.",
} as const;

/** Minimum editorial quality score for auto-assignment (Phase 11.4B). */
export const EDITORIAL_QUALITY_THRESHOLD = 90;

/** Phase 11.4B generation: candidates per scene, keep top N. */
export const FLUX_GENERATION = {
  candidatesMin: 5,
  candidatesMax: 8,
  candidatesDefault: 6,
  keepTop: 2,
} as const;

export type ArtDirection = typeof ART_DIRECTION;

export const GENERATED_ROOT = "/images/generated";

export const ASSET_CATEGORIES = [
  "hero",
  "lifestyle",
  "research",
  "science",
  "products",
  "ingredients",
  "newsletter",
  "timeline",
  "categories",
  "trust",
  "mascots",
  "backgrounds",
  "decorative",
  "marketing",
  "social",
  "campaigns",
  "community",
  "reviews",
  "men-care",
  "women-care",
  "gift",
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];
