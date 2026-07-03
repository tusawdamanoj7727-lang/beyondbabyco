#!/usr/bin/env node
/**
 * Phase 12.0 — QA audit for brand & production assets.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const REPORT = join(ROOT, "scripts/assets/data/phase-12-qa-audit.json");

const REQUIRED_BRAND = [
  "logo.png",
  "logo-dark.png",
  "logo-light.png",
  "logo-icon.png",
  "logo-monochrome.png",
  "logo-email.png",
  "favicon.svg",
  "favicon-16.png",
  "favicon-32.png",
  "favicon-48.png",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "android-chrome-192.png",
  "android-chrome-512.png",
  "og-default.png",
  "og-home.png",
];

const REQUIRED_SOCIAL = [
  "twitter-card.png",
  "linkedin.png",
  "whatsapp-preview.png",
  "instagram-post.png",
  "instagram-story.png",
  "pinterest.png",
];

const LEGACY_PLACEHOLDERS = [
  "product-botanical.svg",
  "forest-canopy.svg",
  "science-care.svg",
  "lifestyle-family.svg",
  "beyondbabyco-logo.png",
];

function walkImages(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkImages(full, acc);
    else if (/\.(png|webp|jpg|jpeg|svg)$/i.test(entry.name)) acc.push(full);
  }
  return acc;
}

function checkAltInTsx() {
  const issues = [];
  const components = walkImages(join(ROOT, "src/components")).filter((f) => f.endsWith(".tsx"));
  for (const file of components.slice(0, 200)) {
    const src = readFileSync(file, "utf8");
    if (src.includes("<Image") && !src.includes('alt=') && !src.includes("alt={")) {
      issues.push({ file: file.replace(ROOT + "/", ""), issue: "Image without alt" });
    }
  }
  return issues.slice(0, 20);
}

function main() {
  const brandDir = join(ROOT, "public/images/brand");
  const socialDir = join(brandDir, "social");
  const missing = [];
  const present = [];

  for (const f of REQUIRED_BRAND) {
    const p = join(brandDir, f);
    if (existsSync(p)) present.push(f);
    else missing.push(f);
  }

  const socialMissing = [];
  for (const f of REQUIRED_SOCIAL) {
    if (!existsSync(join(socialDir, f))) socialMissing.push(f);
  }

  const legacyOnDisk = LEGACY_PLACEHOLDERS.filter((f) => existsSync(join(brandDir, f)));

  let manifest = { assets: {}, stats: { total: 0 } };
  const manifestPath = join(ROOT, "src/lib/brand/real-assets-manifest.json");
  if (existsSync(manifestPath)) {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  }

  const generatedCount = walkImages(join(ROOT, "public/images/generated")).length;
  const realCount = Object.keys(manifest.assets ?? {}).length;

  const appIcons = ["favicon.ico", "icon.png", "apple-icon.png"].map((f) => ({
    file: `src/app/${f}`,
    exists: existsSync(join(ROOT, "src/app", f)),
  }));

  const audit = {
    phase: "12.0",
    auditedAt: new Date().toISOString(),
    brandAssets: { present: present.length, missing, total: REQUIRED_BRAND.length },
    socialAssets: { missing: socialMissing, complete: socialMissing.length === 0 },
    appIcons,
    realAssets: manifest.stats ?? { total: realCount },
    generatedAssetsOnDisk: generatedCount,
    legacyPlaceholdersOnDisk: legacyOnDisk,
    altIssues: checkAltInTsx(),
    retinaReady: present.filter((f) => f.includes("512") || f.includes("og-")).length >= 3,
    productionReady: missing.length === 0 && socialMissing.length === 0,
  };

  writeReport(audit);
  console.log(`Brand QA: ${present.length}/${REQUIRED_BRAND.length} brand files`);
  console.log(`Social: ${REQUIRED_SOCIAL.length - socialMissing.length}/${REQUIRED_SOCIAL.length}`);
  console.log(`Real assets: ${realCount} | Generated on disk: ${generatedCount}`);
  console.log(`Production ready: ${audit.productionReady ? "YES" : "NEEDS ATTENTION"}`);
  if (missing.length) console.log("Missing:", missing.join(", "));
}

function writeReport(data) {
  mkdirSync(join(REPORT, ".."), { recursive: true });
  writeFileSync(REPORT, JSON.stringify(data, null, 2));
  console.log(`Report: ${REPORT}`);
}

main();
