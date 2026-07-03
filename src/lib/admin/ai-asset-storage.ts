/**
 * Phase 11.4C — Atomic JSON persistence for AI asset reviews (no DB schema).
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { AiAssetReviewsFile, AiAssetReview, AiGenerationMeta } from "./ai-asset-types";

const ROOT = process.cwd();
export const REVIEWS_PATH = join(ROOT, "src/lib/brand/asset-reviews.json");
export const REVIEWS_MIRROR_PATH = join(ROOT, "scripts/assets/data/asset-reviews.json");
export const SCORES_PATH = join(ROOT, "scripts/assets/data/flux-scores.json");
export const GENERATED_DIR = join(ROOT, "public/images/generated");

export function emptyReviewsFile(): AiAssetReviewsFile {
  return {
    phase: "11.4c",
    updatedAt: null,
    reviews: {},
    slotAssignments: {},
    packagingReferences: {},
  };
}

export function readReviewsFile(): AiAssetReviewsFile {
  if (!existsSync(REVIEWS_PATH)) return emptyReviewsFile();
  try {
    return JSON.parse(readFileSync(REVIEWS_PATH, "utf8")) as AiAssetReviewsFile;
  } catch {
    return emptyReviewsFile();
  }
}

export function writeReviewsFile(data: AiAssetReviewsFile) {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  const json = JSON.stringify(payload, null, 2);
  for (const path of [REVIEWS_PATH, REVIEWS_MIRROR_PATH]) {
    mkdirSync(join(path, ".."), { recursive: true });
    const tmp = `${path}.tmp`;
    writeFileSync(tmp, json, "utf8");
    renameSync(tmp, path);
  }
}

export function readFluxScores(): {
  assets?: Record<
    string,
    {
      score?: number;
      passed?: boolean;
      breakdown?: Record<string, number>;
      hardRejectReasons?: string[];
      procedural?: boolean;
    }
  >;
} {
  if (!existsSync(SCORES_PATH)) return { assets: {} };
  try {
    return JSON.parse(readFileSync(SCORES_PATH, "utf8"));
  } catch {
    return { assets: {} };
  }
}

export function assetIdFromParts(category: string, slug: string) {
  return `${category}/${slug}`;
}

export function parseAssetId(assetId: string) {
  const i = assetId.indexOf("/");
  if (i === -1) return { category: assetId, slug: "" };
  return { category: assetId.slice(0, i), slug: assetId.slice(i + 1) };
}

export function publicUrlForAsset(category: string, slug: string) {
  return `/images/generated/${category}/${slug}.webp`;
}

export function pngPathForAsset(category: string, slug: string) {
  return join(GENERATED_DIR, category, `${slug}.png`);
}

export function registerReviewEntry(
  assetId: string,
  patch: Partial<AiAssetReview> & {
    prompt?: string;
    negativePrompt?: string;
    generation?: AiGenerationMeta;
  },
) {
  const file = readReviewsFile();
  const { category, slug } = parseAssetId(assetId);
  const existing = file.reviews[assetId];
  file.reviews[assetId] = {
    assetId,
    category,
    slug,
    status: existing?.status ?? "pending",
    score: patch.score ?? existing?.score ?? 0,
    scene: patch.scene ?? existing?.scene ?? slug,
    productLine: category === "products" ? slug.split("/")[0] : patch.productLine ?? existing?.productLine,
    prompt: patch.prompt ?? existing?.prompt,
    negativePrompt: patch.negativePrompt ?? existing?.negativePrompt,
    generation: patch.generation ?? existing?.generation,
    scoreBreakdown: patch.scoreBreakdown ?? existing?.scoreBreakdown,
    hardRejectReasons: patch.hardRejectReasons ?? existing?.hardRejectReasons,
    tags: existing?.tags ?? ["Generated", "Editorial"],
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    publicUrl: publicUrlForAsset(category, slug),
  };
  writeReviewsFile(file);
}
