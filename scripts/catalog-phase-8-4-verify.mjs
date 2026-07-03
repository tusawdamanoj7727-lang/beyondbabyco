#!/usr/bin/env node
/** Phase 8.4 catalog validation — admin + storefront readiness. */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadSupabase } from "./lib/product-asset-lib.mjs";
import { PLACEHOLDER_IMAGE } from "./data/catalog-phase-8-4.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");

async function main() {
  const { supabase } = loadSupabase(ROOT);
  const report = {
    checkedAt: new Date().toISOString(),
    categories: 0,
    brands: 0,
    products: 0,
    activeProducts: 0,
    variants: 0,
    placeholderImages: 0,
    approvedImages: 0,
    productsWithoutVariants: [],
    productsWithoutImages: [],
    sampleSlugs: [],
    storefrontReady: true,
    issues: [],
  };

  const { data: categories, error: catErr } = await supabase.from("categories").select("id,slug,name").order("name");
  if (catErr) report.issues.push(`categories: ${catErr.message}`);
  else report.categories = categories?.length ?? 0;

  const { data: brands } = await supabase.from("brands").select("id,slug,name");
  report.brands = brands?.length ?? 0;

  const { data: products } = await supabase
    .from("products")
    .select("id,slug,name,status,category_id,brand_id")
    .order("name");
  report.products = products?.length ?? 0;
  report.activeProducts = products?.filter((p) => p.status === "active" || p.status === "coming_soon").length ?? 0;
  report.sampleSlugs = (products ?? []).slice(0, 5).map((p) => p.slug);

  for (const p of products ?? []) {
    const { data: imgs } = await supabase.from("product_images").select("url,is_primary").eq("product_id", p.id);
    if (!imgs?.length) {
      report.productsWithoutImages.push(p.slug);
      report.storefrontReady = false;
    } else {
      const primary = imgs.find((i) => i.is_primary) ?? imgs[0];
      if (primary.url?.includes("product-botanical") || primary.url?.includes("placeholder")) {
        report.placeholderImages++;
      } else {
        report.approvedImages++;
      }
    }

    const { count } = await supabase
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .eq("product_id", p.id)
      .eq("is_active", true);
    report.variants += count ?? 0;
    if (!count) {
      report.productsWithoutVariants.push(p.slug);
      report.storefrontReady = false;
    }
  }

  if (report.products === 0) {
    report.storefrontReady = false;
    report.issues.push("No products in CMS");
  }

  const { data: searchTest } = await supabase
    .from("products")
    .select("slug,name")
    .in("status", ["active", "coming_soon"])
    .ilike("name", "%baby wipes%")
    .limit(3);
  report.searchSample = searchTest ?? [];

  mkdirSync(join(__dirname, "data"), { recursive: true });
  const out = join(__dirname, "data", "catalog-phase-8-4-verify.json");
  writeFileSync(out, JSON.stringify(report, null, 2));

  console.log("\n══ Phase 8.4 Catalog Verification ══\n");
  console.log(`Categories: ${report.categories}`);
  console.log(`Brands: ${report.brands}`);
  console.log(`Products: ${report.products} (${report.activeProducts} active/coming soon)`);
  console.log(`Variants: ${report.variants}`);
  console.log(`Placeholder images: ${report.placeholderImages} (ready for Phase 8.3)`);
  console.log(`Storefront ready: ${report.storefrontReady ? "yes" : "no — see issues"}`);
  if (report.issues.length) console.log(`Issues: ${report.issues.join("; ")}`);
  console.log(`\nReport: ${out}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
