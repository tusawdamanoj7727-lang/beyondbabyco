#!/usr/bin/env node
/**
 * Phase 11.4A — Auto-assign highest-scoring editorial assets to site slots.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { QUALITY_THRESHOLD } from "./lib/quality-score.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const SCORES_PATH = join(__dirname, "data", "flux-scores.json");
const SELECTIONS_SCRIPT = join(__dirname, "data", "selections.json");
const SELECTIONS_SRC = join(ROOT, "src/lib/brand/asset-selections.json");

/** Site slot → candidate pool (group prefix or category filter). */
const SLOT_POOLS = {
  "EDITORIAL.hero": { pool: "hero", fallback: { category: "hero", slug: "gentle-care-hero" } },
  "EDITORIAL.heroAlt": { pool: "hero", fallback: { category: "hero", slug: "science-backed-hero" }, rank: 2 },
  "EDITORIAL.science": { pool: "science/dermatologist", fallback: { category: "science", slug: "dermatologist" } },
  "EDITORIAL.lifestyleHero": { pool: "lifestyle/mother-baby", fallback: { category: "lifestyle", slug: "premium-home" } },
  "EDITORIAL.lifestyleCards.0": { pool: "lifestyle/diaper-change", fallback: { category: "lifestyle", slug: "diaper-change" } },
  "EDITORIAL.lifestyleCards.1": { pool: "lifestyle/bath-time", fallback: { category: "lifestyle", slug: "bath-time" } },
  "EDITORIAL.lifestyleCards.2": { pool: "lifestyle/mother-baby", fallback: { category: "lifestyle", slug: "applying-lotion" }, rank: 2 },
  "EDITORIAL.brandPromise.0": { pool: "lifestyle/mother-baby", fallback: { category: "lifestyle", slug: "premium-home" }, rank: 3 },
  "EDITORIAL.brandPromise.1": { pool: "ingredients/calendula", fallback: { category: "lifestyle", slug: "organic-ingredients" } },
  "EDITORIAL.brandPromise.2": { pool: "community", fallback: { category: "lifestyle", slug: "family" } },
  "EDITORIAL.newsletter": { pool: "newsletter", fallback: { category: "newsletter", slug: "care-tips" } },
  "EDITORIAL.newsletterAlt": { pool: "lifestyle/sleeping-baby", fallback: { category: "lifestyle", slug: "baby-sleeping" } },
  "EDITORIAL.beyondCareMen": { pool: "products/men-care", angle: "lifestyle", fallback: { category: "men-care", slug: "grooming-routine" } },
  "EDITORIAL.beyondCareWomen": { pool: "products/women-care", angle: "lifestyle", fallback: { category: "women-care", slug: "self-care-routine" } },
  "EDITORIAL.trustBackdrop": { pool: "trust", fallback: { category: "reviews", slug: "testimonial-backdrop" } },
  "EDITORIAL.meetFriendsBg": { pool: "community", fallback: { category: "backgrounds", slug: "nursery" }, rank: 2 },

  "CONTENT_EDITORIAL.about": { pool: "community", fallback: { category: "lifestyle", slug: "family" } },
  "CONTENT_EDITORIAL.story": { pool: "hero", fallback: { category: "timeline", slug: "founding" }, rank: 3 },
  "CONTENT_EDITORIAL.research": { pool: "research/lab", fallback: { category: "research", slug: "lab-bench" } },
  "CONTENT_EDITORIAL.ingredients": { pool: "ingredients/calendula", fallback: { category: "ingredients", slug: "calendula" }, rank: 2 },
  "CONTENT_EDITORIAL.why": { pool: "lifestyle/mother-baby", fallback: { category: "lifestyle", slug: "premium-home" }, rank: 4 },
  "CONTENT_EDITORIAL.manufacturing": { pool: "research/lab", fallback: { category: "research", slug: "formulation" }, rank: 2 },
  "CONTENT_EDITORIAL.certifications": { pool: "science/dermatologist", fallback: { category: "science", slug: "testing" }, rank: 2 },
  "CONTENT_EDITORIAL.safety": { pool: "trust", fallback: { category: "trust", slug: "hypoallergenic" }, rank: 2 },
  "CONTENT_EDITORIAL.contact": { pool: "newsletter", fallback: { category: "newsletter", slug: "research-updates" }, rank: 2 },
  "CONTENT_EDITORIAL.careers": { pool: "lifestyle/mother-baby", fallback: { category: "lifestyle", slug: "morning-routine" }, rank: 5 },
  "CONTENT_EDITORIAL.scienceLab": { pool: "research/lab", fallback: { category: "science", slug: "lab-environment" }, rank: 3 },
  "CONTENT_EDITORIAL.family": { pool: "community", fallback: { category: "lifestyle", slug: "family" }, rank: 2 },
  "CONTENT_EDITORIAL.ingredientOat": { pool: "ingredients/oat", fallback: { category: "ingredients", slug: "oat-extract" } },
  "CONTENT_EDITORIAL.ingredientChamomile": { pool: "ingredients/chamomile", fallback: { category: "ingredients", slug: "chamomile" } },
  "CONTENT_EDITORIAL.ingredientAloe": { pool: "ingredients/aloe", fallback: { category: "ingredients", slug: "aloe-vera" } },
  "CONTENT_EDITORIAL.microscope": { pool: "research/lab", fallback: { category: "science", slug: "microscope" }, rank: 4 },
  "CONTENT_EDITORIAL.scientist": { pool: "science/dermatologist", fallback: { category: "science", slug: "scientist-portrait" }, rank: 3 },

  "TRUST_EDITORIAL.research": { pool: "research/lab", fallback: { category: "research", slug: "lab-bench" }, rank: 4 },
  "TRUST_EDITORIAL.ingredient": { pool: "ingredients/calendula", fallback: { category: "ingredients", slug: "calendula" }, rank: 3 },
  "TRUST_EDITORIAL.laboratory": { pool: "research/lab", fallback: { category: "science", slug: "lab-environment" }, rank: 5 },
  "TRUST_EDITORIAL.safety": { pool: "trust", fallback: { category: "science", slug: "testing" }, rank: 3 },
  "TRUST_EDITORIAL.dermatology": { pool: "science/dermatologist", fallback: { category: "science", slug: "dermatologist" }, rank: 4 },
  "TRUST_EDITORIAL.pediatric": { pool: "science/dermatologist", fallback: { category: "science", slug: "scientist-portrait" }, rank: 5 },
  "TRUST_EDITORIAL.clinical": { pool: "research/lab", fallback: { category: "research", slug: "safety-testing" }, rank: 6 },
  "TRUST_EDITORIAL.manufacturing": { pool: "research/lab", fallback: { category: "research", slug: "formulation" }, rank: 7 },
  "TRUST_EDITORIAL.quality": { pool: "trust", fallback: { category: "trust", slug: "research-backed" }, rank: 4 },
  "TRUST_EDITORIAL.feedback": { pool: "community", fallback: { category: "reviews", slug: "five-star-moment" }, rank: 3 },
  "TRUST_EDITORIAL.rawMaterials": { pool: "ingredients/oat", fallback: { category: "ingredients", slug: "oat-extract" }, rank: 2 },
  "TRUST_EDITORIAL.inspection": { pool: "ingredients/chamomile", fallback: { category: "research", slug: "ingredient-study" } },
  "TRUST_EDITORIAL.production": { pool: "research/lab", fallback: { category: "research", slug: "parent-feedback" }, rank: 8 },
  "TRUST_EDITORIAL.packaging": { pool: "products/baby-wipes", angle: "reflection", fallback: { category: "products", slug: "baby-wipes/packaging-closeup" } },
  "TRUST_EDITORIAL.warehouse": { pool: "products/gift-box", angle: "shelf", fallback: { category: "backgrounds", slug: "premium-home" } },
  "TRUST_EDITORIAL.shipping": { pool: "lifestyle/mother-baby", fallback: { category: "lifestyle", slug: "morning-routine" }, rank: 6 },
  "TRUST_EDITORIAL.delivery": { pool: "community", fallback: { category: "lifestyle", slug: "family" }, rank: 4 },
  "TRUST_EDITORIAL.sustainability": { pool: "ingredients/coconut", fallback: { category: "lifestyle", slug: "organic-ingredients" } },
  "TRUST_EDITORIAL.doctorAdvisory": { pool: "science/dermatologist", fallback: { category: "science", slug: "dermatologist" }, rank: 6 },
  "TRUST_EDITORIAL.trustHero": { pool: "trust", fallback: { category: "trust", slug: "dermatologist-tested" }, rank: 5 },
};

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

