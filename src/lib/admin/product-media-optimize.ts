import "server-only";

import sharp from "sharp";

const RESPONSIVE_WIDTHS = [480, 768, 1024, 1536];

export interface OptimizedUpload {
  mainWebp: Buffer;
  avif: Buffer | null;
  thumb: Buffer;
  retina: Buffer;
  responsive: Record<number, Buffer>;
  blurDataUrl: string;
  width: number;
  height: number;
  mainSizeBytes: number;
}

export async function optimizeProductUpload(buffer: Buffer): Promise<OptimizedUpload> {
  const meta = await sharp(buffer).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  const mainWebp = await sharp(buffer).webp({ quality: 88, effort: 4 }).toBuffer();
  let avif: Buffer | null = null;
  try {
    avif = await sharp(buffer).avif({ quality: 65, effort: 4 }).toBuffer();
  } catch {
    avif = null;
  }

  const responsive: Record<number, Buffer> = {};
  for (const w of RESPONSIVE_WIDTHS) {
    if (width >= w * 0.85) {
      responsive[w] = await sharp(mainWebp).resize(w, null, { withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    }
  }

  const thumb = await sharp(mainWebp).resize(480, null, { withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const retinaTarget = Math.min(Math.max(width, 1024) * 2, 2048);
  const retina = await sharp(mainWebp)
    .resize(retinaTarget, null, { withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const blurBuf = await sharp(mainWebp).resize(16, null, { withoutEnlargement: true }).webp({ quality: 50 }).toBuffer();
  const blurDataUrl = `data:image/webp;base64,${blurBuf.toString("base64")}`;

  return {
    mainWebp,
    avif,
    thumb,
    retina,
    responsive,
    blurDataUrl,
    width,
    height,
    mainSizeBytes: mainWebp.length,
  };
}

export function isOptimizableImage(mimeType: string): boolean {
  return mimeType.startsWith("image/") && mimeType !== "image/svg+xml" && mimeType !== "image/gif";
}
