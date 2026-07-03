/** Procedural master scenes — instant brand-consistent backgrounds (Layer 1 fallback). */

import sharp from "sharp";

const BRAND = {
  cream: "#FDF8F3",
  creamDark: "#E8DDD4",
  sage: "#8BA888",
  sageLight: "#B8CEB5",
  greenMid: "#2D6A4F",
  terraLight: "#E8A88A",
  white: "#FFFFFF",
};

const SCENE_PALETTES = {
  nursery: [BRAND.cream, BRAND.sageLight, BRAND.creamDark],
  bathroom: [BRAND.white, BRAND.sageLight, BRAND.cream],
  bedroom: [BRAND.creamDark, BRAND.terraLight, BRAND.cream],
  "wood-table": [BRAND.creamDark, BRAND.terraLight, BRAND.sageLight],
  "cotton-towel": [BRAND.white, BRAND.cream, BRAND.sageLight],
  "cream-studio": [BRAND.cream, BRAND.creamDark, BRAND.white],
  "pastel-studio": [BRAND.sageLight, BRAND.cream, BRAND.sage],
  "gift-composition": [BRAND.cream, BRAND.terraLight, BRAND.creamDark],
  "floating-botanical": [BRAND.cream, BRAND.sageLight, BRAND.sage],
  "morning-window": [BRAND.cream, BRAND.terraLight, BRAND.sageLight],
};

function svgScene(w, h, colors, variant) {
  const [c0, c1, c2] = colors;
  const blobs = Array.from({ length: 4 + (variant % 3) }, (_, i) => {
    const cx = (w * (0.2 + (i * 0.18 + variant * 0.07) % 0.7)).toFixed(0);
    const cy = (h * (0.25 + (i * 0.13 + variant * 0.11) % 0.6)).toFixed(0);
    const rx = (w * (0.15 + (i % 3) * 0.06)).toFixed(0);
    const ry = (h * (0.12 + (i % 2) * 0.05)).toFixed(0);
    const col = i % 2 === 0 ? c1 : c2;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${col}" opacity="0.35"/>`;
  }).join("");

  const surface =
    variant % 2 === 0
      ? `<rect x="${(w * 0.12).toFixed(0)}" y="${(h * 0.55).toFixed(0)}" width="${(w * 0.76).toFixed(0)}" height="${(h * 0.28).toFixed(0)}" rx="18" fill="${c2}" opacity="0.18"/>`
      : `<ellipse cx="${(w * 0.5).toFixed(0)}" cy="${(h * 0.62).toFixed(0)}" rx="${(w * 0.34).toFixed(0)}" ry="${(h * 0.12).toFixed(0)}" fill="${c2}" opacity="0.2"/>`;

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c0}"/>
        <stop offset="55%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
      <radialGradient id="light" cx="75%" cy="15%" r="55%">
        <stop offset="0%" stop-color="${BRAND.white}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="${BRAND.white}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect width="100%" height="100%" fill="url(#light)"/>
    ${blobs}
    ${surface}
  </svg>`;
}

export async function generateProceduralScene(slug, w, h) {
  const colors = SCENE_PALETTES[slug] ?? SCENE_PALETTES["cream-studio"];
  const svg = svgScene(w, h, colors, slug.length);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  const softened = await sharp(png).blur(0.3).sharpen({ sigma: 0.3 }).png().toBuffer();
  return { buffer: softened, durationMs: 50, procedural: true };
}
