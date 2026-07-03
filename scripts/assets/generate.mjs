#!/usr/bin/env node
/**
 * Phase 11.3 — AI Asset Studio generator.
 *
 * Usage:
 *   node --experimental-strip-types scripts/assets/generate.mjs --category hero
 *   node --experimental-strip-types scripts/assets/generate.mjs --category products --flux
 *   node --experimental-strip-types scripts/assets/generate.mjs --category decorative --procedural
 *   node --experimental-strip-types scripts/assets/generate.mjs --all --procedural
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { ASSET_CATALOG, NPM_CATEGORY_MAP, ASSET_CATEGORIES } from "./lib/catalog.mjs";
import { buildPrompt, getNegativePrompt } from "./lib/prompts.mjs";

import { checkComfyHealth, generateComfyImage, loadConfig, resolveGenerationDimensions } from "../lib/comfy-generate.mjs";
import { loadEnvFile } from "../env-config.mjs";
import { generateProceduralAsset } from "./lib/procedural.mjs";
import { ensureCategoryDirs, isAssetCached, writeAssetDerivatives } from "./lib/pipeline.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const MANIFEST_PATH = join(__dirname, "data", "manifest.json");

const args = parseArgs({
  options: {
    category: { type: "string", short: "c" },
    all: { type: "boolean", default: false },
    flux: { type: "boolean", default: false },
    procedural: { type: "boolean", default: false },
    limit: { type: "string" },
    "dry-run": { type: "boolean", default: false },
    force: { type: "boolean", default: false },
  },
  allowPositionals: false,
});

function log(msg) {
  console.log(msg);
}

function resolveCategories() {
  const cat = args.values.category?.trim();
  if (args.values.all) return [...ASSET_CATEGORIES];
  if (!cat) {
    console.error("Provide --category <name> or --all");
    process.exit(1);
  }
  const mapped = NPM_CATEGORY_MAP[cat];
  if (mapped) return mapped;
  if (ASSET_CATEGORIES.includes(cat)) return [cat];
  console.error(`Unknown category: ${cat}. Valid: ${Object.keys(NPM_CATEGORY_MAP).join(", ")}`);
  process.exit(1);
}

function selectAssets(categories) {
  const limit = args.values.limit ? Math.max(1, Number(args.values.limit)) : undefined;
  let assets = ASSET_CATALOG.filter((a) => categories.includes(a.category));
  if (limit) assets = assets.slice(0, limit);
  return assets;
}

function buildAssetPrompt(asset) {
  const vars = { subject: asset.subject, ...(asset.vars ?? {}) };
  if (asset.template === "macro-ingredient") vars.ingredient = asset.subject;
  return buildPrompt(asset.template, vars);
}

async function generateOne(root, env, asset, mode) {
  if (!args.values.force && isAssetCached(root, asset)) {
    return { id: asset.id, cached: true, procedural: false, durationMs: 0 };
  }

  if (args.values["dry-run"]) {
    log(`  [dry-run] ${asset.id}`);
    log(`    prompt: ${buildAssetPrompt(asset).slice(0, 120)}…`);
    return { id: asset.id, dryRun: true };
  }

  let buffer;
  let durationMs = 0;
  let procedural = false;

  if (mode === "flux") {
    const dims = resolveGenerationDimensions(asset.width, asset.height);
    const seed = hashSeed(asset.id);
    const result = await generateComfyImage(root, env, {
      prompt: buildAssetPrompt(asset),
      negativePrompt: getNegativePrompt(),
      width: dims.genWidth,
      height: dims.genHeight,
      seed,
    });
    buffer = result.buffer;
    durationMs = result.durationMs;
  } else {
    const result = await generateProceduralAsset(asset);
    buffer = result.buffer;
    durationMs = result.durationMs;
    procedural = true;
  }

  const written = await writeAssetDerivatives(root, asset, buffer, { procedural, durationMs });
  return {
    id: asset.id,
    category: asset.category,
    slug: asset.slug,
    url: `${written.paths.publicUrl}.webp`,
    width: written.width,
    height: written.height,
    procedural,
    durationMs,
    sizeBytes: written.sizeBytes,
  };
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function updateManifest(results, categories) {
  let existing = { phase: "11.3", generatedAt: null, assets: [], counts: {} };
  if (existsSync(MANIFEST_PATH)) {
    try {
      existing = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
    } catch {
      /* fresh manifest */
    }
  }

  const byId = new Map((existing.assets ?? []).map((a) => [a.id, a]));
  for (const r of results) {
    if (r.dryRun) continue;
    byId.set(r.id, { ...byId.get(r.id), ...r, updatedAt: new Date().toISOString() });
  }

  const assets = [...byId.values()];
  const counts = {};
  for (const a of assets) {
    counts[a.category] = (counts[a.category] ?? 0) + 1;
  }

  const manifest = {
    phase: "11.3",
    generatedAt: new Date().toISOString(),
    categories,
    catalogTotal: ASSET_CATALOG.length,
    generatedTotal: assets.length,
    counts,
    assets,
  };

  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
  return manifest;
}

async function main() {
  const categories = resolveCategories();
  const assets = selectAssets(categories);
  ensureCategoryDirs(ROOT, ASSET_CATEGORIES);

  const env = loadEnvFile(join(ROOT, ".env.local"), readFileSync, existsSync);
  let mode = "procedural";
  if (args.values.flux && !args.values.procedural) {
    const health = await checkComfyHealth(loadConfig(env));
    if (health.available) {
      mode = "flux";
      log(`ComfyUI ready (${health.latencyMs}ms) — FLUX generation`);
    } else {
      log(`ComfyUI unavailable (${health.error}) — falling back to procedural`);
    }
  } else {
    log("Procedural generation (use --flux when ComfyUI is running for editorial FLUX output)");
  }

  log(`\nPhase 11.3 Asset Studio — ${assets.length} assets in [${categories.join(", ")}]\n`);

  const results = [];
  for (const asset of assets) {
    log(`→ ${asset.id}`);
    try {
      const result = await generateOne(ROOT, env, asset, mode);
      results.push(result);
      if (result.cached) log("  ↷ cached");
      else if (!result.dryRun) log(`  ✓ ${result.procedural ? "procedural" : "flux"} (${result.durationMs}ms)`);
    } catch (err) {
      log(`  ⚠ ${err instanceof Error ? err.message : err}`);
      try {
        const fallback = await generateProceduralAsset(asset);
        const written = await writeAssetDerivatives(ROOT, asset, fallback.buffer, {
          procedural: true,
          durationMs: fallback.durationMs,
        });
        results.push({
          id: asset.id,
          category: asset.category,
          slug: asset.slug,
          url: `${written.paths.publicUrl}.webp`,
          procedural: true,
          fallback: true,
          durationMs: fallback.durationMs,
        });
        log("  ↳ procedural fallback");
      } catch (fallbackErr) {
        log(`  ✗ ${fallbackErr instanceof Error ? fallbackErr.message : fallbackErr}`);
      }
    }
  }

  if (!args.values["dry-run"]) {
    const manifest = updateManifest(results, categories);
    log(`\nManifest: ${MANIFEST_PATH}`);
    log(`Generated: ${manifest.generatedTotal} / ${manifest.catalogTotal} catalog entries`);
  }

  log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
