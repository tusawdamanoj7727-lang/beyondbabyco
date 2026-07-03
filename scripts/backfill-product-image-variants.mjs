#!/usr/bin/env node
/** Phase 10.1D — Backfill missing product image variants in Supabase. */

import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  BUCKET,
  loadSupabase,
  optimizeProductPng,
  RESPONSIVE_WIDTHS,
} from "./lib/product-asset-lib.mjs";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");

function storagePathFromUrl(url) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

function optimizedPaths(mainPath) {
  const parts = mainPath.split("/");
  const file = parts.pop();
  const baseName = file.replace(/\.(webp|png|jpg|jpeg|avif)$/i, "");
  const productId = parts[0];
  const section = parts.slice(1, -1).join("/") || "gallery";
  const prefix = `${productId}/${section}`;
  return {
    avif: `${prefix}/optimized/${baseName}.avif`,
    responsive: (w) => `${prefix}/optimized/${baseName}-${w}.webp`,
    thumb: `${prefix}/thumbs/${baseName}-480.webp`,
  };
}

async function fileExists(supabase, path) {
  const dir = path.split("/").slice(0, -1).join("/");
  const name = path.split("/").pop();
  const { data } = await supabase.storage.from(BUCKET).list(dir, { search: name, limit: 1 });
  return (data ?? []).some((f) => f.name === name);
}

async function backfillOne(supabase, url, dryRun) {
  const mainPath = storagePathFromUrl(url);
  if (!mainPath) return { url, status: "skip_external" };

  const paths = optimizedPaths(mainPath);
  const avifExists = await fileExists(supabase, paths.avif);
  const thumbExists = await fileExists(supabase, paths.thumb);
  const missingWidths = [];
  for (const w of RESPONSIVE_WIDTHS) {
    if (!(await fileExists(supabase, paths.responsive(w)))) missingWidths.push(w);
  }

  if (avifExists && thumbExists && missingWidths.length === 0) {
    return { url, status: "complete" };
  }

  if (dryRun) {
    return { url, status: "needs_backfill", missing: { avif: !avifExists, thumb: !thumbExists, widths: missingWidths } };
  }

  const { data: blob, error } = await supabase.storage.from(BUCKET).download(mainPath);
  if (error || !blob) return { url, status: "download_failed", error: error?.message };

  const buffer = Buffer.from(await blob.arrayBuffer());
  const slug = mainPath.split("/").pop().replace(/\.[^.]+$/, "");
  const optimized = await optimizeProductPng(buffer, slug);

  if (!avifExists && optimized.avifBuf) {
    await supabase.storage.from(BUCKET).upload(paths.avif, optimized.avifBuf, {
      contentType: "image/avif",
      upsert: false,
    });
  }

  if (!thumbExists) {
    await supabase.storage.from(BUCKET).upload(paths.thumb, optimized.thumbBuf, {
      contentType: "image/webp",
      upsert: false,
    });
  }

  for (const w of missingWidths) {
    const buf = optimized.responsive[w];
    if (buf) {
      await supabase.storage.from(BUCKET).upload(paths.responsive(w), buf, {
        contentType: "image/webp",
        upsert: false,
      });
    }
  }

  return { url, status: "backfilled", missing: { avif: !avifExists, thumb: !thumbExists, widths: missingWidths } };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { supabase } = loadSupabase(ROOT);

  const { data: images, error } = await supabase
    .from("product_images")
    .select("id,url")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const uniqueUrls = [...new Set((images ?? []).map((i) => i.url).filter(Boolean))];
  console.log(`Checking ${uniqueUrls.length} product image URLs…`);

  const results = { complete: 0, backfilled: 0, needs: 0, skip: 0, failed: 0 };

  for (const url of uniqueUrls) {
    const r = await backfillOne(supabase, url, dryRun);
    if (r.status === "complete") results.complete++;
    else if (r.status === "backfilled") results.backfilled++;
    else if (r.status === "needs_backfill") results.needs++;
    else if (r.status === "skip_external") results.skip++;
    else results.failed++;
    if (r.status !== "complete") console.log(JSON.stringify(r));
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
