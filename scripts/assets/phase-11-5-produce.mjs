#!/usr/bin/env node
/**
 * Phase 11.5 — Production pipeline: approve QC-pass assets, assign all storefront slots.
 *
 * Usage:
 *   node scripts/assets/phase-11-5-produce.mjs
 *   node scripts/assets/phase-11-5-produce.mjs --generate
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import {
  ASSET_POOLS,
  PHASE_11_5_THRESHOLD,
  buildPhase115Slots,
  PHASE_11_5_GENERATION_GROUPS,
} from "./lib/phase-11-5-slots.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..", "..");
const SCORES_PATH = join(__dirname, "data", "flux-scores.json");
const REVIEWS_PATH = join(ROOT, "src/lib/brand/asset-reviews.json");
const COVERAGE_PATH = join(__dirname, "data", "phase-11-5-coverage.json");

const args = parseArgs({ options: { generate: { type: "boolean", default: false } } });

function readReviews() {
  return JSON.parse(readFileSync(REVIEWS_PATH, "utf8"));
}

function writeReviews(data) {
  const payload = { ...data, updatedAt: new Date().toISOString(), phase: "11.5" };
  const json = JSON.stringify(payload, null, 2);
  for (const p of [REVIEWS_PATH, join(__dirname, "data", "asset-reviews.json")]) {
    mkdirSync(join(p, ".."), { recursive: true });
    const tmp = `${p}.tmp`;
    writeFileSync(tmp, json);
    renameSync(tmp, p);
  }
}

function loadScores() {
  if (!existsSync(SCORES_PATH)) return { assets: {} };
  return JSON.parse(readFileSync(SCORES_PATH, "utf8"));
}

function parseAssetId(id) {
  const i = id.indexOf("/");
  if (i === -1) return { category: id, slug: "" };
  return { category: id.slice(0, i), slug: id.slice(i + 1) };
}

function poolMatch(assetId, poolName) {
  const prefixes = ASSET_POOLS[poolName] ?? [];
  return prefixes.some((p) => assetId.startsWith(p) || assetId === p.replace(/\/$/, ""));
}

function main() {
  const scores = loadScores();
  const slots = buildPhase115Slots();
  const reviews = readReviews();

  const passed = Object.entries(scores.assets ?? {})
    .filter(([, v]) => v.passed && v.score >= PHASE_11_5_THRESHOLD)
    .sort((a, b) => b[1].score - a[1].score);

  let approved = 0;
  let rejected = 0;

  for (const [assetId, entry] of Object.entries(scores.assets ?? {})) {
    const existing = reviews.reviews[assetId];
    const { category, slug } = parseAssetId(assetId);

    if (entry.passed && entry.score >= PHASE_11_5_THRESHOLD) {
      reviews.reviews[assetId] = {
        ...(existing ?? {}),
        assetId,
        category,
        slug,
        status: "approved",
        score: entry.score,
        scoreBreakdown: entry.breakdown,
        hardRejectReasons: entry.hardRejectReasons,
        reviewedAt: new Date().toISOString(),
        reviewedBy: "phase-11-5-qc",
        tags: existing?.tags ?? ["Generated", "Editorial"],
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        publicUrl: `/images/generated/${category}/${slug}.webp`,
      };
      approved++;
    } else if (!existing || existing.status === "pending") {
      reviews.reviews[assetId] = {
        ...(existing ?? { assetId, category, slug, tags: ["Generated"], createdAt: new Date().toISOString(), publicUrl: `/images/generated/${category}/${slug}.webp` }),
        status: "rejected",
        score: entry?.score ?? 0,
        reviewedBy: "phase-11-5-qc",
        reviewedAt: new Date().toISOString(),
      };
      rejected++;
    }
  }

  const usedAssets = new Set();
  let assigned = 0;
  const coverage = {};
  const missing = [];

  for (const [slotKey, config] of Object.entries(slots)) {
    let candidates = passed.filter(([id]) => poolMatch(id, config.pool) && !usedAssets.has(id));
    if (!candidates.length) {
      candidates = passed.filter(([id]) => !usedAssets.has(id));
    }
    if (!candidates.length) candidates = passed;

    const pick = candidates[0];
    if (pick) {
      const [assetId] = pick;
      const review = reviews.reviews[assetId];
      if (review?.status === "approved") {
        reviews.slotAssignments[slotKey] = {
          assetId,
          slotKey,
          confirmedAt: new Date().toISOString(),
          confirmedBy: "phase-11-5-production",
        };
        if (slotKey.startsWith("TIMELINE.") || slotKey.startsWith("TESTIMONIAL.")) {
          usedAssets.add(assetId);
        }
        assigned++;
        coverage[slotKey] = { assetId, score: review.score, status: "approved" };
        continue;
      }
    }

    missing.push({ slotKey, pool: config.pool, fallback: config.fallback });
    coverage[slotKey] = { status: "missing", fallback: config.fallback };
  }

  writeReviews(reviews);

  const stats = {
    phase: "11.5",
    producedAt: new Date().toISOString(),
    approved,
    rejected,
    slotsTotal: Object.keys(slots).length,
    slotsAssigned: assigned,
    coveragePct: Math.round((assigned / Object.keys(slots).length) * 1000) / 10,
    missingSlots: missing.length,
    passedAssetsAvailable: passed.length,
    coverage,
    missing,
  };

  mkdirSync(join(__dirname, "data"), { recursive: true });
  writeFileSync(COVERAGE_PATH, JSON.stringify(stats, null, 2));

  console.log("Phase 11.5 production complete");
  console.log(`  QC approved: ${approved}`);
  console.log(`  QC rejected: ${rejected}`);
  console.log(`  Slots assigned: ${assigned}/${stats.slotsTotal} (${stats.coveragePct}%)`);
  console.log(`  Missing: ${missing.length}`);

  if (args.values.generate) {
    console.log("\nGenerate missing scenes:");
    for (const g of PHASE_11_5_GENERATION_GROUPS) {
      console.log(`  node scripts/assets/flux-generate.mjs --group ${g.group} --limit ${g.count}`);
    }
  }
}

main();
