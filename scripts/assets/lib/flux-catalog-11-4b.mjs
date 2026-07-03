/**
 * Phase 11.4B — Curated commercial scenes (fewer, higher quality).
 * Each scene generates 5–8 candidates; pipeline keeps top 2.
 */

const INGREDIENTS = ["calendula", "chamomile", "oat", "aloe", "coconut", "shea"];

const PRODUCT_LINES = [
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

/** Key product angles only — fewer generations, higher quality. */
const PRODUCT_ANGLES = ["front", "front-45", "lifestyle", "white-background"];

function scene(category, slug, template, subject, extra = {}) {
  return {
    id: `${category}/${slug}`,
    category,
    slug,
    altSlug: `${slug}-alt`,
    group: extra.group ?? (extra.subcategory ? `${category}/${extra.subcategory}` : category),
    template,
    subject,
    width: extra.w ?? 1280,
    height: extra.h ?? 960,
    subcategory: extra.subcategory,
    productLine: extra.productLine,
    angle: extra.angle,
    ingredientSlug: extra.ingredientSlug,
    vars: extra.vars,
    alt: `${subject} | BeyondBabyCo commercial`,
  };
}

function lifestyleScenes(subcategory, subjects) {
  return subjects.map((subject, i) =>
    scene("lifestyle", `${subcategory}-scene-${String(i + 1).padStart(2, "0")}`, "lifestyle", subject, {
      subcategory,
      group: `lifestyle/${subcategory}`,
    }),
  );
}

function buildCatalog() {
  const assets = [];

  assets.push(
    scene("hero", "golden-morning-cradle", "hero", "Indian mother cradling newborn in cream nursery, looking at baby with natural warmth", {
      w: 1920,
      h: 1080,
    }),
    scene("hero", "window-light-embrace", "hero", "Young Indian mother holding 6-month baby by sunlit window, editorial minimal styling", {
      w: 1920,
      h: 1080,
    }),
    scene("hero", "family-luxury-home", "hero", "Indian parents with baby in warm luxury home morning routine, natural emotion", {
      w: 1920,
      h: 1080,
    }),
    scene("hero", "nursery-tender-moment", "hero", "Mother seated in sage-accent nursery holding happy baby, soft golden light", {
      w: 1920,
      h: 1080,
    }),
    scene("hero", "collection-hero-table", "hero", "Curated baby care moment on natural oak table, mother and baby soft focus background", {
      w: 1920,
      h: 1080,
    }),
  );

  assets.push(
    ...lifestyleScenes("mother-baby", [
      "Indian mother holding baby, white cotton, natural smile looking at baby not camera",
      "Mother applying gentle care, cream linen, tender editorial portrait",
      "Morning nursery bonding, mother and 12-month baby, warm window light",
      "Mother cradling sleeping baby, minimal styling, luxury home",
    ]),
  );

  assets.push(
    ...lifestyleScenes("father-baby", [
      "Indian father holding baby, natural quiet bond, no camera pose",
      "Father supporting baby during bath prep, warm bathroom light",
      "Father and baby on cream sofa, premium home editorial",
    ]),
  );

  assets.push(
    ...lifestyleScenes("bath-time", [
      "Gentle baby bath on cream cotton towel, soft window light, luxury bathroom",
      "Father hands supporting baby in shallow bath, calm editorial",
      "Baby bath with sage botanical accent, warm ivory palette",
      "Spa-like baby bath moment, minimal props, natural skin texture",
    ]),
  );

  assets.push(
    ...lifestyleScenes("diaper-change", [
      "Calm diaper change on natural oak table, cream nursery",
      "Mother changing diaper with natural expression, minimal nursery",
      "Premium changing station editorial, soft morning light",
    ]),
  );

  assets.push(
    ...lifestyleScenes("sleeping-baby", [
      "Peaceful sleeping baby on cream linen, soft shadows",
      "Newborn nap in luxury crib, warm ivory nursery",
      "Sleeping baby close-up, natural skin, editorial softness",
    ]),
  );

  assets.push(
    scene("research", "lab-ingredient-study", "research", "Premium research lab ingredient study bench, cream walls, natural light"),
    scene("research", "lab-formulation", "research", "Formulation scientist at clean cream laboratory, luxury research center"),
    scene("research", "lab-safety-testing", "research", "Safety testing station, gentle baby care research, warm ivory lab"),
  );

  assets.push(
    scene("science", "dermatologist-portrait", "science", "Indian dermatologist portrait in cream research center, natural light, editorial credibility"),
    scene("science", "dermatologist-microscope", "science", "Dermatologist at microscope reviewing ingredient samples, luxury laboratory"),
    scene("science", "dermatologist-consultation", "science", "Dermatologist reviewing gentle skincare research notes, warm editorial"),
  );

  for (const ing of INGREDIENTS) {
    assets.push(
      scene("ingredients", `${ing}-macro`, "macro-ingredient", `${ing} magazine macro`, {
        w: 1024,
        h: 1024,
        group: `ingredients/${ing}`,
        ingredientSlug: ing,
        vars: { ingredientSlug: ing },
      }),
    );
  }

  assets.push(
    scene("newsletter", "care-tips-banner", "newsletter", "Care tips newsletter editorial, cream sage minimal, negative space", { w: 1600, h: 900 }),
    scene("newsletter", "research-updates", "newsletter", "Research updates invitation banner, warm ivory palette", { w: 1600, h: 900 }),
    scene("newsletter", "community-welcome", "newsletter", "Community welcome editorial, botanical accent, commercial advertising", { w: 1600, h: 900 }),
  );

  assets.push(
    scene("trust", "dermatologist-tested", "trust", "Dermatologist-tested trust editorial, premium credibility"),
    scene("trust", "hypoallergenic-safety", "trust", "Hypoallergenic safety editorial, calm reassurance"),
    scene("trust", "research-backed", "trust", "Research-backed gentle care trust moment"),
  );

  assets.push(
    scene("community", "parent-circle", "lifestyle", "Indian parents community gathering, natural warmth, premium home"),
    scene("community", "care-sharing", "lifestyle", "Parents sharing care moment, botanical styling, editorial"),
    scene("community", "morning-gathering", "lifestyle", "Young Indian parents morning coffee and baby, luxury home"),
    scene("community", "support-circle", "lifestyle", "Supportive parent community moment, cream walls, natural smiles"),
  );

  for (const line of PRODUCT_LINES) {
    for (const angle of PRODUCT_ANGLES) {
      assets.push(
        scene("products", `${line}/${angle}`, "product", `${line} ${angle} commercial product`, {
          w: 1024,
          h: 1024,
          group: `products/${line}`,
          productLine: line,
          angle,
          vars: { productLine: line, angle },
        }),
      );
    }
  }

  return assets;
}

export const FLUX_SCENES_11_4B = buildCatalog();

/** Flat catalog: primary + alt slot per scene (top 2 kept). */
export function expandSceneSlots(scenes = FLUX_SCENES_11_4B) {
  const slots = [];
  for (const s of scenes) {
    slots.push({ ...s, slot: "primary", outputSlug: s.slug });
    slots.push({ ...s, slot: "alt", outputSlug: s.altSlug, id: `${s.id}-alt` });
  }
  return slots;
}

export function getSceneCounts() {
  const counts = {};
  for (const s of FLUX_SCENES_11_4B) {
    counts[s.group] = (counts[s.group] ?? 0) + 1;
  }
  return counts;
}

export function getScenesByGroup(group) {
  return FLUX_SCENES_11_4B.filter((s) => s.group === group);
}

export function getScenesByCategory(category) {
  return FLUX_SCENES_11_4B.filter((s) => s.category === category);
}
