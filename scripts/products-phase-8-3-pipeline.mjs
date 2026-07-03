#!/usr/bin/env node
/**
 * Phase 8.3 — Product asset generation via local ComfyUI (FLUX.1 Schnell FP8).
 *
 * Discovers products from CMS. If none exist, creates media folders only.
 * Never invents products not in the database.
 *
 * Usage:
 *   node scripts/products-phase-8-3-pipeline.mjs
 *   node scripts/products-phase-8-3-pipeline.mjs --assign-only
 *   node scripts/products-phase-8-3-pipeline.mjs --folders-only
 *   node scripts/products-phase-8-3-pipeline.mjs --product-slug gentle-baby-wipes
 *   node scripts/products-phase-8-3-pipeline.mjs --limit 1 --candidates 2
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { checkComfyHealth, generateComfyImage, loadConfig } from "./lib/comfy-generate.mjs";
import {
  ALL_SHOTS,
  PHASE,
  PRODUCT_SUBFOLDERS,
  altText,
  folderGroupKey,
  productPrompt,
} from "./lib/product-asset-catalog.mjs";
import {
  discoverProducts,
  ensureMediaFolder,
  ensureProductsBucket,
  isApprovedProductUrl,
  isDraftOrPlaceholder,
  loadSupabase,
  optimizeProductPng,
  registerProductMedia,
  saveLocalOptimized,
  scoreProductImage,
  slugify,
  uploadProductAsset,
} from "./lib/product-asset-lib.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const MANIFEST = join(__dirname, "data", "products-phase-8-3-manifest.json");
const REPORT = join(__dirname, "data", "products-phase-8-3-report.json");
const STAGING = join(ROOT, "public", "images", "generated", "products", PHASE);

const args = parseArgs({
  options: {
    "assign-only": { type: "boolean", default: false },
    "folders-only": { type: "boolean", default: false },
    "generate-only": { type: "boolean", default: false },
    "product-slug": { type: "string" },
    limit: { type: "string" },
    candidates: { type: "string", default: "2" },
  },
});

function log(msg) {
  console.log(msg);
}

function die(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

async function ensureProductFolderTree(supabase, product) {
  const productSlug = slugify(product.slug || product.name);
  const rootSlug = `products-${productSlug}`;
  const rootId = await ensureMediaFolder(supabase, {
    name: product.name,
    slug: rootSlug,
    pathPrefix: `${product.id}/${PHASE}`,
  });

  const folderIds = { root: rootId };
  for (const sub of PRODUCT_SUBFOLDERS) {
    const subSlug = `${rootSlug}-${sub.toLowerCase()}`;
    folderIds[sub.toLowerCase()] = await ensureMediaFolder(supabase, {
      name: sub,
      slug: subSlug,
      pathPrefix: `${product.id}/${PHASE}/${sub.toLowerCase()}`,
      parentId: rootId,
    });
  }
  return { productSlug, folderIds };
}

async function ensureTemplateFolders(supabase) {
  log("\n── Media Library: template folders (no products in CMS) ──");
  const rootId = await ensureMediaFolder(supabase, {
    name: "Products (Phase 8.3)",
    slug: "products-phase-8-3-root",
    pathPrefix: PHASE,
  });
  for (const sub of PRODUCT_SUBFOLDERS) {
    const id = await ensureMediaFolder(supabase, {
      name: `Products — ${sub}`,
      slug: `products-phase-8-3-${sub.toLowerCase()}`,
      pathPrefix: `${PHASE}/${sub.toLowerCase()}`,
      parentId: rootId,
    });
    log(`  ✓ Products/${sub}${id ? "" : " (skipped — schema limited)"}`);
  }
  return rootId;
}

async function generateShot(root, env, product, shot, candidateCount) {
  const prompt = productPrompt(product, shot.scene);
  const group = shot.group;
  let best = null;

  for (let c = 0; c < candidateCount; c++) {
    const seed = Math.floor(Math.random() * 2 ** 32);
    try {
      const { buffer, durationMs } = await generateComfyImage(root, env, {
        prompt,
        width: shot.w,
        height: shot.h,
        seed,
      });
      const score = await scoreProductImage(buffer, {
        width: shot.w,
        height: shot.h,
        packagingBoost: shot.packagingBoost ?? 0,
        emotionBoost: shot.emotionBoost ?? 0,
      });
      const candidate = { buffer, score, seed, durationMs, variant: c };
      if (!best || candidate.score > best.score) best = candidate;
      log(`    candidate ${c + 1}: ${shot.slug} score=${score} (${durationMs}ms)`);
    } catch (err) {
      log(`    ⚠ candidate ${c + 1} failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (!best) return null;

  mkdirSync(join(STAGING, product.slug, group), { recursive: true });
  const pngPath = join(STAGING, product.slug, group, `${shot.slug}.png`);
  writeFileSync(pngPath, best.buffer);

  const optimized = await optimizeProductPng(best.buffer, shot.slug);
  const paths = saveLocalOptimized(ROOT, product.slug, group, shot.slug, optimized);

  return { shot, optimized, paths, score: best.score, prompt, group };
}

async function processGeneratedAsset(supabase, product, productSlug, folderIds, generated) {
  const { shot, optimized, paths, score, prompt, group } = generated;
  let remote = { url: paths.publicMain, path: `${product.id}/${PHASE}/${group}/${shot.slug}.webp` };

  try {
    await ensureProductsBucket(supabase);
    remote = await uploadProductAsset(supabase, product.id, group, shot.slug, optimized);
  } catch (err) {
    log(`  ⚠ Upload ${shot.slug}: ${err instanceof Error ? err.message : err}`);
  }

  const folderKey = folderGroupKey(group).toLowerCase();
  try {
    await registerProductMedia(supabase, folderIds[folderKey] ?? folderIds.root, {
      path: remote.path,
      url: remote.url,
      sizeBytes: optimized.sizeBytes,
      originalName: `${shot.slug}.webp`,
      alt: altText(product, shot),
      width: optimized.width,
      height: optimized.height,
      blurDataUrl: optimized.blurDataUrl,
    });
  } catch (err) {
    log(`  ⚠ Register ${shot.slug}: ${err instanceof Error ? err.message : err}`);
  }

  return {
    productId: product.id,
    productSlug,
    slug: shot.slug,
    group,
    url: remote.url,
    localPath: paths.publicMain,
    avifPath: paths.publicAvif,
    thumbPath: paths.publicThumb,
    blurDataUrl: optimized.blurDataUrl,
    alt: altText(product, shot),
    score,
    prompt,
    tags: [PHASE, group, product.slug, shot.slug],
  };
}

async function generateForProduct(root, supabase, env, product, folderIds, productSlug, candidateCount) {
  const assets = [];
  log(`\n── Generating ${ALL_SHOTS.length} shots × ${candidateCount} candidates: ${product.name} ──`);

  for (const shot of ALL_SHOTS) {
    log(`  → ${shot.group}/${shot.slug}`);
    const generated = await generateShot(root, env, product, shot, candidateCount);
    if (!generated) {
      log(`  ✗ ${shot.slug} — all candidates failed`);
      continue;
    }
    const record = await processGeneratedAsset(supabase, product, productSlug, folderIds, generated);
    assets.push(record);
    log(`  ✓ ${shot.slug} (best ${record.score})`);
  }

  return assets;
}

async function assignGallery(supabase, product, assets) {
  const { data: existing } = await supabase
    .from("product_images")
    .select("id,url,alt,position,is_primary")
    .eq("product_id", product.id)
    .order("position", { ascending: true });

  const rows = existing ?? [];
  const approved = rows.filter((r) => isApprovedProductUrl(r.url));
  const hasApprovedPrimary = rows.some((r) => r.is_primary && isApprovedProductUrl(r.url));

  if (approved.length > 0 && rows.every((r) => isApprovedProductUrl(r.url))) {
    return { assigned: 0, skipped: rows.length, reason: "all_approved" };
  }

  const orderedAssets = [...assets].sort((a, b) => {
    const order = { packaging: 0, lifestyle: 1, ingredients: 2, marketing: 3 };
    if (order[a.group] !== order[b.group]) return order[a.group] - order[b.group];
    return b.score - a.score;
  });

  let assigned = 0;
  let position = rows.length;

  const slotsToFill = rows.filter((r) => isDraftOrPlaceholder(r.url));
  const newSlotsNeeded = Math.max(0, orderedAssets.length - approved.length);

  for (let i = 0; i < orderedAssets.length; i++) {
    const asset = orderedAssets[i];
    const isPrimaryCandidate =
      asset.group === "packaging" && (asset.slug === "front" || asset.slug === "front-pack") && !hasApprovedPrimary;

    const replaceRow = slotsToFill.shift();
    if (replaceRow) {
      if (isApprovedProductUrl(replaceRow.url)) continue;
      await supabase
        .from("product_images")
        .update({
          url: asset.url,
          alt: asset.alt,
          is_primary: isPrimaryCandidate || (replaceRow.is_primary && !hasApprovedPrimary),
        })
        .eq("id", replaceRow.id);
      assigned++;
      continue;
    }

    if (approved.length > 0 && assigned >= newSlotsNeeded) break;

    const isPrimary = isPrimaryCandidate && !rows.some((r) => r.is_primary && isApprovedProductUrl(r.url));
    await supabase.from("product_images").insert({
      product_id: product.id,
      url: asset.url,
      alt: asset.alt,
      position: position++,
      is_primary: isPrimary,
    });
    assigned++;
  }

  if (!rows.some((r) => r.is_primary) && assigned > 0) {
    const { data: primaryCandidate } = await supabase
      .from("product_images")
      .select("id,url")
      .eq("product_id", product.id)
      .order("position")
      .limit(1)
      .maybeSingle();
    if (primaryCandidate && isDraftOrPlaceholder(primaryCandidate.url)) {
      const front = orderedAssets.find((a) => a.slug === "front" || a.slug === "front-pack") ?? orderedAssets[0];
      if (front) {
        await supabase.from("product_images").update({ is_primary: false }).eq("product_id", product.id);
        await supabase
          .from("product_images")
          .update({ url: front.url, alt: front.alt, is_primary: true })
          .eq("id", primaryCandidate.id);
      }
    }
  }

  return { assigned, skipped: rows.length - assigned, reason: approved.length ? "filled_empty_slots" : "full_gallery" };
}

async function main() {
  const { supabase, env } = loadSupabase(ROOT);
  log("\n══ Phase 8.3 — Product Asset Pipeline (Local ComfyUI / FLUX) ══\n");

  const health = await checkComfyHealth(loadConfig(env));
  if (health.available) {
    log(`✓ ComfyUI online at ${health.url} (${health.latencyMs}ms)`);
  } else if (!args.values["folders-only"] && !args.values["assign-only"]) {
    log(`⚠ ComfyUI offline: ${health.error} — run npm run ai:start before generation`);
  }

  let products = await discoverProducts(supabase);
  log(`✓ Discovered ${products.length} product(s) in CMS`);

  if (args.values["product-slug"]) {
    const slug = args.values["product-slug"];
    products = products.filter((p) => p.slug === slug);
    if (!products.length) die(`Product not found: ${slug}`);
  }

  const limit = args.values.limit ? Number(args.values.limit) : null;
  if (limit && limit > 0) products = products.slice(0, limit);

  const candidateCount = Math.max(1, Number(args.values.candidates) || 2);
  const report = {
    phase: PHASE,
    updatedAt: new Date().toISOString(),
    comfyUi: health,
    productsProcessed: 0,
    imagesGenerated: 0,
    imagesAttached: 0,
    products: [],
    remainingWithoutAssets: [],
    optimization: { formats: ["webp", "avif"], responsiveWidths: [480, 768, 1024, 1536], thumbnails: true, blurPlaceholders: true },
    mediaLibrary: { foldersCreated: [] },
  };

  if (!products.length) {
    await ensureTemplateFolders(supabase);
    for (const sub of PRODUCT_SUBFOLDERS) {
      mkdirSync(join(ROOT, "public", "images", "products", PHASE, sub.toLowerCase()), { recursive: true });
    }
    report.mediaLibrary.foldersCreated = ["Products", ...PRODUCT_SUBFOLDERS];
    report.note = "No products in CMS — media folders created only. Add products in Admin, then re-run pipeline.";
    mkdirSync(join(__dirname, "data"), { recursive: true });
    writeFileSync(REPORT, JSON.stringify(report, null, 2));
    writeFileSync(MANIFEST, JSON.stringify({ version: "8.3", assets: [], products: [] }, null, 2));
    log(`\n── No CMS products — template folders ready ──`);
    log(`\n══ Phase 8.3 complete (folders only) ══\n`);
    return;
  }

  const allAssets = [];

  for (const product of products) {
    const { productSlug, folderIds } = await ensureProductFolderTree(supabase, product);
    report.mediaLibrary.foldersCreated.push(`${product.name}/(${PRODUCT_SUBFOLDERS.join(", ")})`);

    let assets = [];
    if (!args.values["assign-only"] && !args.values["folders-only"]) {
      if (!health.available) {
        die("ComfyUI required for generation. Run: npm run ai:start");
      }
      assets = await generateForProduct(ROOT, supabase, env, product, folderIds, productSlug, candidateCount);
      allAssets.push(...assets);
      report.imagesGenerated += assets.length;
    } else if (args.values["assign-only"] && existsSync(MANIFEST)) {
      const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
      assets = (manifest.assets ?? []).filter((a) => a.productId === product.id);
    }

    let assignment = { assigned: 0, skipped: 0 };
    if (!args.values["generate-only"] && assets.length) {
      assignment = await assignGallery(supabase, product, assets);
      report.imagesAttached += assignment.assigned;
    }

    report.productsProcessed++;
    report.products.push({
      id: product.id,
      name: product.name,
      slug: product.slug,
      assetsGenerated: assets.length,
      galleryAssigned: assignment.assigned,
      assignment,
    });
  }

  mkdirSync(join(__dirname, "data"), { recursive: true });
  writeFileSync(MANIFEST, JSON.stringify({ version: "8.3", updatedAt: new Date().toISOString(), assets: allAssets, products: report.products }, null, 2));
  writeFileSync(REPORT, JSON.stringify(report, null, 2));

  const withImages = await discoverProducts(supabase);
  for (const p of withImages) {
    const { count } = await supabase
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", p.id);
    if (!count) report.remainingWithoutAssets.push({ id: p.id, name: p.name, slug: p.slug });
  }

  log(`\n── Summary: ${report.productsProcessed} products, ${report.imagesGenerated} generated, ${report.imagesAttached} attached ──`);
  log(`\n══ Phase 8.3 complete ══\n`);
}

main().catch((err) => die(err instanceof Error ? err.message : String(err)));