const PRODUCT_ANGLES = ["front", "front-45", "back", "top", "lifestyle", "bathroom", "nursery", "shelf", "reflection", "transparent-png", "white-background"];

function loadScores() {
  if (!existsSync(SCORES_PATH)) {
    console.error("Run flux-score first: npm run assets:flux:score");
    process.exit(1);
  }
  return JSON.parse(readFileSync(SCORES_PATH, "utf8"));
}

function matchesPool(id, pool, angle) {
  if (angle) {
    return id.startsWith(`${pool}/${angle}`) || (id.includes(`/${angle}`) && id.includes(pool.split("/").pop() ?? pool));
  }
  if (id.startsWith(`${pool}/`) || id === pool) return true;
  const segment = pool.includes("/") ? pool.split("/").pop() : pool;
  if (segment && id.includes(`/${segment}/`)) return true;
  return false;
}

function pickFromPool(scoredAssets, pool, rank = 1, angle) {
  const candidates = Object.values(scoredAssets)
    .filter((a) => a.passed && matchesPool(a.id, pool, angle))
    .sort((a, b) => b.score - a.score);
  return candidates[rank - 1] ?? null;
}

function assignSlot(slot, config, scoredAssets) {
  const pick = pickFromPool(scoredAssets.assets, config.pool, config.rank ?? 1, config.angle);
  if (pick && pick.score >= QUALITY_THRESHOLD) {
    return {
      slot,
      assigned: true,
      category: pick.category,
      slug: pick.slug,
      score: pick.score,
      source: pick.id,
    };
  }
  return {
    slot,
    assigned: false,
    category: config.fallback.category,
    slug: config.fallback.slug,
    score: pick?.score ?? 0,
    source: pick?.id ?? null,
    reason: pick ? `score ${pick.score} < ${QUALITY_THRESHOLD}` : "no passing candidate",
  };
}

