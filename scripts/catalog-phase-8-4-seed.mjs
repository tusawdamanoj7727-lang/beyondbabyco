#!/usr/bin/env node
/**
 * Phase 8.4 — Populate BeyondBabyCo production catalog in CMS.
 * Uses existing tables only. Idempotent (upsert by slug).
 *
 * Usage: node scripts/catalog-phase-8-4-seed.mjs
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ATTRIBUTE_TAGS,
  BENEFITS,
  BRAND,
  COLLECTIONS,
  COLLECTIONS_CATEGORY,
  INGREDIENTS,
  PLACEHOLDER_IMAGE,
  PRODUCT_CATEGORIES,
  PRODUCTS,
  buildDescription,
  buildSeoKeywords,
  gstRateForProductCategory,
  LAUNCH_PRODUCT_SLUGS,
  productImageForCategory,
} from "./data/catalog-phase-8-4.mjs";
import { loadSupabase } from "./lib/product-asset-lib.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const REPORT = join(__dirname, "data", "catalog-phase-8-4-report.json");

function log(msg) {
  console.log(msg);
}

async function insertOrUpdate(supabase, table, row, slug) {
  const { data: existing } = await supabase.from(table).select("id").eq("slug", slug).maybeSingle();
  const attempts = [row];
  if (table === "brands") {
    attempts.push(
      { name: row.name, slug: row.slug, description: row.description, is_active: true },
      { name: row.name, slug: row.slug, description: row.description, is_active: true, status: row.status },
    );
  }
  if (table === "categories") {
    attempts.push({
      name: row.name,
      slug: row.slug,
      description: row.description,
      position: row.position,
      is_active: true,
    });
  }
  if (table === "products") {
    attempts.push({
      name: row.name,
      slug: row.slug,
      sku: row.sku,
      brand_id: row.brand_id,
      category_id: row.category_id,
      subcategory_id: row.subcategory_id,
      short_description: row.short_description,
      description: row.description,
      compare_at_price: row.compare_at_price,
      price: row.price,
      status: row.status,
      is_featured: row.is_featured,
    });
  }

  for (const payload of attempts) {
    if (existing?.id) {
      const { error } = await supabase.from(table).update(payload).eq("id", existing.id);
      if (!error) return existing.id;
      if (!/could not find|column .* does not exist/i.test(error.message)) throw new Error(`${table} update: ${error.message}`);
    } else {
      const { data, error } = await supabase.from(table).insert(payload).select("id").single();
      if (!error && data?.id) return data.id;
      if (!error) throw new Error(`${table} insert: no id returned`);
      if (!/could not find|column .* does not exist/i.test(error.message)) throw new Error(`${table} insert: ${error.message}`);
    }
  }
  throw new Error(`${table}: all insert attempts failed for ${slug}`);
}

async function upsertBySlug(supabase, table, row) {
  return insertOrUpdate(supabase, table, row, row.slug);
}

async function upsertByName(supabase, table, row) {
  const { data: existing } = await supabase.from(table).select("id").eq("name", row.name).maybeSingle();
  if (existing?.id) return existing.id;
  const { data, error } = await supabase.from(table).insert(row).select("id").single();
  if (error) throw new Error(`${table} insert ${row.name}: ${error.message}`);
  return data.id;
}

async function upsertCategory(supabase, cat, extra = {}) {
  const row = {
    name: cat.name,
    slug: cat.slug,
    description: cat.description ?? null,
    position: cat.position ?? 0,
    is_active: true,
    status: "active",
    is_featured: cat.featured ?? false,
    ...extra,
  };
  return upsertBySlug(supabase, "categories", row);
}

async function seedBrand(supabase) {
  return upsertBySlug(supabase, "brands", {
    name: BRAND.name,
    slug: BRAND.slug,
    description: BRAND.description,
    country_of_origin: BRAND.countryOfOrigin,
    website_url: BRAND.websiteUrl,
    seo_title: BRAND.seoTitle,
    seo_description: BRAND.seoDescription,
    is_active: true,
    status: "active",
    is_featured: true,
    position: 1,
  });
}

async function seedMasterData(supabase) {
  const ingredientIds = {};
  for (const ing of INGREDIENTS) {
    ingredientIds[ing.name] = await upsertByName(supabase, "ingredients", {
      name: ing.name,
      inci_name: ing.inci,
      description: ing.description,
    });
  }

  const benefitIds = {};
  for (const ben of BENEFITS) {
    benefitIds[ben.name] = await upsertByName(supabase, "benefits", {
      name: ben.name,
      icon: ben.icon,
      description: ben.description,
    });
  }

  const tagIds = {};
  for (const tag of ATTRIBUTE_TAGS) {
    try {
      tagIds[tag.slug] = await upsertBySlug(supabase, "product_tags", {
        name: tag.name,
        slug: tag.slug,
      });
    } catch (err) {
      log(`  ⚠ Tags unavailable: ${err instanceof Error ? err.message : err}`);
      break;
    }
  }

  return { ingredientIds, benefitIds, tagIds };
}

async function seedTaxonomy(supabase) {
  const categoryIds = {};
  for (const cat of PRODUCT_CATEGORIES) {
    categoryIds[cat.slug] = await upsertCategory(supabase, cat, { is_featured: cat.slug === "baby-wipes" || cat.slug === "gift-sets" });
  }

  const collectionsCatId = await upsertCategory(supabase, {
    ...COLLECTIONS_CATEGORY,
    position: 99,
    featured: false,
  });

  const collectionIds = {};
  for (let i = 0; i < COLLECTIONS.length; i++) {
    const col = COLLECTIONS[i];
    const { data: existing } = await supabase
      .from("subcategories")
      .select("id")
      .eq("slug", col.slug)
      .maybeSingle();
    if (existing?.id) {
      collectionIds[col.slug] = existing.id;
      continue;
    }
    const { data, error } = await supabase
      .from("subcategories")
      .insert({
        category_id: collectionsCatId,
        name: col.name,
        slug: col.slug,
        description: col.description,
        position: i + 1,
        is_active: true,
      })
      .select("id")
      .single();
    if (error) throw new Error(`subcategory ${col.slug}: ${error.message}`);
    collectionIds[col.slug] = data.id;
  }

  return { categoryIds, collectionIds, collectionsCatId };
}

async function linkTags(supabase, productId, tagSlugs, tagIds) {
  for (const slug of tagSlugs) {
    const tagId = tagIds[slug];
    if (!tagId) continue;
    const { data: existing } = await supabase
      .from("product_tag_map")
      .select("product_id")
      .eq("product_id", productId)
      .eq("tag_id", tagId)
      .maybeSingle();
    if (!existing) {
      await supabase.from("product_tag_map").insert({ product_id: productId, tag_id: tagId });
    }
  }
}

async function seedProduct(supabase, p, ctx) {
  const { brandId, categoryIds, collectionIds, ingredientIds, benefitIds, tagIds } = ctx;
  const collectionName = COLLECTIONS.find((c) => c.slug === p.collection)?.name ?? p.collection;
  const canonical = `https://beyondbabyco.com/products/${p.slug}`;

  const row = {
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    brand_id: brandId,
    category_id: categoryIds[p.category],
    subcategory_id: collectionIds[p.collection] ?? null,
    short_description: p.short,
    description: buildDescription(p),
    compare_at_price: p.mrp,
    price: p.price,
    sale_price: null,
    gst_rate: p.gst ?? gstRateForProductCategory(p.category),
    tax_class: "GST",
    stock: LAUNCH_PRODUCT_SLUGS.has(p.slug) ? p.stock : 0,
    low_stock_threshold: 10,
    weight_grams: p.weight,
    status: LAUNCH_PRODUCT_SLUGS.has(p.slug) ? "active" : "coming_soon",
    is_featured: !!p.featured,
    is_best_seller: !!p.bestSeller,
    is_new_arrival: !!p.newArrival,
    is_trending: !!p.trending,
    seo_title: `${p.name} | BeyondBabyCo`,
    seo_description: p.short,
    meta_keywords: buildSeoKeywords(p, collectionName),
    canonical_url: canonical,
    published_at: LAUNCH_PRODUCT_SLUGS.has(p.slug) ? new Date().toISOString() : null,
    launch_date: new Date().toISOString(),
  };

  const productId = await upsertBySlug(supabase, "products", row);

  await supabase.from("product_ingredients").delete().eq("product_id", productId);
  for (const name of p.ingredients) {
    const id = ingredientIds[name];
    if (id) await supabase.from("product_ingredients").insert({ product_id: productId, ingredient_id: id });
  }

  await supabase.from("product_benefits").delete().eq("product_id", productId);
  for (const name of p.benefits) {
    const id = benefitIds[name];
    if (id) await supabase.from("product_benefits").insert({ product_id: productId, benefit_id: id });
  }

  await linkTags(supabase, productId, p.tags, tagIds);

  const { data: existingImages } = await supabase
    .from("product_images")
    .select("id,url,is_primary")
    .eq("product_id", productId);

  const categoryImage = productImageForCategory(p.category, p.slug);
  const needsImageUpdate =
    !existingImages?.length ||
    existingImages.every(
      (img) =>
        !img.url ||
        img.url.includes("placeholder") ||
        img.url.includes("product-botanical") ||
        img.url !== categoryImage,
    );

  if (needsImageUpdate) {
    if (existingImages?.length) {
      await supabase.from("product_images").delete().eq("product_id", productId);
    }
    await supabase.from("product_images").insert({
      product_id: productId,
      url: categoryImage,
      alt: `${p.name} | BeyondBabyCo`,
      position: 0,
      is_primary: true,
    });
  }

  const { data: existingVariants } = await supabase.from("product_variants").select("id,sku").eq("product_id", productId);
  const bySku = new Map((existingVariants ?? []).map((v) => [v.sku, v.id]));

  for (let i = 0; i < p.variants.length; i++) {
    const v = p.variants[i];
    const vRow = {
      product_id: productId,
      name: v.name,
      sku: v.sku,
      price: v.price,
      compare_at_price: v.mrp,
      position: i,
      is_active: v.available !== false,
    };
    if (bySku.has(v.sku)) {
      await supabase.from("product_variants").update(vRow).eq("id", bySku.get(v.sku));
    } else {
      await supabase.from("product_variants").insert(vRow);
    }
  }

  return productId;
}

async function updateHomepageCms(supabase, categoryIds, productIds) {
  const featuredCategorySlugs = [
    "baby-wipes",
    "baby-wash",
    "baby-lotion",
    "baby-oil",
    "gift-sets",
    "travel-kits",
    "new-born",
    "bath-time",
  ].filter((s) => categoryIds[s]);

  const fcIds = PRODUCT_CATEGORIES.map((c) => categoryIds[c.slug]).filter(Boolean).slice(0, 10);

  const featuredProductSlugs = [
    "pure-gentle-water-baby-wipes",
    "shea-butter-baby-lotion",
    "calendula-gentle-baby-wash",
    "newborn-essentials-gift-set",
    "ayurvedic-massage-oil",
    "sensitive-skin-water-wipes",
    "2-in-1-wash-shampoo",
    "premium-discovery-gift-set",
  ];

  const fpIds = featuredProductSlugs.map((slug) => productIds[slug]).filter(Boolean);

  async function upsertSection(key, config) {
    const { data: row } = await supabase.from("homepage_sections").select("id,config").eq("key", key).maybeSingle();
    const merged = { ...(row?.config ?? {}), ...config };
    if (row?.id) {
      await supabase.from("homepage_sections").update({ config: merged, updated_at: new Date().toISOString() }).eq("id", row.id);
    } else {
      await supabase.from("homepage_sections").insert({ key, config: merged, is_enabled: true });
    }
  }

  await upsertSection("featured_categories", {
    heading: "Shop by Category",
    limit: fcIds.length,
    categoryIds: fcIds,
  });

  await upsertSection("featured_products", {
    heading: "Featured Products",
    limit: fpIds.length,
    productIds: fpIds,
  });
}

async function main() {
  const { supabase } = loadSupabase(ROOT);
  log("\n══ Phase 8.4 — Catalog Builder ══\n");

  const report = {
    updatedAt: new Date().toISOString(),
    categories: 0,
    collections: 0,
    brands: 0,
    products: 0,
    variants: 0,
    ingredients: INGREDIENTS.length,
    benefits: BENEFITS.length,
    tags: ATTRIBUTE_TAGS.length,
    productIds: {},
    readyForAi: [],
  };

  const brandId = await seedBrand(supabase);
  report.brands = 1;
  log("✓ Brand: BeyondBabyCo");

  const master = await seedMasterData(supabase);
  log(`✓ Master data: ${INGREDIENTS.length} ingredients, ${BENEFITS.length} benefits, ${ATTRIBUTE_TAGS.length} tags`);

  const taxonomy = await seedTaxonomy(supabase);
  report.categories = PRODUCT_CATEGORIES.length;
  report.collections = COLLECTIONS.length;
  log(`✓ Categories: ${report.categories}, Collections (subcategories): ${report.collections}`);

  let variantCount = 0;
  for (const p of PRODUCTS) {
    const id = await seedProduct(supabase, p, { brandId, ...taxonomy, ...master });
    report.productIds[p.slug] = id;
    report.products++;
    variantCount += p.variants.length;
    report.readyForAi.push({ slug: p.slug, id, name: p.name });
    log(`  ✓ ${p.name}`);
  }
  report.variants = variantCount;

  await updateHomepageCms(supabase, taxonomy.categoryIds, report.productIds);
  log("✓ Homepage CMS: featured categories & products updated");

  mkdirSync(join(__dirname, "data"), { recursive: true });
  writeFileSync(REPORT, JSON.stringify(report, null, 2));

  log(`\n── Done: ${report.products} products, ${report.variants} variants ──`);
  log(`Report: ${REPORT}`);
  log("\n══ Phase 8.4 complete — run npm run products:phase-8-3 for AI images ══\n");
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
