#!/usr/bin/env node
/**
 * Phase 8.5 — Premium product photography (ComfyUI / FLUX.1 Schnell).
 *
 * Generates ~35 shots per product, optimizes, registers in Media Library,
 * and replaces placeholder product_images only (never overwrites approved media).
 *
 * Usage:
 *   node scripts/products-phase-8-5-pipeline.mjs --batch 1
 *   node scripts/products-phase-8-5-pipeline.mjs --batch all
 *   node scripts/products-phase-8-5-pipeline.mjs --product-slug pure-gentle-water-baby-wipes
 *   node scripts/products-phase-8-5-pipeline.mjs --assign-only
 *   node scripts/products-phase-8-5-pipeline.mjs --fresh
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { checkComfyHealth, generateComfyImage, loadConfig, resolveGenerationDimensions } from "./lib/comfy-generate.mjs";
import {
  ALL_SHOTS,
  BATCHES,
  NEGATIVE,
  PHASE,
  PRODUCT_SUBFOLDERS,
  altText,
  folderGroupKey,
  productPrompt,
  shotKey,
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
const MANIFEST = join(__dirname, "data", "products-phase-8-5-manifest.json");
const REPORT = join(__dirname, "data", "products-phase-8-5-report.json");
const CHECKPOINT = join(__dirname, "data", "products-phase-8-5-checkpoint.json");
const STAGING = join(ROOT, "public", "images", "generated", "products", PHASE);

const args = parseArgs({
  options: {
    "assign-only": { type: "boolean", default: false },
    "folders-only": { type: "boolean", default: false },
    "generate-only": { type: "boolean", default: false },
    "product-slug": { type: "string" },
    batch: { type: "string", default: "all" },
    limit: { type: "string" },
    candidates: { type: "string", default: "2" },
    fresh: { type: "boolean", default: false },
  },
});

function log(msg) {
  console.log(msg);
}

function die(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

function loadCheckpoint() {
  if (args.values.fresh || !existsSync(CHECKPOINT)) {
    return {
      completedShots: [],
      productsDone: [],
      batchesCompleted: [],
      generationMs: 0,
      failed: [],
      startedAt: new Date().toISOString(),
    };
  }
  return JSON.parse(readFileSync(CHECKPOINT, "utf8"));
}

function saveCheckpoint(cp) {
  mkdirSync(join(__dirname, "data"), { recursive: true });
  writeFileSync(CHECKPOINT, JSON.stringify({ ...cp, updatedAt: new Date().toISOString() }, null, 2));
}

function resolveBatchSlugs(batchArg) {
  if (batchArg === "all") return [...BATCHES[1], ...BATCHES[2], ...BATCHES[3]];
  const n = Number(batchArg);
  if (BATCHES[n]) return BATCHES[n];
  die(`Unknown batch "${batchArg}". Use 1, 2, 3, or all.`);
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

async function generateShot(root, env, product, shot, candidateCount) {
  const prompt = productPrompt(product, shot.scene);
  const group = shot.group;
  const dims = resolveGenerationDimensions(shot.w, shot.h);
  let best = null;

  for (let c = 0; c < candidateCount; c++) {
    const seed = Math.floor(Math.random() * 2 ** 32);
    try {
      const { buffer, durationMs } = await generateComfyImage(root, env, {
        prompt,
        negativePrompt: NEGATIVE,
        width: dims.genWidth,
        height: dims.genHeight,
        seed,
      });
      const score = await scoreProductImage(buffer, {
        width: dims.targetWidth,
        height: dims.targetHeight,
        packagingBoost: shot.packagingBoost ?? 0,
        emotionBoost: shot.emotionBoost ?? 0,
      });
      const candidate = { buffer, score, seed, durationMs, variant: c };
      if (!best || candidate.score > best.score) best = candidate;
      log(`    candidate ${c + 1}: ${shot.slug} score=${score} (${durationMs}ms${dims.upscaled ? `, gen ${dims.genWidth}×${dims.genHeight}→${dims.targetWidth}×${dims.targetHeight}` : ""})`);
    } catch (err) {
      log(`    ⚠ candidate ${c + 1} failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (!best) return null;

  mkdirSync(join(STAGING, product.slug, group), { recursive: true });
  const pngPath = join(STAGING, product.slug, group, `${shot.slug}.png`);
  writeFileSync(pngPath, best.buffer);

  const optimized = await optimizeProductPng(best.buffer, shot.slug, {
    targetWidth: dims.upscaled ? dims.targetWidth : undefined,
    targetHeight: dims.upscaled ? dims.targetHeight : undefined,
  });
  const paths = saveLocalOptimized(ROOT, product.slug, group, shot.slug, optimized);

  return {
    shot,
    optimized,
    paths,
    score: best.score,
    prompt,
    group,
    durationMs: best.durationMs,
  };
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

async function generateForProduct(root, supabase, env, product, folderIds, productSlug, candidateCount, checkpoint) {
  const assets = [];
  const completed = new Set(checkpoint.completedShots ?? []);
  log(`\n── ${product.name} (${ALL_SHOTS.length} shots × ${candidateCount} candidates) ──`);

  for (const shot of ALL_SHOTS) {
    const key = shotKey(product.slug, shot.slug);
    if (completed.has(key)) {
      log(`  ↷ skip ${shot.group}/${shot.slug} (checkpoint)`);
      if (existsSync(MANIFEST)) {
        const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
        const cached = (manifest.assets ?? []).find((a) => a.productSlug === product.slug && a.slug === shot.slug);
        if (cached) assets.push(cached);
      }
      continue;
    }

    log(`  → ${shot.group}/${shot.slug}`);
    const generated = await generateShot(root, env, product, shot, candidateCount);
    if (!generated) {
      log(`  ✗ ${shot.slug} — all candidates failed`);
      checkpoint.failed.push({ product: product.slug, shot: shot.slug, at: new Date().toISOString() });
      saveCheckpoint(checkpoint);
      continue;
    }

    checkpoint.generationMs = (checkpoint.generationMs ?? 0) + (generated.durationMs ?? 0);
    const record = await processGeneratedAsset(supabase, product, productSlug, folderIds, generated);
    assets.push(record);
    completed.add(key);
    checkpoint.completedShots = [...completed];
    saveCheckpoint(checkpoint);
    log(`  ✓ ${shot.slug} (best ${record.score})`);
  }

  if (!checkpoint.productsDone.includes(product.slug)) {
    checkpoint.productsDone.push(product.slug);
    saveCheckpoint(checkpoint);
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

  if (rows.length > 0 && rows.every((r) => isApprovedProductUrl(r.url))) {
    return { assigned: 0, skipped: rows.length, reason: "all_approved" };
  }

  const orderedAssets = [...assets].sort((a, b) => {
    const order = { packaging: 0, lifestyle: 1, ingredients: 2, marketing: 3 };
    if (order[a.group] !== order[b.group]) return order[a.group] - order[b.group];
    return b.score - a.score;
  });

  if (!orderedAssets.length) return { assigned: 0, skipped: rows.length, reason: "no_assets" };

  const onlyPlaceholders = rows.length === 0 || rows.every((r) => isDraftOrPlaceholder(r.url));
  const frontAsset =
    orderedAssets.find((a) => a.slug === "front" && a.group === "packaging") ??
    orderedAssets.find((a) => a.group === "packaging") ??
    orderedAssets[0];

  let assigned = 0;

  if (onlyPlaceholders && rows.length > 0) {
    await supabase.from("product_images").delete().eq("product_id", product.id);
  }

  if (onlyPlaceholders || rows.length === 0) {
    for (let i = 0; i < orderedAssets.length; i++) {
      const asset = orderedAssets[i];
      await supabase.from("product_images").insert({
        product_id: product.id,
        url: asset.url,
        alt: asset.alt,
        position: i,
        is_primary: asset === frontAsset,
      });
      assigned++;
    }
    return { assigned, skipped: 0, reason: "full_gallery" };
  }

  const slotsToFill = rows.filter((r) => isDraftOrPlaceholder(r.url));
  let position = rows.length;

  for (const asset of orderedAssets) {
    const replaceRow = slotsToFill.shift();
    if (replaceRow) {
      if (isApprovedProductUrl(replaceRow.url)) continue;
      await supabase
        .from("product_images")
        .update({
          url: asset.url,
          alt: asset.alt,
          is_primary: asset === frontAsset && replaceRow.is_primary,
        })
        .eq("id", replaceRow.id);
      assigned++;
      continue;
    }

    await supabase.from("product_images").insert({
      product_id: product.id,
      url: asset.url,
      alt: asset.alt,
      position: position++,
      is_primary: false,
    });
    assigned++;
  }

  const { data: after } = await supabase
    .from("product_images")
    .select("id,is_primary,url")
    .eq("product_id", product.id);
  if (!after?.some((r) => r.is_primary)) {
    const target = after?.find((r) => r.url === frontAsset.url);
    if (target) {
      await supabase.from("product_images").update({ is_primary: false }).eq("product_id", product.id);
      await supabase.from("product_images").update({ is_primary: true }).eq("id", target.id);
    }
  }

  return { assigned, skipped: rows.length, reason: "partial_replace" };
}

function mergeManifest(existing, newAssets) {
  const map = new Map((existing?.assets ?? []).map((a) => [`${a.productSlug}/${a.slug}`, a]));
  for (const a of newAssets) map.set(`${a.productSlug}/${a.slug}`, a);
  return { version: "8.5", updatedAt: new Date().toISOString(), assets: [...map.values()] };
}

async function main() {
  const startedAt = Date.now();
  const { supabase, env } = loadSupabase(ROOT);
  const checkpoint = loadCheckpoint();

  log("\n══ Phase 8.5 — Premium Product Photography (ComfyUI / FLUX) ══\n");

  const health = await checkComfyHealth(loadConfig(env));
  if (health.available) {
    log(`✓ ComfyUI online at ${health.url} (${health.latencyMs}ms)`);
  } else if (!args.values["folders-only"] && !args.values["assign-only"]) {
    log(`⚠ ComfyUI offline: ${health.error}`);
  }

  let products = await discoverProducts(supabase);
  log(`✓ Discovered ${products.length} product(s) in CMS`);

  const batchSlugs = resolveBatchSlugs(args.values.batch);
  products = products.filter((p) => batchSlugs.includes(p.slug));
  log(`✓ Batch ${args.values.batch}: ${products.length} product(s) targeted`);

  if (args.values["product-slug"]) {
    const slug = args.values["product-slug"];
    products = products.filter((p) => p.slug === slug);
    if (!products.length) die(`Product not found in batch: ${slug}`);
  }

  const limit = args.values.limit ? Number(args.values.limit) : null;
  if (limit && limit > 0) products = products.slice(0, limit);

  const candidateCount = Math.max(1, Number(args.values.candidates) || 2);
  const report = {
    phase: PHASE,
    batch: args.values.batch,
    updatedAt: new Date().toISOString(),
    comfyUi: health,
    productsProcessed: 0,
    imagesGenerated: 0,
    imagesAttached: 0,
    remainingPlaceholders: [],
    failedGenerations: checkpoint.failed ?? [],
    generationMs: checkpoint.generationMs ?? 0,
    generationMinutes: 0,
    products: [],
    mediaLibrary: { foldersCreated: [] },
    optimization: {
      formats: ["webp", "avif"],
      responsiveWidths: [480, 768, 1024, 1536],
      thumbnails: true,
      blurPlaceholders: true,
    },
  };

  if (!products.length) {
    die("No products matched batch filter.");
  }

  let manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : { assets: [] };
  const batchAssets = [];

  for (const product of products) {
    const { productSlug, folderIds } = await ensureProductFolderTree(supabase, product);
    report.mediaLibrary.foldersCreated.push(`${product.name}/(${PRODUCT_SUBFOLDERS.join(", ")})`);

    let assets = [];
    if (!args.values["assign-only"] && !args.values["folders-only"]) {
      if (!health.available) die("ComfyUI required for generation. Run: npm run ai:start");
      assets = await generateForProduct(ROOT, supabase, env, product, folderIds, productSlug, candidateCount, checkpoint);
      batchAssets.push(...assets);
      report.imagesGenerated += assets.length;
    } else if (args.values["assign-only"]) {
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

  manifest = mergeManifest(manifest, batchAssets);
  mkdirSync(join(__dirname, "data"), { recursive: true });
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

  report.generationMs = checkpoint.generationMs ?? 0;
  report.generationMinutes = Math.round((report.generationMs / 60_000) * 10) / 10;
  report.failedGenerations = checkpoint.failed ?? [];

  for (const p of await discoverProducts(supabase)) {
    const { data: images } = await supabase.from("product_images").select("url").eq("product_id", p.id);
    const ph = (images ?? []).filter((i) => isDraftOrPlaceholder(i.url));
    if (ph.length) report.remainingPlaceholders.push({ slug: p.slug, name: p.name, count: ph.length });
  }

  const batchNum = args.values.batch !== "all" ? Number(args.values.batch) : null;
  if (batchNum && !checkpoint.batchesCompleted.includes(batchNum)) {
    checkpoint.batchesCompleted.push(batchNum);
    saveCheckpoint(checkpoint);
  }

  report.totalImagesInManifest = manifest.assets?.length ?? 0;
  report.elapsedMs = Date.now() - startedAt;
  writeFileSync(REPORT, JSON.stringify(report, null, 2));

  log(`\n── Summary ──`);
  log(`Products processed: ${report.productsProcessed}`);
  log(`Images this run: ${report.imagesGenerated}`);
  log(`Total manifest assets: ${report.totalImagesInManifest}`);
  log(`CMS attachments: ${report.imagesAttached}`);
  log(`Remaining placeholders: ${report.remainingPlaceholders.length} product(s)`);
  log(`AI generation time: ${report.generationMinutes} min`);
  log(`Failed shots: ${report.failedGenerations.length}`);
  log(`Report: ${REPORT}`);
  log(`\n══ Phase 8.5 batch ${args.values.batch} complete ══\n`);
}

main().catch((err) => die(err instanceof Error ? err.message : String(err)));
