/** Phase 11.3 — Brand-consistent procedural asset fallbacks (<100ms each). */

import sharp from "sharp";

const BRAND = {
  ivory: "#FFFDF8",
  cream: "#FEF9EB",
  warmWhite: "#FAF7F2",
  softSage: "#B8CEB5",
  mutedEucalyptus: "#8BA888",
  naturalWood: "#C4A882",
  cotton: "#F5F0E8",
  linen: "#EDE6DA",
  accentGreen: "#2D6A4F",
  accentTerra: "#CD6A45",
  white: "#FFFFFF",
};

const CATEGORY_PALETTES = {
  hero: [BRAND.ivory, BRAND.cream, BRAND.softSage],
  lifestyle: [BRAND.warmWhite, BRAND.linen, BRAND.mutedEucalyptus],
  research: [BRAND.cream, BRAND.white, BRAND.softSage],
  science: [BRAND.white, BRAND.softSage, BRAND.cream],
  products: [BRAND.white, BRAND.cream, BRAND.mutedEucalyptus],
  ingredients: [BRAND.cream, BRAND.accentGreen, BRAND.softSage],
  newsletter: [BRAND.ivory, BRAND.cream, BRAND.mutedEucalyptus],
  timeline: [BRAND.linen, BRAND.cream, BRAND.naturalWood],
  categories: [BRAND.cream, BRAND.softSage, BRAND.warmWhite],
  trust: [BRAND.white, BRAND.cream, BRAND.accentGreen],
  mascots: [BRAND.cream, BRAND.softSage, BRAND.accentTerra],
  backgrounds: [BRAND.ivory, BRAND.cream, BRAND.softSage],
  decorative: [BRAND.cream, BRAND.softSage, BRAND.linen],
  marketing: [BRAND.ivory, BRAND.mutedEucalyptus, BRAND.cream],
  social: [BRAND.cream, BRAND.accentTerra, BRAND.softSage],
  campaigns: [BRAND.warmWhite, BRAND.accentGreen, BRAND.cream],
  community: [BRAND.linen, BRAND.mutedEucalyptus, BRAND.cream],
  reviews: [BRAND.cream, BRAND.softSage, BRAND.warmWhite],
  "men-care": [BRAND.naturalWood, BRAND.cream, BRAND.mutedEucalyptus],
  "women-care": [BRAND.linen, BRAND.cream, BRAND.accentTerra],
  gift: [BRAND.cream, BRAND.accentTerra, BRAND.ivory],
};

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function svgEditorial(w, h, colors, seed, category) {
  const [c0, c1, c2] = colors;
  const variant = seed % 7;
  const blobs = Array.from({ length: 3 + (variant % 3) }, (_, i) => {
    const cx = (w * (0.15 + ((seed + i * 17) % 70) / 100)).toFixed(0);
    const cy = (h * (0.2 + ((seed + i * 23) % 65) / 100)).toFixed(0);
    const rx = (w * (0.12 + (i % 3) * 0.05)).toFixed(0);
    const ry = (h * (0.1 + (i % 2) * 0.04)).toFixed(0);
    const col = i % 2 === 0 ? c1 : c2;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${col}" opacity="0.32"/>`;
  }).join("");

  const productBlock =
    category === "products"
      ? `<rect x="${(w * 0.32).toFixed(0)}" y="${(h * 0.22).toFixed(0)}" width="${(w * 0.36).toFixed(0)}" height="${(h * 0.56).toFixed(0)}" rx="24" fill="${BRAND.white}" opacity="0.85"/>
         <rect x="${(w * 0.36).toFixed(0)}" y="${(h * 0.28).toFixed(0)}" width="${(w * 0.28).toFixed(0)}" height="${(h * 0.12).toFixed(0)}" rx="8" fill="${c2}" opacity="0.35"/>`
      : "";

  const botanical =
    category === "ingredients" || category === "decorative"
      ? `<circle cx="${(w * 0.72).toFixed(0)}" cy="${(h * 0.28).toFixed(0)}" r="${(w * 0.08).toFixed(0)}" fill="${BRAND.accentGreen}" opacity="0.2"/>
         <ellipse cx="${(w * 0.68).toFixed(0)}" cy="${(h * 0.35).toFixed(0)}" rx="${(w * 0.06).toFixed(0)}" ry="${(w * 0.03).toFixed(0)}" fill="${BRAND.mutedEucalyptus}" opacity="0.35"/>`
      : "";

  const surface = `<ellipse cx="${(w * 0.5).toFixed(0)}" cy="${(h * 0.68).toFixed(0)}" rx="${(w * 0.38).toFixed(0)}" ry="${(h * 0.1).toFixed(0)}" fill="${c2}" opacity="0.15"/>`;

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c0}"/>
        <stop offset="55%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
      <radialGradient id="light" cx="78%" cy="12%" r="50%">
        <stop offset="0%" stop-color="${BRAND.white}" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="${BRAND.white}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect width="100%" height="100%" fill="url(#light)"/>
    ${blobs}
    ${surface}
    ${botanical}
    ${productBlock}
  </svg>`;
}

export async function generateProceduralAsset(asset) {
  const w = asset.width;
  const h = asset.height;
  const seed = hashSeed(asset.id);
  const colors = CATEGORY_PALETTES[asset.category] ?? CATEGORY_PALETTES.backgrounds;
  const svg = svgEditorial(w, h, colors, seed, asset.category);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  const softened = await sharp(png).blur(0.3).sharpen({ sigma: 0.3 }).png().toBuffer();
  return { buffer: softened, durationMs: 50, procedural: true };
}
