/** Shared utilities for homepage asset pipelines (Phase 8.1 + 8.2). */

import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

import { loadEnvFile } from "../env-config.mjs";

export const BUCKET = "homepage";
export const PHASE = "phase-8-2";
export const PUBLIC_ROOT = `/images/homepage/${PHASE}`;
export const STORAGE_ROOT = `${PHASE}`;

export const PLACEHOLDER_PATTERNS = [
  "lifestyle-family.svg",
  "science-care.svg",
  "product-botanical.svg",
  "forest-canopy.svg",
  "/images/brand/",
  "placeholder",
  "unsplash.com",
  "placehold",
  "via.placeholder",
];

const BRAND_PROMPT =
  "Luxury baby care brand BeyondBabyCo, Indian family context, editorial photography, warm morning sunlight, pastel cream sage warm beige palette, soft natural tones, premium skincare mood, shallow depth of field, no text, no watermark, no logos, commercial quality";

export function brandPrompt(scene) {
  return `${BRAND_PROMPT}, ${scene}`;
}

export function loadSupabase(root) {
  const env = loadEnvFile(join(root, ".env.local"), readFileSync, existsSync);
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    throw new Error("Supabase env vars required in .env.local");
  }
  return {
    env,
    supabase: createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY.trim(), {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
  };
}

export function isDraftOrPlaceholder(url) {
  if (!url?.trim()) return true;
  const lower = url.toLowerCase();
  if (PLACEHOLDER_PATTERNS.some((p) => lower.includes(p))) return true;
  if (lower.endsWith(".svg") && lower.includes("/images/brand/")) return true;
  return false;
}

export function isApprovedUrl(url) {
  return !isDraftOrPlaceholder(url);
}

export function publicPath(section, slug) {
  return `${PUBLIC_ROOT}/${section}/${slug}.webp`;
}

export function storagePath(section, slug) {
  return `${STORAGE_ROOT}/${section}/${slug}.webp`;
}

export function thumbPublicPath(section, slug) {
  return `${PUBLIC_ROOT}/${section}/thumbs/${slug}-480.webp`;
}

export function thumbStoragePath(section, slug) {
  return `${STORAGE_ROOT}/${section}/thumbs/${slug}-480.webp`;
}

export async function scoreImage(buffer, meta = {}) {
  const stats = await sharp(buffer).stats();
  const brightness = stats.channels.reduce((s, c) => s + c.mean, 0) / stats.channels.length;
  const contrast = stats.channels.reduce((s, c) => s + c.stdev, 0) / stats.channels.length;
  const w = meta.width ?? (await sharp(buffer).metadata()).width ?? 0;
  const h = meta.height ?? (await sharp(buffer).metadata()).height ?? 0;
  let score = 40 - Math.abs(brightness - 165) * 0.25;
  score += Math.min(contrast * 1.8, 35);
  score += Math.min((w * h) / 40000, 25);
  score += Math.min(buffer.length / 8000, 15);
  if (meta.emotionBoost) score += meta.emotionBoost;
  return Math.round(score * 10) / 10;
}

