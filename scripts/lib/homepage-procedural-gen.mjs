/** Premium procedural asset generator — brand-consistent compositions via sharp + SVG. */

import { createHash } from "node:crypto";
import sharp from "sharp";

const BRAND = {
  cream: "#FDF8F3",
  creamDark: "#E8DDD4",
  sage: "#8BA888",
  sageLight: "#B8CEB5",
  green: "#1B4332",
  greenMid: "#2D6A4F",
  terra: "#CD6A45",
  terraLight: "#E8A88A",
  white: "#FFFFFF",
};

const PALETTES = {
  illustration: [
    [BRAND.cream, BRAND.sageLight, BRAND.sage],
    [BRAND.creamDark, BRAND.sage, BRAND.greenMid],
    [BRAND.cream, BRAND.terraLight, BRAND.sageLight],
  ],
  lifestyle: [
    [BRAND.cream, BRAND.terraLight, BRAND.creamDark],
    [BRAND.cream, BRAND.sageLight, BRAND.terraLight],
    [BRAND.creamDark, BRAND.cream, BRAND.sageLight],
  ],
  science: [
    [BRAND.white, BRAND.sageLight, BRAND.sage],
    [BRAND.cream, BRAND.sage, BRAND.greenMid],
    [BRAND.sageLight, BRAND.white, BRAND.sage],
  ],
  background: [
    [BRAND.cream, BRAND.sageLight, BRAND.creamDark],
    [BRAND.creamDark, BRAND.cream, BRAND.sageLight],
    [BRAND.cream, BRAND.white, BRAND.sageLight],
  ],
  portrait: [
    [BRAND.terraLight, BRAND.cream, BRAND.sageLight],
    [BRAND.sageLight, BRAND.cream, BRAND.terraLight],
    [BRAND.cream, BRAND.terraLight, BRAND.sage],
  ],
  category: [
    [BRAND.sageLight, BRAND.cream, BRAND.greenMid],
    [BRAND.terraLight, BRAND.cream, BRAND.sage],
    [BRAND.cream, BRAND.sage, BRAND.terraLight],
  ],
  newsletter: [
    [BRAND.greenMid, BRAND.sage, BRAND.cream],
    [BRAND.green, BRAND.sage, BRAND.cream],
  ],
  research: [
    [BRAND.sageLight, BRAND.cream, BRAND.sage],
    [BRAND.cream, BRAND.sageLight, BRAND.greenMid],
  ],
  decoration: [
    [BRAND.cream, BRAND.sageLight],
    [BRAND.creamDark, BRAND.sageLight],
  ],
};

function hashSeed(slug, variant) {
  const h = createHash("sha256").update(`${slug}:${variant}`).digest();
  return h.readUInt32BE(0);
}

function pickPalette(type, seed) {
  const list = PALETTES[type] ?? PALETTES.illustration;
  return list[seed % list.length];
}

function organicBlob(cx, cy, rx, ry, rot, opacity, color) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${color}" opacity="${opacity}" transform="rotate(${rot} ${cx} ${cy})"/>`;
}

function leafPath(x, y, scale, rot, color, opacity = 0.35) {
  const s = scale;
  return `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})" opacity="${opacity}">
    <path d="M0 0 C 8 -14, 22 -10, 18 2 C 12 12, 0 16, 0 16 C 0 16, -12 12, -18 2 C -22 -10, -8 -14, 0 0 Z" fill="${color}"/>
  </g>`;
}

