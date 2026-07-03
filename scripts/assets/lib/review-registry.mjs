/** Register generated asset in review queue (Phase 11.4C). */

import { readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");
const REVIEWS_PATH = join(ROOT, "src/lib/brand/asset-reviews.json");
const REVIEWS_MIRROR = join(__dirname, "..", "data", "asset-reviews.json");

function parseAssetId(assetId) {
  const i = assetId.indexOf("/");
  if (i === -1) return { category: assetId, slug: "" };
  return { category: assetId.slice(0, i), slug: assetId.slice(i + 1) };
}

function readReviews() {
  try {
    return JSON.parse(readFileSync(REVIEWS_PATH, "utf8"));
  } catch {
    return { phase: "11.4c", updatedAt: null, reviews: {}, slotAssignments: {}, packagingReferences: {} };
  }
}

function writeReviews(data) {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  const json = JSON.stringify(payload, null, 2);
  for (const path of [REVIEWS_PATH, REVIEWS_MIRROR]) {
    mkdirSync(dirname(path), { recursive: true });
    const tmp = `${path}.tmp`;
    writeFileSync(tmp, json);
    renameSync(tmp, path);
  }
}

export function registerReviewEntry(assetId, patch = {}) {
  const file = readReviews();
  const { category, slug } = parseAssetId(assetId);
  const existing = file.reviews[assetId];
  file.reviews[assetId] = {
    assetId,
    category,
    slug,
    status: existing?.status ?? "pending",
    score: patch.score ?? existing?.score ?? 0,
    scene: patch.scene ?? existing?.scene ?? slug,
    productLine: category === "products" ? slug.split("/")[0] : existing?.productLine,
    prompt: patch.prompt ?? existing?.prompt,
    negativePrompt: patch.negativePrompt ?? existing?.negativePrompt,
    generation: patch.generation ?? existing?.generation,
    scoreBreakdown: patch.scoreBreakdown ?? existing?.scoreBreakdown,
    hardRejectReasons: patch.hardRejectReasons ?? existing?.hardRejectReasons,
    tags: existing?.tags ?? ["Generated", "Editorial"],
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    publicUrl: `/images/generated/${category}/${slug}.webp`,
  };
  writeReviews(file);
}
