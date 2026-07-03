#!/usr/bin/env node
/**
 * Phase 12.0 — Build production brand derivatives + scan real asset manifest.
 *
 * Usage:
 *   node scripts/build-brand-assets.mjs
 *   npm run brand:assets
 */

import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const brandDir = path.join(root, "public/images/brand");
const socialDir = path.join(brandDir, "social");
const splashDir = path.join(brandDir, "splash");
const realDir = path.join(root, "public/images/real");
const appDir = path.join(root, "src/app");
const manifestPath = path.join(root, "src/lib/brand/real-assets-manifest.json");

const LOGO_PNG = path.join(brandDir, "logo.png");
const CREAM = { r: 255, g: 253, b: 248 };
const GREEN = { r: 34, g: 85, b: 54 };

const FORMATS = new Set([".webp", ".png", ".jpg", ".jpeg"]);

async function logoMeta() {
  const meta = await sharp(LOGO_PNG).metadata();
  return { width: meta.width ?? 791, height: meta.height ?? 1024 };
}

async function writeSvgFromPng(name, pngBuffer, width, height) {
  const b64 = pngBuffer.toString("base64");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="BeyondBabyCo">
  <image width="${width}" height="${height}" href="data:image/png;base64,${b64}"/>
</svg>`;
  await writeFile(path.join(brandDir, name), svg);
}

async function resizeLogo(targetW, targetH, opts = {}) {
  return sharp(LOGO_PNG)
    .resize(targetW, targetH, {
      fit: opts.fit ?? "contain",
      background: opts.background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function creamGradient(width, height) {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fffdf8"/>
        <stop offset="50%" stop-color="#fef9eb"/>
        <stop offset="100%" stop-color="#f3fbf6"/>
      </linearGradient>
      <radialGradient id="r" cx="80%" cy="20%" r="60%">
        <stop offset="0%" stop-color="#dff5e7" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#fffdf8" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect width="100%" height="100%" fill="url(#r)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function compositeLogoCard(width, height, logoMaxHeight, tagline) {
  const bg = await creamGradient(width, height);
  const logoH = Math.round(height * logoMaxHeight);
  const logoBuf = await resizeLogo(Math.round(logoH * 0.77), logoH);
  const logoMeta2 = await sharp(logoBuf).metadata();
  const lw = logoMeta2.width ?? 200;
  const lh = logoMeta2.height ?? logoH;

  const composites = [
    {
      input: logoBuf,
      top: Math.round((height - lh) / 2 - (tagline ? height * 0.06 : 0)),
      left: Math.round((width - lw) / 2),
    },
  ];

  if (tagline) {
    const textSvg = Buffer.from(`<svg width="${width}" height="80" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Montserrat, Helvetica, sans-serif" font-size="${Math.round(width * 0.028)}"
        font-weight="600" fill="#276a42">${tagline}</text>
    </svg>`);
    composites.push({
      input: textSvg,
      top: Math.round(height / 2 + lh / 2 - height * 0.02),
      left: 0,
    });
  }

  return sharp(bg).composite(composites).png({ compressionLevel: 9 }).toBuffer();
}

async function buildSocialAssets() {
  await mkdir(socialDir, { recursive: true });
  await mkdir(splashDir, { recursive: true });

  const tagline = "Every Baby Deserves The Safest Touch";

  const cards = [
    { name: "og-default.png", w: 1200, h: 630, logoH: 0.42, tagline: true, also: ["og-home.png", "og-image.png"] },
    { name: "twitter-card.png", w: 1200, h: 630, logoH: 0.42, tagline: true },
    { name: "linkedin.png", w: 1200, h: 627, logoH: 0.4, tagline: true },
    { name: "whatsapp-preview.png", w: 1200, h: 630, logoH: 0.38, tagline: false },
    { name: "instagram-post.png", w: 1080, h: 1080, logoH: 0.35, tagline: true },
    { name: "instagram-story.png", w: 1080, h: 1920, logoH: 0.22, tagline: true },
    { name: "pinterest.png", w: 1000, h: 1500, logoH: 0.2, tagline: true },
  ];

  for (const card of cards) {
    const buf = await compositeLogoCard(card.w, card.h, card.logoH, card.tagline ? tagline : null);
    const out = path.join(socialDir, card.name);
    await writeFile(out, buf);
    console.log(`Wrote social/${card.name} (${card.w}×${card.h})`);
    if (card.also) {
      for (const alias of card.also) {
        await writeFile(path.join(brandDir, alias), buf);
        console.log(`Wrote ${alias} (alias)`);
      }
    }
    if (card.name === "og-default.png") {
      await writeFile(path.join(brandDir, "og-default.png"), buf);
      console.log("Wrote og-default.png (brand root)");
    }
  }

  for (const [name, w, h] of [
    ["splash-1280x720.png", 1280, 720],
    ["splash-750x1334.png", 750, 1334],
  ]) {
    const buf = await compositeLogoCard(w, h, 0.28, tagline);
    await writeFile(path.join(splashDir, name), buf);
    console.log(`Wrote splash/${name}`);
  }
}

async function buildLogoVariants(sourcePng, width, height) {
  await writeFile(path.join(brandDir, "logo-dark.png"), sourcePng);
  await writeFile(path.join(brandDir, "logo-light.png"), sourcePng);
  console.log("Wrote logo-dark.png, logo-light.png");

  const mono = await sharp(sourcePng).grayscale().png({ compressionLevel: 9 }).toBuffer();
  await writeFile(path.join(brandDir, "logo-monochrome.png"), mono);
  console.log("Wrote logo-monochrome.png");

  const iconSize = 512;
  const iconBuf = await resizeLogo(iconSize, iconSize, {
    background: CREAM,
  });
  await writeFile(path.join(brandDir, "logo-icon.png"), iconBuf);
  console.log(`Wrote logo-icon.png (${iconSize}×${iconSize})`);

  for (const name of ["logo.svg", "logo-dark.svg", "logo-light.svg", "logo-icon.svg", "favicon.svg"]) {
    await writeSvgFromPng(name, sourcePng, width, height);
    console.log(`Wrote ${name}`);
  }
}

async function buildIcons() {
  const sizes = [
    { name: "favicon-16.png", size: 16 },
    { name: "favicon-32.png", size: 32 },
    { name: "favicon-48.png", size: 48 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "android-chrome-192.png", size: 192 },
    { name: "android-chrome-512.png", size: 512 },
  ];

  for (const { name, size } of sizes) {
    const pad = name.includes("maskable") ? Math.round(size * 0.12) : 0;
    const inner = size - pad * 2;
    const buf = await resizeLogo(inner, inner, { background: CREAM });
    const final =
      pad > 0
        ? await sharp({
            create: { width: size, height: size, channels: 4, background: { ...GREEN, alpha: 1 } },
          })
            .composite([{ input: buf, top: pad, left: pad }])
            .png({ compressionLevel: 9 })
            .toBuffer()
        : await sharp({
            create: { width: size, height: size, channels: 4, background: { ...CREAM, alpha: 1 } },
          })
            .composite([{ input: buf, top: pad, left: pad }])
            .png({ compressionLevel: 9 })
            .toBuffer();
    await writeFile(path.join(brandDir, name), final);
    console.log(`Wrote ${name} (${size}×${size})`);
  }

  const maskable = await resizeLogo(Math.round(512 * 0.6), Math.round(512 * 0.6), { background: CREAM });
  const maskableFinal = await sharp({
    create: { width: 512, height: 512, channels: 4, background: { ...GREEN, alpha: 1 } },
  })
    .composite([{ input: maskable, top: Math.round(512 * 0.2), left: Math.round(512 * 0.2) }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(path.join(brandDir, "icon-maskable-512.png"), maskableFinal);
  console.log("Wrote icon-maskable-512.png");

  const emailLogo = await resizeLogo(320, 414, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  await writeFile(path.join(brandDir, "logo-email.png"), emailLogo);
  console.log("Wrote logo-email.png (email-optimised)");

  const fav32 = await readFile(path.join(brandDir, "favicon-32.png"));
  await writeFile(path.join(appDir, "favicon.ico"), fav32);
  await writeFile(path.join(appDir, "icon.png"), await readFile(path.join(brandDir, "icon-512.png")));
  await writeFile(path.join(appDir, "apple-icon.png"), await readFile(path.join(brandDir, "apple-touch-icon.png")));
  console.log("Wrote src/app/favicon.ico, icon.png, apple-icon.png");
}

async function walkRealAssets(dir, base = "") {
  const results = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "README.md") continue;
      const rel = base ? `${base}/${entry.name}` : entry.name;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...(await walkRealAssets(full, rel)));
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (!FORMATS.has(ext)) continue;
        const key = rel.replace(/\.(webp|png|jpe?g)$/i, "");
        const st = await stat(full);
        const meta = await sharp(full).metadata().catch(() => ({}));
        results.push({
          key,
          path: `/images/real/${rel.replace(/\\/g, "/")}`,
          format: ext.slice(1).replace("jpeg", "jpg"),
          size: st.size,
          width: meta.width,
          height: meta.height,
        });
      }
    }
  } catch {
    /* real dir may not exist yet */
  }
  return results;
}

async function scanRealManifest() {
  await mkdir(realDir, { recursive: true });
  const found = await walkRealAssets(realDir);
  const assets = {};
  for (const item of found) {
    assets[item.key] = {
      path: item.path,
      format: item.format,
      width: item.width,
      height: item.height,
    };
  }

  const manifest = {
    version: "12.0",
    updatedAt: new Date().toISOString(),
    assets,
    stats: {
      total: found.length,
      editorial: found.filter((f) => f.key.startsWith("editorial/")).length,
      products: found.filter((f) => f.key.startsWith("products/")).length,
      categories: found.filter((f) => f.key.startsWith("categories/")).length,
      og: found.filter((f) => f.key.startsWith("og/")).length,
    },
  };

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Real asset manifest: ${found.length} production assets`);
  return manifest;
}

async function main() {
  const sourcePng = await readFile(LOGO_PNG);
  const { width, height } = await logoMeta();

  await buildLogoVariants(sourcePng, width, height);
  await buildIcons();
  await buildSocialAssets();
  const manifest = await scanRealManifest();

  const report = {
    phase: "12.0",
    builtAt: new Date().toISOString(),
    logo: { width, height },
    socialAssets: [
      "og-default.png",
      "og-home.png",
      "twitter-card.png",
      "linkedin.png",
      "whatsapp-preview.png",
      "instagram-post.png",
      "instagram-story.png",
      "pinterest.png",
    ],
    icons: [
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
    ],
    realAssets: manifest.stats,
  };

  await writeFile(
    path.join(root, "scripts/assets/data/phase-12-brand-build.json"),
    JSON.stringify(report, null, 2),
  );
  console.log("Phase 12.0 brand assets complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