export async function optimizePngToWebp(pngPath) {
  const input = sharp(pngPath);
  const meta = await input.metadata();
  const mainBuf = await input.clone().webp({ quality: 88, effort: 4 }).toBuffer();
  let avifBuf = null;
  try {
    avifBuf = await input.clone().avif({ quality: 65, effort: 4 }).toBuffer();
  } catch {
    avifBuf = null;
  }
  const thumbBuf = await sharp(mainBuf).resize(480, null, { withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const blurBuf = await sharp(mainBuf).resize(16, null, { withoutEnlargement: true }).webp({ quality: 50 }).toBuffer();
  const blurDataUrl = `data:image/webp;base64,${blurBuf.toString("base64")}`;
  const mainMeta = await sharp(mainBuf).metadata();
  const thumbMeta = await sharp(thumbBuf).metadata();
  return {
    mainBuf,
    avifBuf,
    thumbBuf,
    width: mainMeta.width ?? meta.width,
    height: mainMeta.height ?? meta.height,
    thumbWidth: thumbMeta.width,
    thumbHeight: thumbMeta.height,
    blurDataUrl,
    sizeBytes: mainBuf.length,
    thumbSizeBytes: thumbBuf.length,
    avifSizeBytes: avifBuf?.length ?? 0,
  };
}

export function saveLocal(root, section, slug, optimized) {
  const dir = join(root, "public", "images", "homepage", PHASE, section);
  const thumbDir = join(dir, "thumbs");
  const blurDir = join(dir, "blurs");
  mkdirSync(thumbDir, { recursive: true });
  mkdirSync(blurDir, { recursive: true });
  const mainRel = publicPath(section, slug);
  const thumbRel = thumbPublicPath(section, slug);
  writeFileSync(join(root, "public", mainRel), optimized.mainBuf);
  if (optimized.avifBuf) {
    writeFileSync(join(root, "public", mainRel.replace(/\.webp$/, ".avif")), optimized.avifBuf);
  }
  writeFileSync(join(root, "public", thumbRel), optimized.thumbBuf);
  writeFileSync(join(blurDir, `${slug}.blur.txt`), optimized.blurDataUrl, "utf8");
  return { mainRel, thumbRel };
}

export async function uploadAsset(supabase, section, slug, optimized) {
  const mainPath = storagePath(section, slug);
  const thumbPath = thumbStoragePath(section, slug);
  await supabase.storage.from(BUCKET).upload(mainPath, optimized.mainBuf, {
    contentType: "image/webp",
    upsert: true,
  });
  await supabase.storage.from(BUCKET).upload(thumbPath, optimized.thumbBuf, {
    contentType: "image/webp",
    upsert: true,
  });
  const { data: mainPub } = supabase.storage.from(BUCKET).getPublicUrl(mainPath);
  const { data: thumbPub } = supabase.storage.from(BUCKET).getPublicUrl(thumbPath);
  return { url: mainPub.publicUrl, thumbUrl: thumbPub.publicUrl, mainPath, thumbPath };
}

export async function registerMedia(supabase, folderId, record) {
  const row = {
    folder_id: folderId,
    bucket: BUCKET,
    path: record.path,
    url: record.url,
    mime_type: record.mimeType ?? "image/webp",
    size_bytes: record.sizeBytes ?? null,
    original_name: record.originalName,
    alt: record.alt ?? null,
  };
  const { data: existing } = await supabase
    .from("media_library")
    .select("id")
    .eq("bucket", BUCKET)
    .eq("path", record.path)
    .maybeSingle();
  if (existing?.id) {
    await supabase.from("media_library").update(row).eq("id", existing.id);
    return existing.id;
  }
  const { data: inserted } = await supabase.from("media_library").insert(row).select("id").single();
  return inserted?.id;
}

export async function ensureBucket(supabase) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.id === BUCKET || b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 20 * 1024 * 1024 });
  }
}

export async function ensureMediaFolder(supabase, name, pathPrefix) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const { data: existing } = await supabase.from("media_folders").select("id").eq("slug", slug).maybeSingle();
  if (existing?.id) return existing.id;
  const { data: inserted } = await supabase
    .from("media_folders")
    .insert({
      name,
      slug,
      bucket: BUCKET,
      path_prefix: pathPrefix,
      icon: "homepage",
      is_system: false,
    })
    .select("id")
    .single();
  return inserted?.id ?? null;
}

export async function generateViaComfy(appUrl, { prompt, width, height, seed, outputPath }) {
  const res = await fetch(`${appUrl}/api/dev/generate-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      negativePrompt:
        "text, watermark, logo, typography, letters, deformed hands, cartoon, low quality, blurry",
      width,
      height,
      seed,
      category: "lifestyle",
      outputPath,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error ?? res.statusText);
  return data.data.result;
}

export function saveSvg(root, section, slug, svg) {
  const dir = join(root, "public", "images", "homepage", PHASE, section);
  mkdirSync(dir, { recursive: true });
  const rel = `${PUBLIC_ROOT}/${section}/${slug}.svg`;
  writeFileSync(join(root, "public", rel), svg, "utf8");
  return rel;
}

export async function svgToWebp(root, section, slug) {
  const svgPath = join(root, "public", "images", "homepage", PHASE, section, `${slug}.svg`);
  const buf = await sharp(svgPath).webp({ quality: 90 }).toBuffer();
  const optimized = {
    mainBuf: buf,
    thumbBuf: await sharp(buf).resize(480, null, { withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
    blurDataUrl: `data:image/webp;base64,${(await sharp(buf).resize(16).webp({ quality: 50 }).toBuffer()).toString("base64")}`,
    sizeBytes: buf.length,
    thumbSizeBytes: 0,
    width: (await sharp(buf).metadata()).width,
    height: (await sharp(buf).metadata()).height,
    thumbWidth: 480,
    thumbHeight: null,
  };
  optimized.thumbSizeBytes = optimized.thumbBuf.length;
  optimized.thumbHeight = (await sharp(optimized.thumbBuf).metadata()).height;
  return optimized;
}
