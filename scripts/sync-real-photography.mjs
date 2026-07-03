#!/usr/bin/env node
/**
 * Final Task 1 — Sync production photography into /images/real for the existing resolver.
 *
 * Reads approved slot assignments from asset-reviews.json, copies matching production
 * sources (Phase 8.1 hero WebP, Phase 8.5 packaging) into canonical real-asset keys,
 * then writes a sync report. Run `npm run brand:assets` afterward to refresh the manifest.
 *
 * Usage:
 *   node scripts/sync-real-photography.mjs
 *   npm run brand:sync-real
 */

import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const realDir = path.join(publicDir, "images/real");
const reviewsPath = path.join(root, "src/lib/brand/asset-reviews.json");
const reportPath = path.join(root, "scripts/assets/data/sync-real-photography-report.json");

/** Product slug folder (phase-8-5) → resolver product line keys */
const PRODUCT_LINE_MAP = {
  "2-in-1-wash-shampoo": ["baby-wash", "baby-shampoo"],
};

const SKIP_DIRS = new Set(["responsive", "thumbs"]);

async function ensureDir(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function copyIfNewer(src, dest) {
  if (!existsSync(src)) return { copied: false, reason: "missing-source" };
  await ensureDir(dest);
  if (existsSync(dest)) {
    const [srcStat, destStat] = await Promise.all([stat(src), stat(dest)]);
    if (srcStat.mtimeMs <= destStat.mtimeMs && srcStat.size === destStat.size) {
      return { copied: false, reason: "up-to-date" };
    }
  }
  await copyFile(src, dest);
  return { copied: true, reason: "synced" };
}

async function walkWebp(dir, base = "") {
  const results = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkWebp(full, rel)));
    } else if (/\.webp$/i.test(entry.name)) {
      results.push({ rel, full, stem: rel.replace(/\.webp$/i, "") });
    }
  }
  return results;
}

function collectApprovedAssets(reviews) {
  const byKey = new Map();

  for (const review of Object.values(reviews.reviews ?? {})) {
    if (review.status !== "approved") continue;
    const key = `${review.category}/${review.slug}`;
    byKey.set(key, { category: review.category, slug: review.slug, assetId: review.assetId, source: "approved-review" });
  }

  for (const assignment of Object.values(reviews.slotAssignments ?? {})) {
    const review = reviews.reviews?.[assignment.assetId];
    if (!review || review.status !== "approved") continue;
    const key = `${review.category}/${review.slug}`;
    byKey.set(key, {
      category: review.category,
      slug: review.slug,
      assetId: review.assetId,
      slotKey: assignment.slotKey,
      source: "slot-assignment",
    });
  }

  return [...byKey.values()];
}

function resolveProductionSource(category, slug) {
  if (category === "hero" && slug.startsWith("phase-8-1/")) {
    const src = path.join(publicDir, "images/hero", `${slug}.webp`);
    if (existsSync(src)) {
      return { src, destKey: `hero/${slug}`, priority: "hero-editorial" };
    }
  }

  if (category === "products") {
    const [line, angle] = slug.split("/");
    if (!line || !angle) return null;
    for (const [folder, lines] of Object.entries(PRODUCT_LINE_MAP)) {
      if (!lines.includes(line)) continue;
      const packaging = path.join(publicDir, "images/products/phase-8-5", folder, "packaging", `${angle}.webp`);
      if (existsSync(packaging)) {
        return { src: packaging, destKey: `products/${line}/${angle}`, priority: "product-packaging" };
      }
    }
  }

  return null;
}

async function syncHeroPhase81() {
  const heroRoot = path.join(publicDir, "images/hero/phase-8-1");
  const files = await walkWebp(heroRoot, "phase-8-1");
  const results = [];

  for (const file of files) {
    const destKey = `hero/${file.stem}`;
    const dest = path.join(realDir, `${destKey}.webp`);
    const outcome = await copyIfNewer(file.full, dest);
    results.push({
      destKey,
      source: file.full.replace(`${root}/`, ""),
      ...outcome,
      priority: "hero",
    });
  }

  return results;
}

