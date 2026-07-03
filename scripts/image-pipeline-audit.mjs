#!/usr/bin/env node
/** Phase 10.1D — Full image pipeline audit (read-only scan). */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const PUBLIC_IMAGES = join(ROOT, "public", "images");
const SRC = join(ROOT, "src");
const OUT_JSON = join(ROOT, "tmp", "image-audit.json");
const OUT_MD = join(ROOT, "docs", "IMAGE_PIPELINE_REPORT.md");

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"]);
const RESPONSIVE_WIDTHS = [480, 768, 1024, 1536];

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (IMAGE_EXT.has(extname(name).toLowerCase())) acc.push(full);
  }
  return acc;
}

function scanSrcForPatterns() {
  const files = [];
  function walkSrc(dir) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory() && name !== "node_modules") walkSrc(full);
      else if (/\.(tsx?|jsx?|css)$/.test(name)) files.push(full);
    }
  }
  walkSrc(SRC);

  const nextImage = [];
  const rawImg = [];
  const cssBg = [];
  const preload = [];

  for (const file of files) {
    const rel = relative(ROOT, file);
    const text = readFileSync(file, "utf8");
    if (text.includes('from "next/image"') || text.includes("from 'next/image'")) {
      nextImage.push(rel);
    }
    for (const m of text.matchAll(/<img\b[^>]*>/g)) rawImg.push({ file: rel, tag: m[0].slice(0, 120) });
    for (const m of text.matchAll(/backgroundImage:\s*`url\([^`]+\)`/g)) cssBg.push({ file: rel, snippet: m[0].slice(0, 80) });
    for (const m of text.matchAll(/background-image:\s*url\(/g)) cssBg.push({ file: rel, snippet: "background-image: url(...)" });
    if (text.includes('rel="preload"') && text.includes('as="image"')) preload.push(rel);
  }

  return { nextImageFiles: [...new Set(nextImage)], rawImg, cssBg, preload };
}

function classifyAssetPath(relPath) {
  const p = relPath.replace(/\\/g, "/");
  if (p.includes("/hero/")) return "hero";
  if (p.includes("/homepage/")) return "homepage";
  if (p.includes("/products/")) return "products";
  if (p.includes("/brand/")) return "brand";
  if (p.includes("/generated/")) return "generated";
  if (p.includes("/mascot")) return "mascots";
  return "other";
}

function companionPaths(basePath) {
  const dir = join(basePath, "..");
  const stem = basename(basePath, extname(basePath));
  return {
    webp: join(dir, `${stem}.webp`),
    avif: join(dir, `${stem}.avif`),
    responsive: RESPONSIVE_WIDTHS.map((w) => join(dir, "responsive", `${stem}-${w}.webp`)),
  };
}

async function main() {
  const diskFiles = walk(PUBLIC_IMAGES);
  const byExt = {};
  const byCategory = {};
  const assets = [];
  let totalBytes = 0;

  for (const full of diskFiles) {
    const rel = relative(join(ROOT, "public"), full);
    const st = statSync(full);
    const ext = extname(full).toLowerCase().slice(1);
    byExt[ext] = (byExt[ext] ?? 0) + 1;
    const cat = classifyAssetPath(rel);
    byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    totalBytes += st.size;

    const companions = companionPaths(full);
    const entry = {
      path: `/${rel.replace(/\\/g, "/")}`,
      format: ext,
      sizeBytes: st.size,
      sizeKb: Math.round(st.size / 1024),
      category: cat,
      hasWebp: existsSync(companions.webp),
      hasAvif: existsSync(companions.avif),
    };
    assets.push(entry);
  }

  assets.sort((a, b) => b.sizeBytes - a.sizeBytes);

  const pngWithoutWebp = assets.filter((a) => a.format === "png" && !a.hasWebp);
  const rasterWithoutAvif = assets.filter(
    (a) => ["png", "jpg", "jpeg", "webp"].includes(a.format) && !a.hasAvif && a.format !== "webp",
  );
  const duplicates = [];
  const byStem = new Map();
  for (const a of assets) {
    const stem = basename(a.path, extname(a.path));
    const key = `${a.category}:${stem}`;
    if (byStem.has(key)) duplicates.push([byStem.get(key), a.path]);
    else byStem.set(key, a.path);
  }

  const codeScan = scanSrcForPatterns();
  const storefrontRawImg = codeScan.rawImg.filter((r) => !r.file.includes("/admin/"));
  const storefrontCssBg = codeScan.cssBg.filter((r) => !r.file.includes("/admin/"));

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      fileCount: diskFiles.length,
      totalMb: Math.round((totalBytes / 1024 / 1024) * 10) / 10,
      byExt,
      byCategory,
    },
    largest: assets.slice(0, 25),
    pngWithoutWebp: pngWithoutWebp.slice(0, 50),
    missingAvifCount: rasterWithoutAvif.length,
    duplicatePairs: duplicates.slice(0, 30),
    code: {
      nextImageComponentFiles: codeScan.nextImageFiles.length,
      rawImgTags: codeScan.rawImg.length,
      storefrontRawImgTags: storefrontRawImg.length,
      cssBackgroundImages: codeScan.cssBg.length,
      storefrontCssBackground: storefrontCssBg.length,
      imagePreloads: codeScan.preload,
      storefrontRawImg,
      storefrontCssBg,
    },
    nextConfig: {
      formats: ["avif", "webp"],
      minimumCacheTTL: "24h",
      remotePatterns: "**.supabase.co/storage/**",
    },
  };

  writeFileSync(OUT_JSON, JSON.stringify(report, null, 2));

  const md = `# Image Pipeline Report

**Generated:** ${report.generatedAt}  
**Scope:** \`public/images\` + storefront source scan

---

## Summary

| Metric | Value |
|--------|-------|
| Files on disk | **${report.totals.fileCount}** |
| Total size | **${report.totals.totalMb} MB** |
| \`next/image\` component files | ${report.code.nextImageComponentFiles} |
| Raw \`<img>\` tags (all src) | ${report.code.rawImgTags} |
| Raw \`<img>\` (storefront) | ${report.code.storefrontRawImgTags} |
| CSS \`background-image\` (storefront) | ${report.code.storefrontCssBackground} |
| PNG without companion WebP | ${pngWithoutWebp.length} |
| Raster missing sidecar AVIF | ${report.missingAvifCount} |
| Hero preloads | ${report.code.imagePreloads.join(", ") || "none"} |

### Format breakdown

${Object.entries(byExt)
  .sort((a, b) => b[1] - a[1])
  .map(([ext, n]) => `- **.${ext}:** ${n}`)
  .join("\n")}

### Category breakdown

${Object.entries(byCategory)
  .sort((a, b) => b[1] - a[1])
  .map(([cat, n]) => `- **${cat}:** ${n}`)
  .join("\n")}

---

## Largest assets (top 25)

| Path | Format | Size |
|------|--------|------|
${report.largest.map((a) => `| \`${a.path}\` | ${a.format} | ${a.sizeKb} KB |`).join("\n")}

