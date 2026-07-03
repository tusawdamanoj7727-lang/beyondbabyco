#!/usr/bin/env node
/**
 * Layer 1 — Generate master scene library (once, reused across all products).
 *
 * Usage:
 *   node scripts/master-scenes-generate.mjs
 *   node scripts/master-scenes-generate.mjs --procedural   # instant (<1s each)
 *   node scripts/master-scenes-generate.mjs --flux --candidates 1
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { checkComfyHealth, generateComfyImage, loadConfig, resolveGenerationDimensions } from "./lib/comfy-generate.mjs";
import {
  MASTER_SCENES,
  SCENE_NEGATIVE,
  SCENE_PHASE,
  scenePrompt,
  scenePaths,
} from "./lib/master-scene-catalog.mjs";
import { generateProceduralScene } from "./lib/master-scene-procedural.mjs";
import { optimizeProductPng } from "./lib/product-asset-lib.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const MANIFEST = join(__dirname, "data", "master-scenes-manifest.json");

const args = parseArgs({
  options: {
    procedural: { type: "boolean", default: false },
    flux: { type: "boolean", default: false },
    candidates: { type: "string", default: "1" },
  },
});

function log(msg) {
  console.log(msg);
}

async function generateScene(root, env, scene, useFlux, candidateCount) {
  const paths = scenePaths(root, scene.slug);
  mkdirSync(join(root, "public", "images", "products", SCENE_PHASE), { recursive: true });

  if (existsSync(paths.png) && existsSync(paths.main)) {
    log(`  ↷ ${scene.slug} (cached)`);
    return { slug: scene.slug, cached: true, durationMs: 0 };
  }

  let best = null;

  if (useFlux) {
    const dims = resolveGenerationDimensions(scene.w, scene.h);
    for (let c = 0; c < candidateCount; c++) {
      try {
        const { buffer, durationMs } = await generateComfyImage(root, env, {
          prompt: scenePrompt(scene),
          negativePrompt: SCENE_NEGATIVE,
          width: dims.genWidth,
          height: dims.genHeight,
          seed: 1000 + scene.slug.length + c,
        });
        if (!best || durationMs < best.durationMs) best = { buffer, durationMs };
        log(`    flux candidate ${c + 1}: ${scene.slug} (${durationMs}ms)`);
      } catch (err) {
        log(`    ⚠ flux ${scene.slug}: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  if (!best) {
    const proc = await generateProceduralScene(scene.slug, scene.w, scene.h);
    best = proc;
    log(`    procedural: ${scene.slug} (${proc.durationMs}ms)`);
  }

  writeFileSync(paths.png, best.buffer);
  const optimized = await optimizeProductPng(best.buffer, scene.slug, {
    targetWidth: scene.w,
    targetHeight: scene.h,
  });
  writeFileSync(paths.main, optimized.mainWebp);

  return {
    slug: scene.slug,
    name: scene.name,
    url: paths.publicUrl,
    durationMs: best.durationMs,
    procedural: best.procedural ?? false,
    width: scene.w,
    height: scene.h,
  };
}

async function main() {
  const useFlux = args.values.flux && !args.values.procedural;
  const candidateCount = Math.max(1, Number(args.values.candidates) || 1);

  log("\n══ Layer 1 — Master Scene Library ══\n");

  let env = {};
  if (useFlux) {
    const health = await checkComfyHealth(loadConfig(process.env));
    if (!health.available) {
      log(`⚠ ComfyUI offline — falling back to procedural scenes`);
    } else {
      log(`✓ ComfyUI online (${health.latencyMs}ms)`);
      env = process.env;
    }
  } else {
    log("Mode: procedural (instant brand backgrounds)");
  }

  const results = [];
  let totalMs = 0;

  for (const scene of MASTER_SCENES) {
    log(`→ ${scene.name}`);
    const health = useFlux ? await checkComfyHealth(loadConfig(env)) : { available: false };
    const record = await generateScene(ROOT, env, scene, health.available, candidateCount);
    results.push(record);
    totalMs += record.durationMs ?? 0;
  }

  mkdirSync(join(__dirname, "data"), { recursive: true });
  writeFileSync(
    MANIFEST,
    JSON.stringify({ version: "8.5a", updatedAt: new Date().toISOString(), scenes: results, totalMs }, null, 2),
  );

  log(`\n✓ ${results.length} master scenes ready (${Math.round(totalMs / 1000)}s total)`);
  log(`  Manifest: ${MANIFEST}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
