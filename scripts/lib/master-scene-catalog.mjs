/** Layer 1 — Master scene library (generated once, reused across all products). */

export const SCENE_PHASE = "phase-8-5a-scenes";

const STYLE =
  "85mm lens, shallow depth of field, soft morning sunlight, warm luxury editorial lighting, empty scene without products or people, no text, no watermark, premium baby care brand aesthetic, cream pastel sage warm beige palette";

/** @type {Array<{ slug: string; name: string; scene: string; w: number; h: number; placement: { x: number; y: number; scale: number } }>} */
export const MASTER_SCENES = [
  {
    slug: "nursery",
    name: "Premium Nursery",
    scene: "premium nursery changing table cream sage decor soft morning window light empty surface for product placement",
    w: 1280,
    h: 960,
    placement: { x: 0.58, y: 0.52, scale: 0.28 },
  },
  {
    slug: "bathroom",
    name: "Luxury Bathroom",
    scene: "luxury bathroom marble shelf soft steam light empty space for product placement",
    w: 1280,
    h: 960,
    placement: { x: 0.5, y: 0.55, scale: 0.26 },
  },
  {
    slug: "bedroom",
    name: "Calm Bedroom",
    scene: "bedtime nursery bedroom warm lamp calm atmosphere empty surface product placement area",
    w: 1280,
    h: 960,
    placement: { x: 0.52, y: 0.5, scale: 0.27 },
  },
  {
    slug: "wood-table",
    name: "Natural Wood Table",
    scene: "natural light wood table botanical props empty center for product placement",
    w: 1280,
    h: 960,
    placement: { x: 0.5, y: 0.48, scale: 0.3 },
  },
  {
    slug: "cotton-towel",
    name: "Cotton Towel Spa",
    scene: "white cotton towel spa composition soft folds empty area for product",
    w: 1280,
    h: 960,
    placement: { x: 0.54, y: 0.46, scale: 0.25 },
  },
  {
    slug: "cream-studio",
    name: "Cream Studio",
    scene: "soft cream gradient studio backdrop seamless empty product pedestal area",
    w: 1280,
    h: 960,
    placement: { x: 0.5, y: 0.45, scale: 0.32 },
  },
  {
    slug: "pastel-studio",
    name: "Pastel Studio",
    scene: "pastel sage cream studio backdrop minimal ecommerce empty center",
    w: 1280,
    h: 960,
    placement: { x: 0.5, y: 0.44, scale: 0.3 },
  },
  {
    slug: "gift-composition",
    name: "Gift Composition",
    scene: "premium gift ribbon cream paper composition empty space for product box",
    w: 1280,
    h: 960,
    placement: { x: 0.5, y: 0.5, scale: 0.28 },
  },
  {
    slug: "floating-botanical",
    name: "Floating Botanical",
    scene: "floating botanical leaves sage cream minimal premium empty center for product",
    w: 1024,
    h: 1024,
    placement: { x: 0.5, y: 0.42, scale: 0.38 },
  },
  {
    slug: "morning-window",
    name: "Morning Window Light",
    scene: "morning sunlight window light warm family room empty surface product placement",
    w: 1280,
    h: 960,
    placement: { x: 0.56, y: 0.5, scale: 0.27 },
  },
];

export const SCENE_NEGATIVE =
  "product, bottle, package, box, tube, jar, people, hands, face, baby, text, watermark, logo, typography, letters";

export function scenePrompt(scene) {
  return `${STYLE}, ${scene.scene}`;
}

export function scenePaths(root, slug) {
  return {
    dir: `${root}/public/images/products/${SCENE_PHASE}`,
    main: `${root}/public/images/products/${SCENE_PHASE}/${slug}.webp`,
    png: `${root}/public/images/products/${SCENE_PHASE}/${slug}.png`,
    publicUrl: `/images/products/${SCENE_PHASE}/${slug}.webp`,
  };
}

export function getScene(slug) {
  return MASTER_SCENES.find((s) => s.slug === slug) ?? null;
}