---

## PNG without WebP companion (sample)

${pngWithoutWebp.length === 0 ? "_None in public/images._" : pngWithoutWebp.map((a) => `- \`${a.path}\` (${a.sizeKb} KB)`).join("\n")}

---

## Duplicate stems (same name, different format/path)

${duplicates.length === 0 ? "_None detected._" : duplicates.map(([a, b]) => `- \`${a}\` ↔ \`${b}\``).join("\n")}

---

## Storefront images bypassing \`next/image\`

### Raw \`<img>\`

${storefrontRawImg.length === 0 ? "_None._" : storefrontRawImg.map((r) => `- \`${r.file}\`: \`${r.tag}...\``).join("\n")}

### CSS \`background-image\`

${storefrontCssBg.length === 0 ? "_None._" : storefrontCssBg.map((r) => `- \`${r.file}\`: ${r.snippet}`).join("\n")}

---

## CDN / optimizer config

- Next.js formats: AVIF → WebP (runtime optimizer)
- \`minimumCacheTTL\`: 24 hours for \`/_next/image\`
- Supabase remote pattern enabled for product/CMS heroes
- Static \`/images/*\`: recommend \`Cache-Control: public, max-age=31536000, immutable\` for hashed/versioned assets

---

## Product pipeline variants

Pre-generated widths: **480, 768, 1024, 1536** (WebP + AVIF via admin upload / \`product-asset-lib.mjs\`)

Run \`npm run image:backfill-products\` to generate missing optimized variants in Supabase **without overwriting originals**.

Raw JSON: \`tmp/image-audit.json\`
`;

  writeFileSync(OUT_MD, md);
  console.log(`Audit complete: ${diskFiles.length} files, ${report.totals.totalMb} MB`);
  console.log(`Wrote ${relative(ROOT, OUT_MD)}`);
  console.log(`Wrote ${relative(ROOT, OUT_JSON)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
