#!/usr/bin/env node
/**
 * Phase 11.4A — Score all generated editorial assets on disk.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { scoreEditorialImage, QUALITY_THRESHOLD } from "./lib/quality-score.mjs";
import { FLUX_CATALOG_11_4A } from "./lib/flux-catalog-11-4a.mjs";
import { ASSET_CATALOG } from "./lib/catalog.mjs";
import { GENERATED_ROOT } from "./lib/pipeline.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const SCORES_PATH = join(__dirname, "data", "flux-scores.json");
const MANIFEST_PATH = join(__dirname, "data", "manifest.json");

function loadManifestMap() {
  if (!existsSync(MANIFEST_PATH)) return {};
  const data = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const map = {};
  for (const asset of data.assets ?? []) {
    map[asset.id] = asset;
  }
  return map;
}

function walkPngFiles(dir, base = "") {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "_rejected") continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkPngFiles(full, rel));
    } else if (entry.name.endsWith(".png") && !/-(?:480|768|1024|1536)\.png$/.test(entry.name)) {
      results.push(rel.replace(/\.png$/, ""));
    }
  }
  return results;
}

function parsePath(relPath) {
  const slash = relPath.indexOf("/");
  if (slash === -1) return { category: relPath.split("/")[0], slug: relPath };
  const category = relPath.slice(0, slash);
  const slug = relPath.slice(slash + 1);
  return { category, slug };
}

async function scorePath(relPath, manifestMap) {
  const pngPath = join(ROOT, GENERATED_ROOT, `${relPath}.png`);
  if (!existsSync(pngPath)) return null;
  const buffer = readFileSync(pngPath);
  const { category, slug } = parsePath(relPath);
  const id = `${category}/${slug}`;
  const catalogEntry =
    [...FLUX_CATALOG_11_4A, ...ASSET_CATALOG].find((a) => a.category === category && a.slug === slug) ?? {};
  const manifestEntry = manifestMap[id];
  const webpPath = join(ROOT, GENERATED_ROOT, `${relPath}.webp`);
  const webpBytes = existsSync(webpPath) ? statSync(webpPath).size : undefined;
  const procedural =
    manifestEntry?.procedural === true ||
    (manifestEntry?.sizeBytes != null && manifestEntry.sizeBytes < 18000) ||
    (webpBytes != null && webpBytes < 18000) ||
    buffer.length < 150000;

  const score = await scoreEditorialImage(buffer, {
    width: catalogEntry.width ?? manifestEntry?.width,
    height: catalogEntry.height ?? manifestEntry?.height,
    category,
    procedural,
    webpBytes,
  });
  return {
    id,
    category,
    slug,
    score: score.total,
    passed: score.passed,
    hardRejectReasons: score.hardRejectReasons,
    breakdown: score.breakdown,
    procedural,
    scoredAt: new Date().toISOString(),
  };
}

async function main() {
  const genDir = join(ROOT, GENERATED_ROOT);
  const paths = walkPngFiles(genDir);
  const manifestMap = loadManifestMap();
  const assets = {};
  let passed = 0;
  let failed = 0;

  for (const rel of paths) {
    const result = await scorePath(rel, manifestMap);
    if (!result) continue;
    assets[result.id] = result;
    if (result.passed) passed++;
    else failed++;
  }

  const data = {
    phase: "11.4a",
    threshold: QUALITY_THRESHOLD,
    updatedAt: new Date().toISOString(),
    total: Object.keys(assets).length,
    passed,
    failed,
    assets,
  };

  mkdirSync(join(__dirname, "data"), { recursive: true });
  writeFileSync(SCORES_PATH, JSON.stringify(data, null, 2));
  console.log(`Scored ${data.total} assets: ${passed} passed, ${failed} below ${QUALITY_THRESHOLD}`);
  console.log(`Scores written: ${SCORES_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
