/** Phase 11.3 — Write PNG + WebP/AVIF/blur/responsive derivatives. */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";

export const RESPONSIVE_WIDTHS = [480, 768, 1024, 1536];
export const GENERATED_ROOT = "public/images/generated";

export function assetFilePaths(root, asset) {
  const rel = join(GENERATED_ROOT, asset.category, asset.slug);
  const absBase = join(root, rel);
  return {
    relBase: rel,
    png: `${absBase}.png`,
    webp: `${absBase}.webp`,
    avif: `${absBase}.avif`,
    blur: `${absBase}.blur.txt`,
    responsive: (width) => `${absBase}-${width}.webp`,
    publicUrl: `/images/generated/${asset.category}/${asset.slug}`,
  };
}

export async function writeAssetDerivatives(root, asset, pngBuffer, meta = {}) {
  const paths = assetFilePaths(root, asset);
  mkdirSync(dirname(paths.png), { recursive: true });

  let source = pngBuffer;
  if (asset.width && asset.height) {
    source = await sharp(pngBuffer)
      .resize(asset.width, asset.height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
      .png()
      .toBuffer();
  }

  writeFileSync(paths.png, source);

  const mainWebp = await sharp(source).webp({ quality: 88, effort: 4 }).toBuffer();
  writeFileSync(paths.webp, mainWebp);

  try {
    const avifBuf = await sharp(source).avif({ quality: 65, effort: 4 }).toBuffer();
    writeFileSync(paths.avif, avifBuf);
  } catch {
    /* AVIF optional */
  }

  const imgMeta = await sharp(mainWebp).metadata();
  for (const width of RESPONSIVE_WIDTHS) {
    if ((imgMeta.width ?? 0) >= width * 0.85) {
      const buf = await sharp(mainWebp).resize(width, null, { withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      writeFileSync(paths.responsive(width), buf);
    }
  }

  const blurBuf = await sharp(mainWebp).resize(16, null, { withoutEnlargement: true }).webp({ quality: 50 }).toBuffer();
  const blurDataUrl = `data:image/webp;base64,${blurBuf.toString("base64")}`;
  writeFileSync(paths.blur, blurDataUrl, "utf8");

  return {
    paths,
    width: imgMeta.width ?? asset.width,
    height: imgMeta.height ?? asset.height,
    sizeBytes: mainWebp.length,
    procedural: meta.procedural ?? false,
    durationMs: meta.durationMs ?? 0,
  };
}

export function isAssetCached(root, asset) {
  const paths = assetFilePaths(root, asset);
  return existsSync(paths.webp) && existsSync(paths.blur);
}

export function ensureCategoryDirs(root, categories) {
  for (const cat of categories) {
    mkdirSync(join(root, GENERATED_ROOT, cat), { recursive: true });
  }
}