async function syncProductPackaging() {
  const results = [];
  for (const [folder, lines] of Object.entries(PRODUCT_LINE_MAP)) {
    const packagingDir = path.join(publicDir, "images/products/phase-8-5", folder, "packaging");
    const files = await walkWebp(packagingDir);
    for (const file of files) {
      const angle = path.basename(file.stem);
      for (const line of lines) {
        const destKey = `products/${line}/${angle}`;
        const dest = path.join(realDir, `${destKey}.webp`);
        const outcome = await copyIfNewer(file.full, dest);
        results.push({
          destKey,
          source: file.full.replace(`${root}/`, ""),
          productLine: line,
          angle,
          ...outcome,
          priority: "product",
        });
      }
    }
  }
  return results;
}

async function syncApprovedTargets(approved) {
  const results = [];
  for (const asset of approved) {
    const resolved = resolveProductionSource(asset.category, asset.slug);
    const destKey = `${asset.category}/${asset.slug}`;
    if (!resolved) {
      results.push({
        destKey,
        assetId: asset.assetId,
        slotKey: asset.slotKey ?? null,
        copied: false,
        reason: "no-production-source",
        fallback: "approved-flux",
      });
      continue;
    }
    const dest = path.join(realDir, `${resolved.destKey}.webp`);
    const outcome = await copyIfNewer(resolved.src, dest);
    results.push({
      destKey: resolved.destKey,
      assetId: asset.assetId,
      slotKey: asset.slotKey ?? null,
      source: resolved.src.replace(`${root}/`, ""),
      ...outcome,
      fallback: outcome.copied || existsSync(dest) ? "real" : "approved-flux",
    });
  }
  return results;
}

function slotPriority(slotKey) {
  if (!slotKey) return 99;
  if (slotKey.startsWith("EDITORIAL.hero")) return 1;
  if (slotKey.startsWith("PRODUCT.")) return 2;
  if (slotKey.includes("product") || slotKey.startsWith("SCENE.product")) return 3;
  if (slotKey.startsWith("EDITORIAL.newsletter")) return 4;
  if (slotKey.startsWith("TIMELINE.") || slotKey.startsWith("CONTENT_EDITORIAL.research")) return 5;
  if (slotKey.startsWith("EDITORIAL.lifestyle") || slotKey.startsWith("SCENE.lifestyle")) return 6;
  if (slotKey.startsWith("TRUST_EDITORIAL.") || slotKey.startsWith("EDITORIAL.trust")) return 7;
  if (slotKey.startsWith("TESTIMONIAL.")) return 8;
  return 50;
}

async function main() {
  const reviews = JSON.parse(await readFile(reviewsPath, "utf8"));
  const approved = collectApprovedAssets(reviews);

  const [heroResults, productResults, approvedResults] = await Promise.all([
    syncHeroPhase81(),
    syncProductPackaging(),
    syncApprovedTargets(approved),
  ]);

  const copied = [...heroResults, ...productResults].filter((r) => r.copied);
  const realKeys = new Set(
    [...heroResults, ...productResults, ...approvedResults]
      .filter((r) => r.copied || r.reason === "up-to-date" || r.fallback === "real")
      .map((r) => r.destKey),
  );

  const slotCoverage = approvedResults
    .filter((r) => r.slotKey)
    .map((r) => ({
      slot: r.slotKey,
      priority: slotPriority(r.slotKey),
      destKey: r.destKey,
      status: realKeys.has(r.destKey) ? "real" : "flux-fallback",
      assetId: r.assetId,
    }))
    .sort((a, b) => a.priority - b.priority || a.slot.localeCompare(b.slot));

  const report = {
    syncedAt: new Date().toISOString(),
    summary: {
      approvedAssets: approved.length,
      heroProductionSynced: heroResults.filter((r) => r.copied || r.reason === "up-to-date").length,
      productProductionSynced: productResults.filter((r) => r.copied || r.reason === "up-to-date").length,
      newlyCopied: copied.length,
      realAssetKeys: realKeys.size,
      slotsWithReal: slotCoverage.filter((s) => s.status === "real").length,
      slotsFluxFallback: slotCoverage.filter((s) => s.status === "flux-fallback").length,
    },
    slotCoverage,
    hero: heroResults,
    products: productResults,
    approved: approvedResults,
  };

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log(`Real photography sync complete`);
  console.log(`  Hero production files: ${heroResults.length}`);
  console.log(`  Product packaging files: ${productResults.length}`);
  console.log(`  Newly copied: ${copied.length}`);
  console.log(`  Real asset keys: ${realKeys.size}`);
  console.log(`  Slot coverage (real): ${report.summary.slotsWithReal}/${slotCoverage.length}`);
  console.log(`Report: ${reportPath.replace(`${root}/`, "")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