function star(cx, cy, r, color, opacity = 0.5) {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * (Math.PI / 180);
    const b = ((i * 72 + 36) - 90) * (Math.PI / 180);
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    pts.push(`${cx + r * 0.4 * Math.cos(b)},${cy + r * 0.4 * Math.sin(b)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${color}" opacity="${opacity}"/>`;
}

function glassPanel(w, h, x, y, opacity = 0.22) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="white" opacity="${opacity}" stroke="white" stroke-opacity="0.35" stroke-width="1.5"/>`;
}

function buildSceneSvg({ width, height, palette, seed, style, label }) {
  const [c0, c1, c2] = palette;
  const blobs = [];
  const decor = [];
  const rng = seed;

  for (let i = 0; i < 5; i++) {
    const cx = ((rng * (i + 3) * 17) % 80) + 10;
    const cy = ((rng * (i + 7) * 13) % 80) + 10;
    blobs.push(
      organicBlob(
        (cx / 100) * width,
        (cy / 100) * height,
        width * (0.15 + (i % 3) * 0.08),
        height * (0.12 + (i % 2) * 0.06),
        (rng + i * 23) % 360,
        0.18 + (i % 3) * 0.06,
        i % 2 === 0 ? c1 : c2,
      ),
    );
  }

  for (let i = 0; i < 6; i++) {
    decor.push(
      leafPath(
        ((rng * (i + 11) * 19) % 85) / 100 * width,
        ((rng * (i + 5) * 29) % 85) / 100 * height,
        0.8 + (i % 3) * 0.4,
        (rng + i * 41) % 360,
        BRAND.greenMid,
        0.2 + (i % 2) * 0.1,
      ),
    );
  }

  if (style === "science") {
    decor.push(glassPanel(width * 0.55, height * 0.35, width * 0.08, height * 0.12, 0.28));
    decor.push(glassPanel(width * 0.25, height * 0.55, width * 0.55, height * 0.25, 0.18));
  } else if (style === "lifestyle" || style === "portrait") {
    decor.push(
      organicBlob(width * 0.5, height * 0.45, width * 0.28, height * 0.32, 0, 0.25, c2),
    );
    decor.push(glassPanel(width * 0.15, height * 0.2, width * 0.55, height * 0.35, 0.2));
  } else if (style === "category") {
    decor.push(
      `<circle cx="${width * 0.5}" cy="${height * 0.42}" r="${Math.min(width, height) * 0.22}" fill="${c2}" opacity="0.3"/>`,
    );
  }

  for (let i = 0; i < 4; i++) {
    decor.push(
      star(
        ((rng * (i + 2) * 31) % 90) / 100 * width,
        ((rng * (i + 9) * 37) % 90) / 100 * height,
        6 + (i % 3) * 4,
        BRAND.terra,
        0.35,
      ),
    );
  }

  const vignette = `<radialGradient id="vig" cx="50%" cy="45%" r="70%">
    <stop offset="0%" stop-color="white" stop-opacity="0"/>
    <stop offset="100%" stop-color="${BRAND.green}" stop-opacity="0.08"/>
  </radialGradient>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c0}"/>
        <stop offset="55%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
      ${vignette}
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    ${blobs.join("\n")}
    <rect width="100%" height="100%" fill="url(#vig)"/>
    ${decor.join("\n")}
    ${label ? `<text x="${width * 0.06}" y="${height * 0.94}" font-family="Georgia, serif" font-size="${Math.round(width * 0.028)}" fill="${BRAND.green}" opacity="0.12">${label}</text>` : ""}
  </svg>`;
}

export async function generateCandidate({ slug, style, width, height, variant, emotionBoost = 0 }) {
  const seed = hashSeed(slug, variant);
  const palette = pickPalette(style, seed + variant);
  const svg = buildSceneSvg({
    width,
    height,
    palette,
    seed,
    style,
    label: "",
  });
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  const stats = await sharp(buffer).stats();
  const brightness = stats.channels.reduce((s, c) => s + c.mean, 0) / stats.channels.length;
  const contrast = stats.channels.reduce((s, c) => s + c.stdev, 0) / stats.channels.length;
  let score = 45 - Math.abs(brightness - 175) * 0.22;
  score += Math.min(contrast * 1.6, 30);
  score += Math.min((width * height) / 50000, 20);
  score += emotionBoost;
  score += variant === 0 ? 2 : 0;
  return { buffer, score: Math.round(score * 10) / 10, variant, seed };
}

export async function generateBestAsset(spec) {
  const candidates = await Promise.all([
    generateCandidate({ ...spec, variant: 0 }),
    generateCandidate({ ...spec, variant: 1 }),
  ]);
  candidates.sort((a, b) => b.score - a.score);
  return { ...candidates[0], discarded: candidates.slice(1) };
}

export function trustBadgeSvg(label) {
  const short = label.length > 22 ? label.slice(0, 20) + "…" : label;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${BRAND.cream}"/>
        <stop offset="100%" stop-color="${BRAND.sageLight}"/>
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="92" fill="url(#g)" stroke="${BRAND.greenMid}" stroke-width="3"/>
    <circle cx="100" cy="100" r="72" fill="none" stroke="${BRAND.terra}" stroke-width="2" opacity="0.5"/>
    <path d="M100 38 L118 78 L162 82 L128 110 L138 154 L100 130 L62 154 L72 110 L38 82 L82 78 Z" fill="${BRAND.greenMid}" opacity="0.85"/>
    <text x="100" y="178" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="${BRAND.green}">${short}</text>
  </svg>`;
}

