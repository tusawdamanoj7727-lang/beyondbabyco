import "server-only";

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";

const RESPONSIVE_WIDTHS = [480, 768, 1024, 1536];

export async function writeGeneratedDerivatives(category: string, slug: string, pngBuffer: Buffer) {
  const relBase = join("public/images/generated", category, `${slug}`);
  const absBase = join(process.cwd(), relBase);
  mkdirSync(dirname(absBase), { recursive: true });

  writeFileSync(`${absBase}.png`, pngBuffer);

  const mainWebp = await sharp(pngBuffer).webp({ quality: 88, effort: 4 }).toBuffer();
  writeFileSync(`${absBase}.webp`, mainWebp);

  try {
    const avifBuf = await sharp(pngBuffer).avif({ quality: 65, effort: 4 }).toBuffer();
    writeFileSync(`${absBase}.avif`, avifBuf);
  } catch {
    /* optional */
  }

  const meta = await sharp(mainWebp).metadata();
  for (const width of RESPONSIVE_WIDTHS) {
    if ((meta.width ?? 0) >= width * 0.85) {
      const buf = await sharp(mainWebp).resize(width, null, { withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      writeFileSync(`${absBase}-${width}.webp`, buf);
    }
  }

  const blurBuf = await sharp(mainWebp).resize(16, null, { withoutEnlargement: true }).webp({ quality: 50 }).toBuffer();
  writeFileSync(`${absBase}.blur.txt`, `data:image/webp;base64,${blurBuf.toString("base64")}`, "utf8");
}
