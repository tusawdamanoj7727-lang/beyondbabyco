/** Product asset optimization, storage, scoring, and media registration. */

import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

import { loadEnvFile } from "../env-config.mjs";
import { PHASE } from "./product-asset-catalog.mjs";

export const BUCKET = "products";
export const RESPONSIVE_WIDTHS = [480, 768, 1024, 1536];

export const PLACEHOLDER_PATTERNS = [
  "product-botanical.svg",
  "/images/brand/",
  "placeholder",
  "unsplash.com",
  "placehold",
  "via.placeholder",
];

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

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isDraftOrPlaceholder(url) {
  if (!url?.trim()) return true;
  const lower = url.toLowerCase();
  if (PLACEHOLDER_PATTERNS.some((p) => lower.includes(p))) return true;
  if (lower.endsWith(".svg")) return true;
  return false;
}

export function isApprovedProductUrl(url) {
  if (isDraftOrPlaceholder(url)) return false;
  if (url.includes(PHASE) && url.includes("/generated/")) return false;
  return true;
}

export async function scoreProductImage(buffer, meta = {}) {
  const stats = await sharp(buffer).stats();
  const brightness = stats.channels.reduce((s, c) => s + c.mean, 0) / stats.channels.length;
  const contrast = stats.channels.reduce((s, c) => s + c.stdev, 0) / stats.channels.length;
  const sharpness = contrast * 1.4;
  const w = meta.width ?? (await sharp(buffer).metadata()).width ?? 0;
  const h = meta.height ?? (await sharp(buffer).metadata()).height ?? 0;

  let score = 42 - Math.abs(brightness - 168) * 0.2;
  score += Math.min(contrast * 1.5, 28);
  score += Math.min(sharpness, 22);
  score += Math.min((w * h) / 45000, 18);
  score += meta.packagingBoost ?? 0;
  score += meta.emotionBoost ?? 0;
  score += meta.naturalBoost ?? 4;

  return Math.round(score * 10) / 10;
}