function main() {
  const scored = loadScores();
  const selections = {
    phase: "11.4a",
    threshold: QUALITY_THRESHOLD,
    updatedAt: new Date().toISOString(),
    slots: {},
    products: {},
  };

  for (const [slot, config] of Object.entries(SLOT_POOLS)) {
    selections.slots[slot] = assignSlot(slot, config, scored);
  }

  for (const line of PRODUCT_LINES) {
    selections.products[line] = {};
    for (const angle of PRODUCT_ANGLES) {
      const id = `products/${line}/${angle}`;
      const entry = scored.assets[id];
      const fallbackAssigned = entry?.passed && entry.score >= QUALITY_THRESHOLD;
      selections.products[line][angle] = fallbackAssigned
        ? { assigned: true, category: "products", slug: `${line}/${angle}`, score: entry.score, source: id }
        : {
            assigned: false,
            category: "products",
            slug: `${line}/${angle}`,
            score: entry?.score ?? 0,
            source: id,
            reason: entry ? `score ${entry.score} < ${QUALITY_THRESHOLD}` : "not generated",
          };
    }
  }

  const assignedCount = Object.values(selections.slots).filter((s) => s.assigned).length;
  const productAssigned = Object.values(selections.products).flatMap((p) => Object.values(p)).filter((s) => s.assigned).length;

  selections.summary = {
    slotsAssigned: assignedCount,
    slotsTotal: Object.keys(selections.slots).length,
    productsAssigned: productAssigned,
    productsTotal: PRODUCT_LINES.length * PRODUCT_ANGLES.length,
  };

  mkdirSync(join(__dirname, "data"), { recursive: true });
  writeFileSync(SELECTIONS_SCRIPT, JSON.stringify(selections, null, 2));
  writeFileSync(SELECTIONS_SRC, JSON.stringify(selections, null, 2));

  console.log(`Selections: ${assignedCount}/${selections.summary.slotsTotal} site slots, ${productAssigned}/${selections.summary.productsTotal} product angles`);
  console.log(`Written: ${SELECTIONS_SRC}`);
}

main();
