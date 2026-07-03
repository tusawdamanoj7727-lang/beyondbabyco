/**
 * Phase 11.4A — Expanded FLUX editorial catalog (variations per shoot group).
 */

const INGREDIENTS = [
  { slug: "calendula", name: "calendula flower petals macro" },
  { slug: "chamomile", name: "chamomile blossoms macro" },
  { slug: "oat", name: "colloidal oat grains macro" },
  { slug: "aloe", name: "aloe vera gel macro" },
  { slug: "coconut", name: "coconut oil droplets macro" },
  { slug: "shea", name: "shea butter texture macro" },
];

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

const PRODUCT_ANGLES = [
  { slug: "front", subject: "front hero product shot" },
  { slug: "front-45", subject: "45 degree angle product shot" },
  { slug: "back", subject: "back packaging shot" },
  { slug: "top", subject: "top down flat lay" },
  { slug: "lifestyle", subject: "lifestyle nursery context" },
  { slug: "bathroom", subject: "luxury bathroom shelf styling" },
  { slug: "nursery", subject: "minimal nursery shelf styling" },
  { slug: "shelf", subject: "wood shelf display editorial" },
  { slug: "reflection", subject: "glass reflection premium styling" },
  { slug: "transparent-png", subject: "isolated product transparent background" },
  { slug: "white-background", subject: "pure white background ecommerce" },
];

function pad(n) {
  return String(n).padStart(2, "0");
}

function variationGroup(category, subcategory, count, template, subjectBuilder, dims = { w: 1280, h: 960 }) {
  const items = [];
  for (let i = 1; i <= count; i++) {
    const slug = subcategory ? `${subcategory}/v${pad(i)}` : `v${pad(i)}`;
    items.push({
      id: `${category}/${slug}`,
      category,
      slug,
      group: subcategory ? `${category}/${subcategory}` : category,
      template,
      subject: subjectBuilder(i),
      width: dims.w,
      height: dims.h,
      alt: `${subjectBuilder(i)} | BeyondBabyCo editorial`,
    });
  }
  return items;
}

function buildCatalog() {
  const assets = [];

  assets.push(
    ...variationGroup("hero", null, 20, "hero", (i) =>
      `luxury baby skincare hero ${i}, Indian mother and newborn golden morning light cream nursery`,
      { w: 1920, h: 1080 },
    ),
  );

  assets.push(
    ...variationGroup("lifestyle", "mother-baby", 20, "lifestyle", (i) =>
      `Indian mother holding baby 0-18 months natural warm smile white cotton cream linen ${i}`,
    ),
  );

  assets.push(
    ...variationGroup("lifestyle", "father-baby", 15, "lifestyle", (i) =>
      `Indian father bonding with baby natural expression warm minimal nursery ${i}`,
    ),
  );

  assets.push(
    ...variationGroup("lifestyle", "bath-time", 20, "lifestyle", (i) =>
      `gentle baby bath time soft window light cotton towel luxury bathroom ${i}`,
    ),
  );

  assets.push(
    ...variationGroup("lifestyle", "diaper-change", 15, "lifestyle", (i) =>
      `calm diaper change moment cream nursery natural oak changing table ${i}`,
    ),
  );

  assets.push(
    ...variationGroup("lifestyle", "sleeping-baby", 15, "lifestyle", (i) =>
      `peaceful sleeping baby 0-18 months cream linen nursery soft shadows ${i}`,
    ),
  );

  assets.push(
    ...variationGroup("research", "lab", 15, "research", (i) =>
      `premium baby care research lab clean cream environment ingredient study ${i}`,
    ),
  );

  assets.push(
    ...variationGroup("science", "dermatologist", 15, "science", (i) =>
      `Indian dermatologist reviewing gentle baby skincare research warm editorial ${i}`,
    ),
  );

  for (const ing of INGREDIENTS) {
    assets.push(
      ...variationGroup("ingredients", ing.slug, 10, "macro-ingredient", (i) => `${ing.name} variation ${i}`, {
        w: 1024,
        h: 1024,
      }),
    );
  }

  assets.push(
    ...variationGroup("newsletter", null, 15, "newsletter", (i) =>
      `newsletter editorial banner care tips research updates minimal sage cream ${i}`,
      { w: 1600, h: 900 },
    ),
  );

  assets.push(
    ...variationGroup("trust", null, 15, "trust", (i) =>
      `trust safety editorial dermatologist-tested gentle premium credibility ${i}`,
    ),
  );

  assets.push(
    ...variationGroup("community", null, 20, "lifestyle", (i) =>
      `Indian parents community moment natural warmth premium home botanical ${i}`,
    ),
  );

  for (const line of PRODUCT_LINES) {
    const name = line.replace(/-/g, " ");
    for (const angle of PRODUCT_ANGLES) {
      assets.push({
        id: `products/${line}/${angle.slug}`,
        category: "products",
        slug: `${line}/${angle.slug}`,
        group: `products/${line}`,
        template: "product",
        subject: `${name} ${angle.subject}`,
        width: 1024,
        height: 1024,
        productLine: line,
        angle: angle.slug,
        vars: { product: name, angle: angle.subject },
        alt: `${name} — ${angle.slug} | BeyondBabyCo packaging`,
      });
    }
  }

  return assets;
}

export const FLUX_CATALOG_11_4A = buildCatalog();

export function getFluxCatalogCounts() {
  const counts = {};
  for (const asset of FLUX_CATALOG_11_4A) {
    const key = asset.group ?? asset.category;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function getFluxCatalogByGroup(group) {
  return FLUX_CATALOG_11_4A.filter((a) => (a.group ?? a.category) === group);
}

export function getFluxCatalogByCategory(category) {
  return FLUX_CATALOG_11_4A.filter((a) => a.category === category);
}
