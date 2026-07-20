#!/usr/bin/env node
/**
 * Build brand derivatives from public/images/brand/logo.png.
 * Crops transparent/black padding, then writes favicons + SVG wrappers.
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
const FOREST = { r: 45, g: 90, b: 55 };

async function prepareLockup() {
  const { data, info } = await sharp(LOGO_PNG).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 8) continue;
      if (r < 28 && g < 28 && b < 28) {
        data[i] = FOREST.r;
        data[i + 1] = FOREST.g;
        data[i + 2] = FOREST.b;
        data[i + 3] = 255;
      }
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  const pad = 16;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);

  const buf = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(LOGO_PNG, buf);
  const meta = await sharp(buf).metadata();
  return { width: meta.width ?? 717, height: meta.height ?? 348, buf };
}

async function writeSvgFromPng(name, pngBuffer, width, height) {
  const b64 = pngBuffer.toString("base64");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="BeyondBabyCo">
  <image width="${width}" height="${height}" href="data:image/png;base64,${b64}"/>
</svg>`;
  await writeFile(path.join(brandDir, name), svg);
}

async function main() {
  const { width, height, buf } = await prepareLockup();
  console.log(`Lockup ready ${width}×${height}`);

  for (const name of ["logo.svg", "logo-dark.svg", "logo-light.svg", "logo-icon.svg", "favicon.svg"]) {
    await writeSvgFromPng(name, buf, width, height);
    console.log(`Wrote ${name}`);
  }

  await copyFile(LOGO_PNG, path.join(brandDir, "logo-dark.png"));
  await copyFile(LOGO_PNG, path.join(brandDir, "logo-light.png"));
  await copyFile(LOGO_PNG, path.join(brandDir, "logo-lockup.png"));
  await sharp(LOGO_PNG).resize({ width: 320 }).png().toFile(path.join(brandDir, "logo-email.png"));

  await sharp(LOGO_PNG)
    .extract({ left: 0, top: 0, width: Math.min(Math.round(height * 1.05), width), height })
    .resize(512, 512, { fit: "contain", background: { r: 255, g: 253, b: 248, alpha: 0 } })
    .png()
    .toFile(path.join(brandDir, "logo-icon.png"));

  const sizes = [
    { name: "favicon-16.png", size: 16, cream: false },
    { name: "favicon-32.png", size: 32, cream: false },
    { name: "favicon-48.png", size: 48, cream: false },
    { name: "apple-touch-icon.png", size: 180, cream: true },
    { name: "icon-192.png", size: 192, cream: true },
    { name: "icon-512.png", size: 512, cream: true },
    { name: "android-chrome-192.png", size: 192, cream: true },
    { name: "android-chrome-512.png", size: 512, cream: true },
    { name: "icon-maskable-512.png", size: 512, cream: true },
  ];

  for (const { name, size, cream } of sizes) {
    await sharp(LOGO_PNG)
      .resize(size, size, {
        fit: "contain",
        background: cream
          ? { r: 255, g: 253, b: 248, alpha: 1 }
          : { r: 255, g: 253, b: 248, alpha: 0 },
      })
      .png()
      .toFile(path.join(brandDir, name));
    console.log(`Wrote ${name} (${size}×${size})`);
  }

  await writeFile(path.join(appDir, "favicon.ico"), await readFile(path.join(brandDir, "favicon-32.png")));
  await writeFile(path.join(appDir, "icon.png"), await readFile(path.join(brandDir, "icon-512.png")));
  await writeFile(path.join(appDir, "apple-icon.png"), await readFile(path.join(brandDir, "apple-touch-icon.png")));
  console.log("Wrote src/app/favicon.ico, icon.png, apple-icon.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
