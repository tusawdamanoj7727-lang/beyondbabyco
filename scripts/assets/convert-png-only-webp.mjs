#!/usr/bin/env node
/**
 * Convert PNG-only generated assets (e.g. Phase 8.1 hero library) to delivery WebP.
 * Skips files that already have a sibling .webp.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { RESPONSIVE_WIDTHS } from "./lib/pipeline.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..", "..");
const GENERATED = join(ROOT, "public/images/generated");

function walkPngOnly(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkPngOnly(full, out);
      continue;
    }
    if (!entry.name.endsWith(".png")) continue;
    if (/-(?:480|768|1024|1536)\.png$/.test(entry.name)) continue;
    const webp = full.replace(/\.png$/, ".webp");
    if (!existsSync(webp)) out.push(full);
  }
  return out;
}

async function convertOne(pngPath) {
  const webpPath = pngPath.replace(/\.png$/, ".webp");
  const source = readFileSync(pngPath);
  const mainWebp = await sharp(source).webp({ quality: 88, effort: 4 }).toBuffer();
  writeFileSync(webpPath, mainWebp);

  const meta = await sharp(mainWebp).metadata();
  for (const width of RESPONSIVE_WIDTHS) {
    if ((meta.width ?? 0) >= width * 0.85) {
      const buf = await sharp(mainWebp)
        .resize(width, null, { withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      writeFileSync(pngPath.replace(/\.png$/, `-${width}.webp`), buf);
    }
  }

  return { pngPath, webpPath, bytes: mainWebp.length };
}

async function main() {
  const targets = walkPngOnly(GENERATED);
  if (!targets.length) {
    console.log("No PNG-only assets found — nothing to convert.");
    return;
  }

  let converted = 0;
  for (const pngPath of targets) {
    const rel = pngPath.replace(GENERATED + "/", "");
    const result = await convertOne(pngPath);
    converted++;
    console.log(`  ✓ ${rel} → ${Math.round(result.bytes / 1024)}KB webp`);
  }

  console.log(`\nConverted ${converted} PNG-only asset(s) to WebP.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
