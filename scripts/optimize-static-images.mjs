#!/usr/bin/env node
/**
 * Generate WebP + AVIF companions for static PNG/JPEG in public/images.
 * Originals are NEVER deleted or overwritten.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const PUBLIC_IMAGES = join(ROOT, "public", "images");
const RASTER = new Set([".png", ".jpg", ".jpeg"]);
const RESPONSIVE_WIDTHS = [480, 768, 1024, 1536];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

async function optimizeFile(srcPath, dryRun) {
  const ext = extname(srcPath).toLowerCase();
  if (!RASTER.has(ext)) return null;

  const dir = dirname(srcPath);
  const stem = basename(srcPath, ext);
  const webpPath = join(dir, `${stem}.webp`);
  const avifPath = join(dir, `${stem}.avif`);
  const responsiveDir = join(dir, "responsive");

  const needsWebp = !existsSync(webpPath);
  const needsAvif = !existsSync(avifPath);
  const missingResponsive = RESPONSIVE_WIDTHS.filter(
    (w) => !existsSync(join(responsiveDir, `${stem}-${w}.webp`)),
  );

  if (!needsWebp && !needsAvif && missingResponsive.length === 0) return null;

  if (dryRun) {
    return { srcPath, needsWebp, needsAvif, missingResponsive };
  }

  const input = sharp(srcPath).rotate();
  const meta = await input.metadata();
  const mainWebp = needsWebp
    ? await input.clone().webp({ quality: 88, effort: 4 }).toBuffer()
    : null;

  if (mainWebp) writeFileSync(webpPath, mainWebp);

  const sourceForDerivatives = mainWebp ?? readFileSync(webpPath);

  if (needsAvif) {
    try {
      const avifBuf = await sharp(readFileSync(srcPath)).rotate().avif({ quality: 65, effort: 4 }).toBuffer();
      writeFileSync(avifPath, avifBuf);
    } catch {
      /* AVIF unsupported on platform */
    }
  }

  if (missingResponsive.length) {
    mkdirSync(responsiveDir, { recursive: true });
    for (const w of missingResponsive) {
      if ((meta.width ?? 0) >= w * 0.85) {
        const buf = await sharp(sourceForDerivatives)
          .resize(w, null, { withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
        writeFileSync(join(responsiveDir, `${stem}-${w}.webp`), buf);
      }
    }
  }

  const blurPath = join(dir, "blurs", `${stem}.blur.txt`);
  if (!existsSync(blurPath)) {
    mkdirSync(join(dir, "blurs"), { recursive: true });
    const blurBuf = await sharp(sourceForDerivatives)
      .resize(16, null, { withoutEnlargement: true })
      .webp({ quality: 50 })
      .toBuffer();
    writeFileSync(blurPath, `data:image/webp;base64,${blurBuf.toString("base64")}`, "utf8");
  }

  return { srcPath, needsWebp, needsAvif, missingResponsive };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!existsSync(PUBLIC_IMAGES)) {
    console.log("No public/images directory.");
    return;
  }

  const files = walk(PUBLIC_IMAGES);
  let processed = 0;
  let skipped = 0;

  for (const file of files) {
    const result = await optimizeFile(file, dryRun);
    if (result) {
      processed++;
      const rel = file.replace(ROOT, "");
      console.log(`${dryRun ? "[dry-run] " : ""}Optimized derivatives for ${rel}`);
    } else skipped++;
  }

  console.log(`Done. ${processed} processed, ${skipped} skipped (already optimized or non-raster).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
