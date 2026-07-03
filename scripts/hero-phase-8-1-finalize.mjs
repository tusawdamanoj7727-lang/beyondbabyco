#!/usr/bin/env node
/**
 * Phase 8.1 — Register existing hero WebP assets + assign top mother-baby to CMS hero.
 *
 * Reads optimized assets from public/images/hero/phase-8-1/
 * Does NOT overwrite an existing approved hero image.
 *
 * Usage:
 *   node scripts/hero-phase-8-1-finalize.mjs
 *   node scripts/hero-phase-8-1-finalize.mjs --assign-only
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import sharp from "sharp";

import {
  ALL_HERO_SLUGS,
  MOTHER_BABY_SLUGS,
  kindForSlug,
  publicWebpPath,
  supabaseStoragePath,
} from "./hero-asset-catalog.mjs";
import { loadEnvFile } from "./env-config.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const HERO_ROOT = join(ROOT, "public", "images", "hero", "phase-8-1");
const BUCKET = "homepage";
const MANIFEST = join(__dirname, "data", "hero-asset-manifest.json");

const PLACEHOLDER_PATTERNS = [
  "lifestyle-family.svg",
  "/images/brand/",
  "placeholder",
  "unsplash.com",
  "placehold",
];

const args = parseArgs({
  options: { "assign-only": { type: "boolean", default: false } },
});

function log(msg) {
  console.log(msg);
}

function die(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) die(".env.local missing");
  const env = loadEnvFile(envPath, readFileSync, existsSync);
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    die("Supabase env vars required");
  }
  return env;
}

function isApprovedHeroUrl(url) {
  if (!url?.trim()) return false;
  const lower = url.toLowerCase();
  if (PLACEHOLDER_PATTERNS.some((p) => lower.includes(p))) return false;
  if (lower.endsWith(".svg")) return false;
  return true;
}

async function scoreMotherBaby(buffer, meta) {
  const stats = await sharp(buffer).stats();
  const brightness = stats.channels.reduce((s, c) => s + c.mean, 0) / stats.channels.length;
  const contrast = stats.channels.reduce((s, c) => s + c.stdev, 0) / stats.channels.length;
  let score = 40 - Math.abs(brightness - 165) * 0.25;
  score += Math.min(contrast * 1.8, 35);
  score += Math.min((meta.width * meta.height) / 40000, 25);
  score += Math.min(meta.sizeBytes / 8000, 15);
  return Math.round(score * 10) / 10;
}

function readBlur(slug) {
  const blurFile = join(HERO_ROOT, kindForSlug(slug), "blurs", `${slug}.blur.txt`);
  if (!existsSync(blurFile)) return null;
  return readFileSync(blurFile, "utf8").trim() || null;
}

async function buildAssetRecord(slug) {
  const kind = kindForSlug(slug);
  const absPath = join(HERO_ROOT, kind, `${slug}.webp`);
  const thumbPath = join(HERO_ROOT, kind, "thumbs", `${slug}-480.webp`);
  if (!existsSync(absPath)) return null;

  const buf = readFileSync(absPath);
  const meta = await sharp(buf).metadata();
  const record = {
    id: slug,
    kind,
    slug,
    status: "completed",
    localPath: publicWebpPath(slug),
    thumbPath: existsSync(thumbPath)
      ? `${publicWebpPath(slug).replace(`/${slug}.webp`, `/thumbs/${slug}-480.webp`)}`
      : null,
    width: meta.width ?? null,
    height: meta.height ?? null,
    sizeBytes: buf.length,
    blurDataUrl: readBlur(slug),
    storagePath: supabaseStoragePath(slug),
  };

  if (kind === "mother-baby") {
    record.score = await scoreMotherBaby(buf, {
      width: record.width ?? 0,
      height: record.height ?? 0,
      sizeBytes: record.sizeBytes,
    });
  }

  return record;
}

async function resolvePublicUrl(supabase, record) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(record.storagePath);
  return data?.publicUrl ?? record.localPath;
}

async function registerMedia(supabase, folderId, record, isThumb) {
  const storagePath = isThumb
    ? record.storagePath.replace(`${record.slug}.webp`, `thumbs/${record.slug}-480.webp`)
    : record.storagePath;
  const url = isThumb
    ? record.thumbPath?.startsWith("http")
      ? record.thumbPath
      : record.thumbUrl ?? record.thumbPath
    : record.url;

  const { data: existing } = await supabase
    .from("media_library")
    .select("id")
    .eq("bucket", BUCKET)
    .eq("path", storagePath)
    .maybeSingle();

  const row = {
    folder_id: folderId,
    bucket: BUCKET,
    path: storagePath,
    url,
    mime_type: "image/webp",
    alt: isThumb ? `Thumbnail: ${record.slug}` : `Phase 8.1 ${record.kind}: ${record.slug}`,
  };

  if (existing?.id) {
    await supabase.from("media_library").update(row).eq("id", existing.id);
    return existing.id;
  }

  const { data: inserted, error } = await supabase
    .from("media_library")
    .insert(row)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return inserted.id;
}

async function getHomepageFolderId(supabase) {
  const { data } = await supabase
    .from("media_folders")
    .select("id")
    .eq("slug", "homepage")
    .maybeSingle();
  return data?.id ?? null;
}

async function assignHero(supabase, assets) {
  const ranked = assets
    .filter((a) => a.kind === "mother-baby" && a.score != null)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    log("⚠ No scored mother-baby assets found.");
    return { assigned: false, reason: "no_assets" };
  }

  const best = ranked[0];
  log(`\n★ Top-rated: ${best.id} (score ${best.score})`);

  const { data: slides } = await supabase
    .from("hero_slides")
    .select("id, image_url, position, is_active")
    .eq("is_active", true)
    .order("position", { ascending: true });

  let primary = slides?.[0];
  if (!primary) {
    const { data: created, error } = await supabase
      .from("hero_slides")
      .insert({
        title: "BeyondBabyCo Hero",
        subtitle: "Premium baby care for Indian families",
        position: 1,
        is_active: true,
      })
      .select("id, image_url")
      .single();
    if (error || !created) {
      log(`⚠ Could not create hero slide: ${error?.message ?? "unknown"}`);
      return { assigned: false, reason: "no_slide" };
    }
    primary = created;
    log(`✓ Created default hero slide ${primary.id}`);
  }

  if (isApprovedHeroUrl(primary.image_url)) {
    log(`✓ Existing approved hero preserved: ${primary.image_url}`);
    return { assigned: false, reason: "existing_approved", existingUrl: primary.image_url };
  }

  const heroUrl = best.url;
  const { error } = await supabase
    .from("hero_slides")
    .update({ image_url: heroUrl, updated_at: new Date().toISOString() })
    .eq("id", primary.id);

  if (error) throw new Error(error.message);
  log(`✓ Assigned hero slide → ${heroUrl}`);
  return { assigned: true, slideId: primary.id, url: heroUrl, score: best.score, id: best.id };
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY.trim(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  log("\n══ Phase 8.1 — Finalize Hero Assets ══\n");

  const slugs = args.values["assign-only"] ? MOTHER_BABY_SLUGS : ALL_HERO_SLUGS;
  const assets = [];

  if (!args.values["assign-only"]) {
    const folderId = await getHomepageFolderId(supabase);
    for (const slug of slugs) {
      const record = await buildAssetRecord(slug);
      if (!record) {
        log(`⚠ Missing: ${slug}`);
        continue;
      }
      record.url = await resolvePublicUrl(supabase, record);
      if (record.thumbPath) {
        const thumbStorage = record.storagePath.replace(
          `${record.slug}.webp`,
          `thumbs/${record.slug}-480.webp`,
        );
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(thumbStorage);
        record.thumbUrl = data?.publicUrl ?? record.thumbPath;
      }
      try {
        record.mediaId = await registerMedia(supabase, folderId, record, false);
        if (record.thumbPath) {
          record.thumbMediaId = await registerMedia(supabase, folderId, record, true);
        }
        log(`✓ Registered ${slug}${record.score != null ? ` (${record.score})` : ""}`);
      } catch (err) {
        log(`⚠ Register ${slug}: ${err instanceof Error ? err.message : err}`);
      }
      assets.push(record);
    }
  } else {
    for (const slug of MOTHER_BABY_SLUGS) {
      const record = await buildAssetRecord(slug);
      if (record) {
        record.url = await resolvePublicUrl(supabase, record);
        assets.push(record);
      }
    }
  }

  const motherBabyAssets = await Promise.all(
    MOTHER_BABY_SLUGS.map(async (slug) => {
      const r = await buildAssetRecord(slug);
      if (!r) return null;
      r.url = await resolvePublicUrl(supabase, r);
      return r;
    }),
  ).then((rows) => rows.filter(Boolean));

  const assignment = await assignHero(supabase, motherBabyAssets);

  const manifest = {
    version: "8.1",
    updatedAt: new Date().toISOString(),
    assetCount: ALL_HERO_SLUGS.length,
    onDisk: {
      motherBaby: MOTHER_BABY_SLUGS.length,
      heroBackground: 10,
      heroGlass: 10,
      trustBackground: 10,
    },
    assets: Object.fromEntries(
      (args.values["assign-only"] ? motherBabyAssets : assets).map((a) => [a.id, a]),
    ),
    heroAssignment: assignment,
  };

  const { mkdirSync, writeFileSync } = await import("node:fs");
  mkdirSync(join(__dirname, "data"), { recursive: true });
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

  log(`\n── Done: ${motherBabyAssets.length} mother-baby scored, manifest saved ──`);
}

main().catch((err) => die(err instanceof Error ? err.message : String(err)));