export async function optimizeProductPng(pngBuffer, slug, opts = {}) {
  let source = pngBuffer;
  const { targetWidth, targetHeight } = opts;
  if (targetWidth && targetHeight) {
    source = await sharp(pngBuffer)
      .resize(targetWidth, targetHeight, { fit: "fill", kernel: sharp.kernel.lanczos3 })
      .png()
      .toBuffer();
  }

  const meta = await sharp(source).metadata();
  const mainWebp = await sharp(source).webp({ quality: 88, effort: 4 }).toBuffer();
  let avifBuf = null;
  try {
    avifBuf = await sharp(source).avif({ quality: 65, effort: 4 }).toBuffer();
  } catch {
    avifBuf = null;
  }

  const responsive = {};
  for (const width of RESPONSIVE_WIDTHS) {
    if ((meta.width ?? 0) >= width * 0.85) {
      responsive[width] = await sharp(mainWebp)
        .resize(width, null, { withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    }
  }

  const thumbBuf = await sharp(mainWebp).resize(480, null, { withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const blurBuf = await sharp(mainWebp).resize(16, null, { withoutEnlargement: true }).webp({ quality: 50 }).toBuffer();
  const blurDataUrl = `data:image/webp;base64,${blurBuf.toString("base64")}`;
  const mainMeta = await sharp(mainWebp).metadata();

  return {
    mainWebp,
    avifBuf,
    responsive,
    thumbBuf,
    blurDataUrl,
    width: mainMeta.width ?? meta.width,
    height: mainMeta.height ?? meta.height,
    sizeBytes: mainWebp.length,
    thumbSizeBytes: thumbBuf.length,
    avifSizeBytes: avifBuf?.length ?? 0,
  };
}

export function localPaths(root, productSlug, group, slug) {
  const base = join(root, "public", "images", "products", PHASE, productSlug, group);
  return {
    dir: base,
    main: join(base, `${slug}.webp`),
    avif: join(base, `${slug}.avif`),
    thumb: join(base, "thumbs", `${slug}-480.webp`),
    blur: join(base, "blurs", `${slug}.blur.txt`),
    publicMain: `/images/products/${PHASE}/${productSlug}/${group}/${slug}.webp`,
    publicAvif: `/images/products/${PHASE}/${productSlug}/${group}/${slug}.avif`,
    publicThumb: `/images/products/${PHASE}/${productSlug}/${group}/thumbs/${slug}-480.webp`,
  };
}

export function storagePath(productId, group, slug, ext = "webp") {
  return `${productId}/${PHASE}/${group}/${slug}.${ext}`;
}

export function saveLocalOptimized(root, productSlug, group, slug, optimized) {
  const paths = localPaths(root, productSlug, group, slug);
  mkdirSync(join(paths.dir, "thumbs"), { recursive: true });
  mkdirSync(join(paths.dir, "blurs"), { recursive: true });
  mkdirSync(join(paths.dir, "responsive"), { recursive: true });

  writeFileSync(paths.main, optimized.mainWebp);
  if (optimized.avifBuf) writeFileSync(paths.avif, optimized.avifBuf);
  writeFileSync(paths.thumb, optimized.thumbBuf);
  writeFileSync(paths.blur, optimized.blurDataUrl, "utf8");

  for (const [width, buf] of Object.entries(optimized.responsive)) {
    writeFileSync(join(paths.dir, "responsive", `${slug}-${width}.webp`), buf);
  }

  return paths;
}

export async function uploadProductAsset(supabase, productId, group, slug, optimized) {
  const mainPath = storagePath(productId, group, slug, "webp");
  await supabase.storage.from(BUCKET).upload(mainPath, optimized.mainWebp, {
    contentType: "image/webp",
    upsert: true,
  });

  if (optimized.avifBuf) {
    await supabase.storage.from(BUCKET).upload(storagePath(productId, group, slug, "avif"), optimized.avifBuf, {
      contentType: "image/avif",
      upsert: true,
    });
  }

  await supabase.storage.from(BUCKET).upload(
    `${productId}/${PHASE}/${group}/thumbs/${slug}-480.webp`,
    optimized.thumbBuf,
    { contentType: "image/webp", upsert: true },
  );

  for (const [width, buf] of Object.entries(optimized.responsive)) {
    await supabase.storage.from(BUCKET).upload(
      `${productId}/${PHASE}/${group}/responsive/${slug}-${width}.webp`,
      buf,
      { contentType: "image/webp", upsert: true },
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(mainPath);
  return { url: data.publicUrl, path: mainPath };
}

export async function ensureProductsBucket(supabase) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.id === BUCKET || b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 25 * 1024 * 1024 });
  }
}

export async function ensureMediaFolder(supabase, { name, slug, pathPrefix, parentId = null }) {
  try {
    const { data: bySlug } = await supabase.from("media_folders").select("id").eq("slug", slug).maybeSingle();
    if (bySlug?.id) return bySlug.id;
  } catch {
    /* slug column may not exist on older schemas */
  }

  try {
    const { data: byName } = await supabase.from("media_folders").select("id").eq("name", name).maybeSingle();
    if (byName?.id) return byName.id;
  } catch {
    /* ignore */
  }

  const attempts = [
    { name, slug, bucket: BUCKET, path_prefix: pathPrefix, icon: "products", is_system: false, parent_id: parentId },
    { name, slug, path_prefix: pathPrefix, parent_id: parentId },
    { name, slug, parent_id: parentId },
    { name, parent_id: parentId },
    { name },
  ];

  for (const row of attempts) {
    const { data: inserted, error } = await supabase.from("media_folders").insert(row).select("id").single();
    if (!error && inserted?.id) return inserted.id;
    if (error && !/could not find|column .* does not exist/i.test(error.message)) {
      throw new Error(error.message);
    }
  }

  return null;
}

export async function registerProductMedia(supabase, folderId, record) {
  const row = {
    folder_id: folderId,
    bucket: BUCKET,
    path: record.path,
    url: record.url,
    mime_type: record.mimeType ?? "image/webp",
    size_bytes: record.sizeBytes ?? null,
    original_name: record.originalName,
    alt: record.alt ?? null,
    width: record.width ?? null,
    height: record.height ?? null,
    blur_data_url: record.blurDataUrl ?? null,
  };

  const { data: existing } = await supabase
    .from("media_library")
    .select("id")
    .eq("bucket", BUCKET)
    .eq("path", record.path)
    .maybeSingle();

  if (existing?.id) {
    const { blur_data_url, ...safeRow } = row;
    try {
      await supabase.from("media_library").update(row).eq("id", existing.id);
    } catch {
      await supabase.from("media_library").update(safeRow).eq("id", existing.id);
    }
    return existing.id;
  }

  try {
    const { data: inserted } = await supabase.from("media_library").insert(row).select("id").single();
    return inserted?.id;
  } catch {
    const { blur_data_url, ...safeRow } = row;
    const { data: inserted } = await supabase.from("media_library").insert(safeRow).select("id").single();
    return inserted?.id;
  }
}

export async function discoverProducts(supabase) {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,slug,short_description,status,category_id")
    .order("name");

  if (error) throw new Error(error.message);
  if (!data?.length) return [];

  const categoryIds = [...new Set(data.map((p) => p.category_id).filter(Boolean))];
  let categoryMap = new Map();
  if (categoryIds.length) {
    const { data: cats } = await supabase.from("categories").select("id,name").in("id", categoryIds);
    categoryMap = new Map((cats ?? []).map((c) => [c.id, c.name]));
  }

  return data.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.short_description,
    status: p.status,
    categoryName: p.category_id ? categoryMap.get(p.category_id) ?? null : null,
  }));
}
