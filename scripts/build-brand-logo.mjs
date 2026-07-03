#!/usr/bin/env node
/**
 * Build brand derivatives from public/images/brand/logo.png — exact official file, no edits.
 * Only allowed operation: lossless copy, or proportional resize for favicon sizes.
 */
import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const brandDir = path.join(root, "public/images/brand");
const appDir = path.join(root, "src/app");

const LOGO_PNG = path.join(brandDir, "logo.png");

async function logoMeta() {
  const meta = await sharp(LOGO_PNG).metadata();
  return {
    width: meta.width ?? 791,
    height: meta.height ?? 1024,
  };
}

async function writeSvgFromPng(name, pngBuffer, width, height) {
  const b64 = pngBuffer.toString("base64");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="BeyondBabyCo">
  <image width="${width}" height="${height}" href="data:image/png;base64,${b64}"/>
</svg>`;
  await writeFile(path.join(brandDir, name), svg);
}

/** Proportional resize only — keeps original pixels (including background) intact. */
async function resizeLogo(targetW, targetH) {
  return sharp(LOGO_PNG)
    .resize(targetW, targetH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  const sourcePng = await readFile(LOGO_PNG);
  const { width, height } = await logoMeta();

  for (const name of ["logo.svg", "logo-dark.svg", "logo-light.svg", "logo-icon.svg", "favicon.svg"]) {
    await writeSvgFromPng(name, sourcePng, width, height);
    console.log(`Wrote ${name}`);
  }

  // Exact copies — no modification
  await copyFile(LOGO_PNG, path.join(brandDir, "logo-email.png"));
  await copyFile(LOGO_PNG, path.join(brandDir, "og-image.png"));
  console.log("Wrote logo-email.png (exact copy)");
  console.log("Wrote og-image.png (exact copy)");

  const sizes = [
    { name: "favicon-16.png", size: 16 },
    { name: "favicon-32.png", size: 32 },
    { name: "favicon-48.png", size: 48 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
  ];

  for (const { name, size } of sizes) {
    const buf = await resizeLogo(size, size);
    await writeFile(path.join(brandDir, name), buf);
    console.log(`Wrote ${name} (${size}×${size})`);
  }

  const fav32 = await readFile(path.join(brandDir, "favicon-32.png"));
  await writeFile(path.join(appDir, "favicon.ico"), fav32);
  await writeFile(path.join(appDir, "icon.png"), await readFile(path.join(brandDir, "icon-512.png")));
  await writeFile(path.join(appDir, "apple-icon.png"), await readFile(path.join(brandDir, "apple-touch-icon.png")));
  console.log("Wrote src/app/favicon.ico, icon.png, apple-icon.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
