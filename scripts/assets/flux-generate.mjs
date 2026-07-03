#!/usr/bin/env node
/**
 * Phase 11.4B — Commercial FLUX generation: 5–8 candidates per scene, keep top 2.
 *
 * Usage:
 *   node scripts/assets/flux-generate.mjs --group hero
 *   node scripts/assets/flux-generate.mjs --all --candidates 6 --force
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { FLUX_SCENES_11_4B, getScenesByCategory, getScenesByGroup } from "./lib/flux-catalog-11-4b.mjs";
import {
  buildPrompt,
  getNegativePrompt,
  candidateSubjectVariation,
  GENERATION_CONFIG,
} from "./lib/prompts.mjs";
import { scoreEditorialImage, QUALITY_THRESHOLD } from "./lib/quality-score.mjs";
import { checkComfyHealth, generateComfyImage, loadConfig, resolveGenerationDimensions } from "../lib/comfy-generate.mjs";
import { loadEnvFile } from "../env-config.mjs";
import { ensureCategoryDirs, writeAssetDerivatives, assetFilePaths } from "./lib/pipeline.mjs";
import { registerReviewEntry } from "./lib/review-registry.mjs";
import { getNegativePrompt as getNeg } from "./lib/prompts.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const SCORES_PATH = join(__dirname, "data", "flux-scores.json");
const REJECTED_ROOT = join(ROOT, "public/images/generated/_rejected");

const args = parseArgs({
  options: {
    group: { type: "string" },
    category: { type: "string", short: "c" },
    all: { type: "boolean", default: false },
    limit: { type: "string" },
    force: { type: "boolean", default: false },
    candidates: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
});

function log(msg) {
  console.log(msg);
}

function resolveCandidateCount() {
  const n = args.values.candidates ? Number(args.values.candidates) : GENERATION_CONFIG.candidatesDefault;
  return Math.max(GENERATION_CONFIG.candidatesMin, Math.min(GENERATION_CONFIG.candidatesMax, n));
}

function buildScenePrompt(scene, candidateIndex) {
  const vars = {
    subject: candidateSubjectVariation(scene.subject, candidateIndex),
    subcategory: scene.subcategory,
    ingredientSlug: scene.ingredientSlug,
    productLine: scene.productLine,
    angle: scene.angle,
    ...(scene.vars ?? {}),
  };
  return buildPrompt(scene.template, vars);
}

function sceneOutputAsset(scene, outputSlug) {
  return {
    id: `${scene.category}/${outputSlug}`,
    category: scene.category,
    slug: outputSlug,
    group: scene.group,
    template: scene.template,
    subject: scene.subject,
    width: scene.width,
    height: scene.height,
    productLine: scene.productLine,
    angle: scene.angle,
  };
}

function selectScenes() {
  let scenes = FLUX_SCENES_11_4B;
  const group = args.values.group?.trim();
  const category = args.values.category?.trim();

  if (group) scenes = getScenesByGroup(group);
  else if (category) scenes = getScenesByCategory(category);
  else if (!args.values.all) {
    console.error("Provide --group, --category, or --all");
    process.exit(1);
  }

  const limit = args.values.limit ? Math.max(1, Number(args.values.limit)) : undefined;
  if (limit) scenes = scenes.slice(0, limit);
  return scenes;
}

function loadScores() {
  if (!existsSync(SCORES_PATH)) return { assets: {}, scenes: {}, updatedAt: null };
  return JSON.parse(readFileSync(SCORES_PATH, "utf8"));
}

function saveScores(data) {
  mkdirSync(join(__dirname, "data"), { recursive: true });
  writeFileSync(SCORES_PATH, JSON.stringify({ ...data, updatedAt: new Date().toISOString(), phase: "11.4b" }, null, 2));
}

async function moveToRejected(relPath, pngBuffer, score, candidateIndex) {
  const destDir = join(REJECTED_ROOT, relPath.replace(/\/[^/]+$/, ""));
  mkdirSync(destDir, { recursive: true });
  const dest = join(REJECTED_ROOT, `${relPath}-candidate-${candidateIndex}.png`);
  writeFileSync(dest, pngBuffer);
  writeFileSync(`${dest}.score.json`, JSON.stringify(score, null, 2));
}

async function generateScene(env, scene, candidateCount) {
  const primaryPaths = assetFilePaths(ROOT, sceneOutputAsset(scene, scene.slug));
  if (!args.values.force && existsSync(primaryPaths.webp) && existsSync(primaryPaths.blur)) {
    const png = readFileSync(primaryPaths.png);
    const score = await scoreEditorialImage(png, {
      width: scene.width,
      height: scene.height,
      category: scene.category,
      template: scene.template,
    });
    return { sceneId: scene.id, cached: true, score, accepted: score.passed, candidates: [] };
  }

  if (args.values["dry-run"]) {
    log(`  [dry-run] ${scene.id} (${candidateCount} candidates → keep ${GENERATION_CONFIG.keepTop})`);
    log(`    prompt: ${buildScenePrompt(scene, 0).slice(0, 160)}…`);
    return { sceneId: scene.id, dryRun: true };
  }

  const healthy = await checkComfyHealth(env);
  if (!healthy?.available) {
    console.error("ComfyUI not reachable. Start with: npm run ai:start");
    process.exit(1);
  }

  const dims = resolveGenerationDimensions(scene.width, scene.height);
  const candidates = [];

  for (let c = 0; c < candidateCount; c++) {
    const prompt = buildScenePrompt(scene, c);
    const t0 = Date.now();
    try {
      const { buffer: pngBuffer, durationMs: fluxMs } = await generateComfyImage(ROOT, env, {
        prompt,
        negativePrompt: getNegativePrompt(),
        width: dims.genWidth,
        height: dims.genHeight,
        seed: Date.now() + c * 9973,
      });
      const durationMs = fluxMs ?? Date.now() - t0;
      const score = await scoreEditorialImage(pngBuffer, {
        width: scene.width,
        height: scene.height,
        category: scene.category,
        template: scene.template,
      });
      candidates.push({ index: c, pngBuffer, score, durationMs, prompt, seed: Date.now() + c * 9973 });
      log(`    candidate ${c + 1}/${candidateCount}: ${score.total}/100 ${score.passed ? "✓" : "✗"} ${score.hardRejectReasons?.join(", ") ?? ""}`);
      if (!score.passed) {
        await moveToRejected(`${scene.category}/${scene.slug}`, pngBuffer, score, c + 1);
      }
    } catch (err) {
      log(`    candidate ${c + 1} error: ${err.message}`);
    }
  }

  const passing = candidates.filter((c) => c.score.passed).sort((a, b) => b.score.total - a.score.total);
  const top = passing.slice(0, GENERATION_CONFIG.keepTop);

  if (top.length === 0) {
    return { sceneId: scene.id, rejected: true, candidates, accepted: 0 };
  }

  const outputs = [
    { asset: sceneOutputAsset(scene, scene.slug), candidate: top[0] },
    top[1] ? { asset: sceneOutputAsset(scene, scene.altSlug), candidate: top[1] } : null,
  ].filter(Boolean);

  for (const { asset, candidate } of outputs) {
    await writeAssetDerivatives(ROOT, asset, candidate.pngBuffer, {
      procedural: false,
      durationMs: candidate.durationMs,
    });
    registerReviewEntry(asset.id, {
      score: candidate.score.total,
      scene: scene.id,
      prompt: candidate.prompt,
      negativePrompt: getNeg(),
      scoreBreakdown: candidate.score.breakdown,
      hardRejectReasons: candidate.score.hardRejectReasons,
      generation: {
        seed: candidate.seed,
        steps: 4,
        cfg: 1,
        sampler: "euler",
        width: scene.width,
        height: scene.height,
        fluxVersion: "flux1-schnell-fp8",
        durationMs: candidate.durationMs,
        sceneId: scene.id,
        candidateIndex: candidate.index,
      },
    });
  }

  return {
    sceneId: scene.id,
    accepted: top.length,
    candidates: candidates.map((c) => ({
      index: c.index,
      score: c.score.total,
      passed: c.score.passed,
      hardRejectReasons: c.score.hardRejectReasons,
      durationMs: c.durationMs,
    })),
    topScores: top.map((t) => t.score.total),
  };
}

async function main() {
  loadEnvFile(ROOT);
  const env = loadConfig();
  const scenes = selectScenes();
  const candidateCount = resolveCandidateCount();
  const categories = [...new Set(scenes.map((s) => s.category))];
  ensureCategoryDirs(ROOT, categories);

  log(`Phase 11.4B commercial FLUX — ${scenes.length} scenes × ${candidateCount} candidates → keep top ${GENERATION_CONFIG.keepTop} (≥${QUALITY_THRESHOLD})`);

  const scores = loadScores();
  scores.scenes ??= {};
  let scenesAccepted = 0;
  let scenesRejected = 0;
  let totalCandidates = 0;
  let candidatesPassed = 0;

  for (const scene of scenes) {
    log(`→ ${scene.id}`);
    try {
      const result = await generateScene(env, scene, candidateCount);
      if (result.cached) {
        log(`  cached ${result.score.total}/100`);
      } else if (result.dryRun) {
        continue;
      } else if (result.accepted > 0) {
        scenesAccepted++;
        totalCandidates += result.candidates.length;
        candidatesPassed += result.candidates.filter((c) => c.passed).length;
        log(`  kept ${result.accepted} — scores ${result.topScores.join(", ")}`);
      } else {
        scenesRejected++;
        totalCandidates += result.candidates?.length ?? 0;
        log(`  no candidate passed threshold`);
      }

      scores.scenes[scene.id] = {
        ...result,
        candidateCount,
        scoredAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error(`  error: ${err.message}`);
      scores.scenes[scene.id] = { error: err.message, passed: false };
    }
  }

  scores.generationStats = {
    scenes: scenes.length,
    scenesAccepted,
    scenesRejected,
    totalCandidates,
    candidatesPassed,
    candidateAcceptanceRate: totalCandidates ? Math.round((candidatesPassed / totalCandidates) * 1000) / 10 : 0,
  };

  saveScores(scores);
  log(`\nDone: ${scenesAccepted} scenes kept, ${scenesRejected} scenes failed, candidate acceptance ${scores.generationStats.candidateAcceptanceRate}%`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
