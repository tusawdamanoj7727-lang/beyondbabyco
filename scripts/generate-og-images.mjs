#!/usr/bin/env node
/**
 * Generates static Open Graph JPG assets (1200×630) under public/images/og/.
 * Run: node scripts/generate-og-images.mjs
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "public/images/og");
const W = 1200;
const H = 630;
const BG = "#faf5f0";
const GREEN = "#2d5a27";
const MUTED = "#666666";

function textSvg({ title, subtitle, eyebrow }) {
  const safeTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const safeSubtitle = subtitle.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const safeEyebrow = eyebrow?.replace(/&/g, "&amp;").replace(/</g, "&lt;") ?? "";

  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${BG}"/>
  ${eyebrow ? `<text x="600" y="220" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="600" fill="${MUTED}" letter-spacing="3">${safeEyebrow}</text>` : ""}
  <text x="600" y="${eyebrow ? 290 : 270}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="800" fill="${GREEN}">${safeTitle}</text>
  <text x="600" y="${eyebrow ? 350 : 330}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="500" fill="${MUTED}">${safeSubtitle}</text>
  <text x="600" y="${H - 48}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="600" fill="${GREEN}">beyondbabyco.in</text>
</svg>`);
}

function splitLayoutSvg({ title, subtitle, side = "left" }) {
  const panelX = side === "left" ? 0 : 520;
  const safeTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const safeSubtitle = subtitle.replace(/&/g, "&amp;").replace(/</g, "&lt;");

  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${panelX}" y="0" width="680" height="${H}" fill="${BG}" opacity="0.94"/>
  <text x="${panelX + 60}" y="250" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="800" fill="${GREEN}">${safeTitle}</text>
  <text x="${panelX + 60}" y="320" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="500" fill="${MUTED}">${safeSubtitle}</text>
  <text x="${panelX + 60}" y="${H - 48}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="600" fill="${GREEN}">beyondbabyco.in</text>
</svg>`);
}

async function resizeCover(input, width, height) {
  return sharp(input).resize(width, height, { fit: "cover", position: "centre" }).png().toBuffer();
}

async function resizeContain(input, width, height) {
  return sharp(input).resize(width, height, { fit: "contain", background: BG }).png().toBuffer();
}

async function createOgHome() {
  const hero = path.join(
    process.cwd(),
    "public/images/generated/homepage/phase-8-2/lifestyle/lifestyle-01.png",
  );
  const logo = path.join(process.cwd(), "public/images/brand/logo.svg");

  const heroLayer = await resizeCover(hero, 620, H);
  const logoLayer = await sharp(logo).resize(220).png().toBuffer();
  const overlay = splitLayoutSvg({
    title: "BeyondBabyCo",
    subtitle: "Every Baby Deserves The Safest Touch",
    side: "right",
  });

  await sharp({
    create: { width: W, height: H, channels: 3, background: BG },
  })
    .composite([
      { input: heroLayer, left: 0, top: 0 },
      { input: overlay, left: 0, top: 0 },
      { input: logoLayer, left: 780, top: 120 },
    ])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(ROOT, "og-home.jpg"));
}

async function createOgProducts() {
  const products = ["baby-wash", "baby-lotion", "baby-wipes"].map((slug) =>
    path.join(process.cwd(), `public/images/generated/products/${slug}/front.png`),
  );

  const tiles = await Promise.all(products.map((p) => resizeContain(p, 300, 420)));
  const overlay = splitLayoutSvg({
    title: "Shop Baby Care",
    subtitle: "Gentle, research-backed essentials",
    side: "left",
  });

  const collage = await sharp({
    create: { width: 620, height: H, channels: 3, background: "#eef5ea" },
  })
    .composite([
      { input: tiles[0], left: 40, top: 120 },
      { input: tiles[1], left: 170, top: 80 },
      { input: tiles[2], left: 300, top: 120 },
    ])
    .png()
    .toBuffer();

  await sharp({
    create: { width: W, height: H, channels: 3, background: BG },
  })
    .composite([
      { input: collage, left: 580, top: 0 },
      { input: overlay, left: 0, top: 0 },
    ])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(ROOT, "og-products.jpg"));
}

async function createOgDefault() {
  const logo = path.join(process.cwd(), "public/images/brand/logo.svg");
  const logoLayer = await sharp(logo).resize(280).png().toBuffer();
  const overlay = textSvg({
    eyebrow: "BEYOND BABY CO",
    title: "BeyondBabyCo",
    subtitle: "Every Baby Deserves The Safest Touch",
  });

  await sharp(overlay)
    .composite([{ input: logoLayer, left: 460, top: 72 }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(ROOT, "og-default.jpg"));
}

await mkdir(ROOT, { recursive: true });
await createOgHome();
await createOgProducts();
await createOgDefault();
console.log("Generated OG images in public/images/og/");
