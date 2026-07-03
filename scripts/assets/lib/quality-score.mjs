/** Phase 11.4B — Editorial quality scoring with hard reject gates. */

import sharp from "sharp";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG = JSON.parse(
  readFileSync(join(__dirname, "..", "data", "prompt-engineering-11-4b.json"), "utf8"),
);

export const QUALITY_THRESHOLD = CONFIG.generation.qualityThreshold;
const HARD = CONFIG.hardReject;

const BRAND_TARGETS = {
  cream: { r: 250, g: 247, b: 242 },
  sage: { r: 184, g: 206, b: 181 },
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function channelDistance(stats, target) {
  const r = stats.channels[0]?.mean ?? 128;
  const g = stats.channels[1]?.mean ?? 128;
  const b = stats.channels[2]?.mean ?? 128;
  return (Math.abs(r - target.r) + Math.abs(g - target.g) + Math.abs(b - target.b)) / 3;
}

async function gradientPenalty(buffer) {
  const meta = await sharp(buffer).metadata();
  const w = meta.width ?? 512;
  const h = meta.height ?? 512;
  const qw = Math.floor(w / 2);
  const qh = Math.floor(h / 2);
  const quadrants = await Promise.all(
    [
      { left: 0, top: 0, width: qw, height: qh },
      { left: qw, top: 0, width: w - qw, height: qh },
      { left: 0, top: qh, width: qw, height: h - qh },
      { left: qw, top: qh, width: w - qw, height: h - qh },
    ].map(async (region) => {
      const stats = await sharp(buffer).extract(region).stats();
      return stats.channels.reduce((s, c) => s + c.stdev, 0) / stats.channels.length;
    }),
  );
  const avg = quadrants.reduce((a, b) => a + b, 0) / quadrants.length;
  if (avg < 14) return 28;
  if (avg < 22) return 14;
  if (avg < 30) return 6;
  return 0;
}

function fileSizePenalty(buffer, pixels) {
  if (buffer.length < 120_000) return 45;
  if (buffer.length < 250_000) return 32;
  if (buffer.length < 450_000) return 18;
  if (pixels > 0 && buffer.length / pixels < 0.35) return 12;
  return 0;
}

/** Hard reject heuristics — immediate fail regardless of composite score. */
async function detectHardRejects(buffer, meta = {}) {
  const reasons = [];
  const stats = await sharp(buffer).stats();
  const channels = stats.channels;
  const brightness = channels.reduce((s, c) => s + c.mean, 0) / channels.length;
  const imgMeta = await sharp(buffer).metadata();
  const w = meta.width ?? imgMeta.width ?? 0;
  const h = meta.height ?? imgMeta.height ?? 0;
  const pixels = w * h;

  if (brightness < HARD.maxDarkBrightness) reasons.push("dark lighting");
  if (pixels > 0 && pixels < HARD.minResolutionPixels) reasons.push("low resolution");
  if (buffer.length < HARD.minPngBytes && !meta.procedural) reasons.push("low realism");

  const channelMeans = channels.slice(0, 3).map((c) => c.mean);
  const spread = Math.max(...channelMeans) - Math.min(...channelMeans);
  if (spread > HARD.maxSaturationSpread) reasons.push("oversaturated");

  const centerRegion = {
    left: Math.floor(w * 0.28),
    top: Math.floor(h * 0.18),
    width: Math.max(1, Math.floor(w * 0.44)),
    height: Math.max(1, Math.floor(h * 0.42)),
  };
  try {
    const centerStats = await sharp(buffer).extract(centerRegion).stats();
    const centerContrast =
      centerStats.channels.reduce((s, c) => s + c.stdev, 0) / centerStats.channels.length;
    if (centerContrast < HARD.minFaceRegionContrast) reasons.push("bad eyes");
    if (centerContrast > HARD.maxFaceRegionChaos) reasons.push("AI artifacts");
  } catch {
    reasons.push("AI artifacts");
  }

  if (meta.category === "products" || meta.template === "product") {
    try {
      const left = await sharp(buffer)
        .extract({ left: 0, top: Math.floor(h * 0.2), width: Math.floor(w / 2), height: Math.floor(h * 0.6) })
        .stats();
      const right = await sharp(buffer)
        .extract({
          left: Math.floor(w / 2),
          top: Math.floor(h * 0.2),
          width: Math.floor(w / 2),
          height: Math.floor(h * 0.6),
        })
        .stats();
      const lStd = left.channels.reduce((s, c) => s + c.stdev, 0);
      const rStd = right.channels.reduce((s, c) => s + c.stdev, 0);
      if (Math.abs(lStd - rStd) > 80) reasons.push("packaging distortion");
    } catch {
      /* optional */
    }
  }

  if (meta.procedural || (meta.webpBytes != null && meta.webpBytes < 18000)) {
    reasons.push("procedural placeholder");
  }

  return reasons;
}

export async function scoreEditorialImage(buffer, meta = {}) {
  const hardRejectReasons = await detectHardRejects(buffer, meta);
  const stats = await sharp(buffer).stats();
  const channels = stats.channels;
  const brightness = channels.reduce((s, c) => s + c.mean, 0) / channels.length;
  const contrast = channels.reduce((s, c) => s + c.stdev, 0) / channels.length;
  const imgMeta = await sharp(buffer).metadata();
  const w = meta.width ?? imgMeta.width ?? 0;
  const h = meta.height ?? imgMeta.height ?? 0;
  const pixels = w * h;

  const creamDist = channelDistance(stats, BRAND_TARGETS.cream);
  const sageDist = channelDistance(stats, BRAND_TARGETS.sage);
  const brandMatch = clamp(14 - Math.min(creamDist, sageDist) * 0.06, 0, 14);
  const lighting = clamp(18 - Math.abs(brightness - 172) * 0.12, 0, 18);
  const depth = clamp(Math.min(contrast * 1.1, 16), 0, 16);
  const composition = clamp(Math.min(pixels / 80000, 12), 0, 12);
  const sharpness = clamp(Math.min(contrast * 0.75, 12), 0, 12);

  const centerRegion = {
    left: Math.floor(w * 0.25),
    top: Math.floor(h * 0.2),
    width: Math.max(1, Math.floor(w * 0.5)),
    height: Math.max(1, Math.floor(h * 0.55)),
  };
  let faceProxy = 6;
  try {
    const centerStats = await sharp(buffer).extract(centerRegion).stats();
    const centerContrast =
      centerStats.channels.reduce((s, c) => s + c.stdev, 0) / centerStats.channels.length;
    faceProxy = clamp(Math.min(centerContrast * 0.95, 16), 4, 16);
  } catch {
    faceProxy = 5;
    hardRejectReasons.push("bad eyes");
  }

  const realism = clamp(8 + Math.min(buffer.length / 180000, 14), 0, 22);
  const gradPenalty = await gradientPenalty(buffer);
  const sizePenalty = fileSizePenalty(buffer, pixels);
  const procPenalty = (meta.procedural ? 40 : 0) + (meta.webpBytes != null && meta.webpBytes < 18000 ? 35 : 0);

  const raw =
    lighting + brandMatch + depth + composition + sharpness + faceProxy + realism - gradPenalty - sizePenalty - procPenalty;
  const total = clamp(Math.round(raw * 10) / 10, 0, 100);
  const passed = hardRejectReasons.length === 0 && total >= QUALITY_THRESHOLD;

  return {
    total,
    passed,
    hardRejectReasons,
    breakdown: {
      lighting: Math.round(lighting * 10) / 10,
      brandConsistency: Math.round(brandMatch * 10) / 10,
      depth,
      composition,
      sharpness: Math.round(sharpness * 10) / 10,
      faceQuality: Math.round(faceProxy * 10) / 10,
      realism: Math.round(realism * 10) / 10,
      gradientPenalty: gradPenalty,
      fileSizePenalty: sizePenalty,
      proceduralPenalty: procPenalty,
    },
  };
}