export function emptyStateSvg(kind) {
  const titles = {
    testimonials: "No testimonials yet",
    products: "No products yet",
    categories: "No categories yet",
    newsletter: "Newsletter coming soon",
    reviews: "No reviews yet",
    research: "Research updates soon",
  };
  const title = titles[kind] ?? "Nothing here yet";
  const bunny =
    kind === "testimonials" || kind === "products" || kind === "research"
      ? `<ellipse cx="100" cy="118" rx="38" ry="34" fill="${BRAND.creamDark}"/>
         <ellipse cx="72" cy="72" rx="14" ry="28" fill="${BRAND.creamDark}" transform="rotate(-18 72 72)"/>
         <ellipse cx="128" cy="72" rx="14" ry="28" fill="${BRAND.creamDark}" transform="rotate(18 128 72)"/>`
      : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
    <rect width="320" height="240" rx="24" fill="${BRAND.cream}"/>
    ${bunny}
    <text x="160" y="200" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="${BRAND.green}">${title}</text>
  </svg>`;
}

export function decorationSvg(kind, seed = 0) {
  const w = 400;
  const h = 300;
  const palette = pickPalette("decoration", seed);
  if (kind === "leaf") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <rect width="100%" height="100%" fill="none"/>
      ${leafPath(w * 0.5, h * 0.5, 3, seed % 360, palette[1], 0.6)}
    </svg>`;
  }
  if (kind === "cloud") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <ellipse cx="200" cy="160" rx="120" ry="50" fill="${palette[0]}" opacity="0.7"/>
      <ellipse cx="140" cy="170" rx="70" ry="40" fill="${palette[0]}" opacity="0.8"/>
      <ellipse cx="260" cy="165" rx="80" ry="45" fill="${palette[0]}" opacity="0.75"/>
    </svg>`;
  }
  if (kind === "flower") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="200" cy="120" rx="22" ry="40" fill="${BRAND.terraLight}" opacity="0.55" transform="rotate(${a} 200 150)"/>`).join("")}
      <circle cx="200" cy="150" r="18" fill="${BRAND.terra}" opacity="0.7"/>
    </svg>`;
  }
  if (kind === "star") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${star(200, 150, 40, BRAND.terra, 0.8)}</svg>`;
  }
  if (kind === "blob") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      ${organicBlob(200, 150, 140, 100, seed % 30, 0.45, palette[1])}
    </svg>`;
  }
  return buildSceneSvg({ width: w, height: h, palette, seed, style: "background", label: "" });
}

export const CATEGORY_SLUGS = [
  { slug: "baby-wipes", name: "Baby Wipes" },
  { slug: "baby-wash", name: "Baby Wash" },
  { slug: "baby-lotion", name: "Baby Lotion" },
  { slug: "baby-oil", name: "Baby Oil" },
  { slug: "baby-powder", name: "Baby Powder" },
  { slug: "gift-sets", name: "Gift Sets" },
  { slug: "newborn-essentials", name: "Newborn Essentials" },
  { slug: "organic-care", name: "Organic Care" },
  { slug: "sleep-care", name: "Sleep Care" },
  { slug: "bath-time", name: "Bath Time" },
];

export const TRUST_BADGES = [
  "Dermatologically Tested",
  "Clinically Tested",
  "Made in India",
  "Natural Ingredients",
  "Cruelty Free",
  "Paraben Free",
  "Sulfate Free",
  "Pediatrician Recommended",
  "ISO Quality",
  "GMP Manufacturing",
];

export const RESEARCH_STEPS = [
  "Research",
  "Formulation",
  "Testing",
  "Certification",
  "Production",
  "Packaging",
  "Quality Control",
  "Laboratory",
  "Natural Ingredients",
  "Clinical Review",
];

export const SCIENCE_SCENES = [
  "modern dermatology laboratory with soft natural light",
  "pediatric dermatologist consultation with Indian mother and baby",
  "ingredient testing with botanical extracts on clean lab bench",
  "research scientist reviewing baby skincare formulation",
  "pediatric care research team in premium clinic",
  "clinical testing documentation for baby lotion safety",
  "product testing on sensitive skin models in lab",
  "safety verification with quality instruments",
  "microscope analysis of natural baby care ingredients",
  "formulation team in white coats with green plants",
  "clean room packaging quality check",
  "allergy patch testing setup for baby products",
  "pH testing of gentle baby wash",
  "stability testing chamber with soft lighting",
  "research notes and natural ingredient samples",
  "lab technician holding hypoallergenic formula",
  "clinical review board meeting warm tones",
  "ingredient sourcing from organic farms",
  "safety certification documents on cream desk",
  "premium research facility corridor soft sage tones",
];

export const LIFESTYLE_SCENES = [
  "Indian mother gently applying baby lotion after bath",
  "happy baby wrapped in soft towel after bath time",
  "family bonding moment with newborn in nursery",
  "bedtime care routine with warm lamp light",
  "outdoor family walk with stroller in morning sun",
  "serene nursery room with cream and sage decor",
  "morning routine mother and baby smiling",
  "happy baby playing on cream blanket",
  "father holding newborn close to chest",
  "mother reading to baby in rocking chair",
  "baby massage with natural oil soft lighting",
  "family picnic with baby in pastel tones",
  "gentle diaper change moment caring hands",
  "baby splashing in small bath with smiles",
  "parents watching baby sleep peacefully",
  "toddler exploring soft toys in nursery",
  "mother carrying baby in woven sling sunlight",
  "grandmother helping with baby care warm scene",
  "siblings meeting new baby tender moment",
  "cozy evening cuddle with blanket cream tones",
];

export const TESTIMONIAL_THEMES = [
  "happy Indian mother portrait soft studio light",
  "mother holding baby warm smile natural",
  "father with newborn proud gentle expression",
  "doctor consultation friendly pediatrician",
  "family moment three generations soft cream background",
  "nursery portrait mother and baby",
  "natural smile young parent portrait",
  "couple with newborn happiness",
  "working mother testimonial warm tones",
  "grandmother with grandchild portrait",
  "first-time parent relief and joy",
  "urban family portrait soft sage backdrop",
  "parent holding product satisfied expression",
  "nighttime care grateful parent",
  "community parent meetup warm smiles",
];

export const BRAND_PROMISE_ILLUSTRATIONS = Array.from({ length: 12 }, (_, i) => ({
  slug: `illustration-${String(i + 1).padStart(2, "0")}`,
  theme: ["safe baby care", "parent trust", "natural ingredients", "gentle touch", "research backed", "dermatology tested", "love and care", "organic botanicals", "soft protection", "family wellness", "premium quality", "Indian heritage"][i],
}));

export const BRAND_PROMISE_LIFESTYLE = Array.from({ length: 12 }, (_, i) => ({
  slug: `lifestyle-${String(i + 1).padStart(2, "0")}`,
  theme: LIFESTYLE_SCENES[i],
}));

export const BRAND_PROMISE_BACKGROUNDS = Array.from({ length: 12 }, (_, i) => ({
  slug: `background-${String(i + 1).padStart(2, "0")}`,
  theme: `soft cream sage gradient composition ${i + 1} luxury baby brand`,
}));

export const DECORATION_KINDS = [
  "leaf",
  "cloud",
  "flower",
  "star",
  "blob",
  "gradient",
  "glass",
  "organic",
  "shadow",
  "botanical",
];

export const EMPTY_STATE_KINDS = [
  "testimonials",
  "products",
  "categories",
  "newsletter",
  "reviews",
  "research",
];

export const NEWSLETTER_ASSETS = [
  { slug: "newsletter-main", theme: "mother reading email on phone with baby smiling cream background" },
  { slug: "newsletter-baby", theme: "happy baby smiling gift box brand colors" },
  { slug: "newsletter-gift", theme: "premium gift box with ribbon sage and cream" },
];

export const CATEGORY_ASSET_TYPES = [
  { key: "hero-banner", w: 1920, h: 640, style: "category" },
  { key: "desktop-banner", w: 1440, h: 480, style: "category" },
  { key: "mobile-banner", w: 750, h: 900, style: "category" },
  { key: "category-card", w: 800, h: 600, style: "category" },
  { key: "category-thumbnail", w: 400, h: 400, style: "category" },
  { key: "transparent-illustration", w: 512, h: 512, style: "category" },
];
