#!/usr/bin/env node
/**
 * Phase 8.3 — Storefront product image verification.
 * Checks product_images URLs for broken/placeholder references.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { discoverProducts, isDraftOrPlaceholder, loadSupabase } from "./lib/product-asset-lib.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");

async function checkUrl(url) {
  if (!url?.trim()) return { ok: false, reason: "empty" };
  if (isDraftOrPlaceholder(url)) return { ok: false, reason: "placeholder" };
  if (url.startsWith("/")) {
    const local = join(ROOT, "public", url);
    return { ok: existsSync(local), reason: existsSync(local) ? "local" : "missing_local" };
  }
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8_000) });
    return { ok: res.ok, reason: res.ok ? "remote" : `http_${res.status}` };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "fetch_failed" };
  }
}

async function main() {
  const { supabase } = loadSupabase(ROOT);
  const products = await discoverProducts(supabase);
  const report = {
    checkedAt: new Date().toISOString(),
    productCount: products.length,
    withGallery: 0,
    placeholders: [],
    broken: [],
    ok: [],
  };

  for (const product of products) {
    const { data: images } = await supabase
      .from("product_images")
      .select("id,url,is_primary,position")
      .eq("product_id", product.id)
      .order("position");

    if (!images?.length) {
      report.placeholders.push({ product: product.name, slug: product.slug, issue: "no_gallery" });
      continue;
    }

    report.withGallery++;
    for (const img of images) {
      const check = await checkUrl(img.url);
      const entry = {
        product: product.name,
        slug: product.slug,
        imageId: img.id,
        url: img.url,
        isPrimary: img.is_primary,
        reason: check.reason,
      };
      if (isDraftOrPlaceholder(img.url)) report.placeholders.push(entry);
      else if (!check.ok) report.broken.push(entry);
      else report.ok.push(entry);
    }
  }

  const out = join(__dirname, "data", "products-phase-8-3-verify.json");
  writeFileSync(out, JSON.stringify(report, null, 2));

  console.log("\n══ Product Storefront Verification ══\n");
  console.log(`Products: ${report.productCount}`);
  console.log(`With gallery: ${report.withGallery}`);
  console.log(`OK images: ${report.ok.length}`);
  console.log(`Placeholders: ${report.placeholders.length}`);
  console.log(`Broken: ${report.broken.length}`);
  console.log(`\nReport: ${out}\n`);

  if (report.broken.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
