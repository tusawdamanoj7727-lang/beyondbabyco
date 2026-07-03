#!/usr/bin/env node
/**
 * Phase 8.5A — Optimized layered product photography pipeline.
 *
 * Layer 1: Master scenes (once) — scripts/master-scenes-generate.mjs
 * Layer 2: Pack renders per product (FLUX, 7 shots)
 * Layer 3: Composites (Sharp, ~2s each)
 * Layer 4: FLUX heroes only (7 shots per product)
 *
 * Usage:
 *   node scripts/products-phase-8-5a-pipeline.mjs --batch 1
 *   node scripts/products-phase-8-5a-pipeline.mjs --scenes-procedural
 *   node scripts/products-phase-8-5a-pipeline.mjs --product-slug pure-gentle-water-baby-wipes
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import sharp from "sharp";

import { checkComfyHealth, generateComfyImage, loadConfig, resolveGenerationDimensions } from "./lib/comfy-generate.mjs";
import { compositeFromSceneSlug, cropPackRegion } from "./lib/composite-engine.mjs";
import { MASTER_SCENES, SCENE_PHASE, scenePaths } from "./lib/master-scene-catalog.mjs";
import { generateProceduralScene } from "./lib/master-scene-procedural.mjs";
import {
  ALL_OUTPUT_SHOTS,
  COMPOSITE_SHOTS,
  FLUX_HERO_SHOTS,
  PACK_RENDER_SHOTS,
  estimatePipelineMetrics,
  shotPipelineKey,
} from "./lib/pipeline-8-5a.mjs";
import {
  BATCHES,
  NEGATIVE,
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
const MANIFEST = join(__dirname, "data", "products-phase-8-5a-manifest.json");
const REPORT = join(__dirname, "data", "products-phase-8-5a-report.json");
const CHECKPOINT = join(__dirname, "data", "products-phase-8-5a-checkpoint.json");
const STAGING = join(ROOT, "public", "images", "generated", "products", PHASE);

const args = parseArgs({
  options: {
    "assign-only": { type: "boolean", default: false },
    "generate-only": { type: "boolean", default: false },
    "product-slug": { type: "string" },
    batch: { type: "string", default: "all" },
    limit: { type: "string" },
    candidates: { type: "string", default: "1" },
    fresh: { type: "boolean", default: false },
    "scenes-procedural": { type: "boolean", default: false },
    "scenes-flux": { type: "boolean", default: false },
    benchmark: { type: "boolean", default: false },
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
      compositeMs: 0,
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

function readBufferIfExists(...paths) {
  for (const p of paths) {
    if (existsSync(p)) return readFileSync(p);
  }
  return null;
}

async function ensureMasterScenes(root, env) {
  log("\n── Layer 1: Master Scene Library ──");
  mkdirSync(join(root, "public", "images", "products", SCENE_PHASE), { recursive: true });

  const useFlux = args.values["scenes-flux"] && !args.values["scenes-procedural"];
  let fluxOk = false;
  if (useFlux) {
    const health = await checkComfyHealth(loadConfig(env));
    fluxOk = health.available;
    log(fluxOk ? `✓ ComfyUI online for scenes` : `⚠ ComfyUI offline — procedural scenes`);
  } else {
    log("Using procedural master scenes (instant, reusable)");
  }

  for (const scene of MASTER_SCENES) {
    const paths = scenePaths(root, scene.slug);
    if (existsSync(paths.png)) {
      log(`  ↷ ${scene.slug} (cached)`);
      continue;
    }

    let buffer = null;
    if (fluxOk) {
      try {
        const dims = resolveGenerationDimensions(scene.w, scene.h);
        const { buffer: b, durationMs } = await generateComfyImage(root, env, {
          prompt: `85mm lens, empty ${scene.name} background, soft morning light, cream sage palette, no products, no people, no text`,
          negativePrompt: "product, bottle, people, text, watermark",
          width: dims.genWidth,
          height: dims.genHeight,
          seed: scene.slug.length * 997,
        });
        buffer = b;
        log(`  ✓ ${scene.slug} (flux ${durationMs}ms)`);
      } catch (err) {
        log(`  ⚠ flux ${scene.slug}: ${err instanceof Error ? err.message : err}`);
      }
    }

    if (!buffer) {
      const proc = await generateProceduralScene(scene.slug, scene.w, scene.h);
      buffer = proc.buffer;
      log(`  ✓ ${scene.slug} (procedural)`);
    }

    writeFileSync(paths.png, buffer);
    const opt = await optimizeProductPng(buffer, scene.slug, { targetWidth: scene.w, targetHeight: scene.h });
    writeFileSync(paths.main, opt.mainWebp);
  }

  log(`  ${MASTER_SCENES.length} scenes ready\n`);
}

function loadSceneBuffer(root, sceneSlug) {
  const paths = scenePaths(root, sceneSlug);
  return readBufferIfExists(paths.png, paths.main);
}

function packPaths(root, productSlug, packSlug) {
  const base = join(root, "public", "images", "products", PHASE, productSlug, "packaging");
  return {
    png: join(STAGING, productSlug, "packaging", `${packSlug}.png`),
    stagingPng: join(STAGING, productSlug, "packaging", `${packSlug}.png`),
    publicPng: join(base, `${packSlug}.png`),
    publicWebp: join(base, `${packSlug}.webp`),
  };
}

function loadPackBuffer(root, productSlug, packSlug, packCache) {
  const key = `${productSlug}/${packSlug}`;
  if (packCache.has(key)) return packCache.get(key);
  const paths = packPaths(root, productSlug, packSlug);
  const buf = readBufferIfExists(paths.stagingPng, paths.publicPng, paths.publicWebp);
  if (buf) packCache.set(key, buf);
  return buf;
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

async function generateFluxShot(root, env, product, shot, candidateCount) {
  const prompt = productPrompt(product, shot.scene);
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
      const candidate = { buffer, score, durationMs };
      if (!best || candidate.score > best.score) best = candidate;
      log(`    flux candidate ${c + 1}: ${shot.slug} score=${score} (${durationMs}ms)`);
    } catch (err) {
      log(`    ⚠ flux ${shot.slug}: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (!best) return null;

  const optimized = await optimizeProductPng(best.buffer, shot.slug, {
    targetWidth: dims.upscaled ? dims.targetWidth : undefined,
    targetHeight: dims.upscaled ? dims.targetHeight : undefined,
  });

  return { buffer: best.buffer, optimized, score: best.score, durationMs: best.durationMs, prompt };
}

async function compositeShot(root, product, compositeDef, packCache) {
  const started = Date.now();
  const packBuf = loadPackBuffer(root, product.slug, compositeDef.pack, packCache);
  if (!packBuf) {
    log(`    ⚠ composite ${compositeDef.slug}: missing pack "${compositeDef.pack}"`);
    return null;
  }

  let buffer;
  let width;
  let height;

  if (compositeDef.mode === "crop") {
    buffer = await cropPackRegion(packBuf, compositeDef.crop);
    const meta = await sharpMeta(buffer);
    width = meta.width;
    height = meta.height;
    const targetW = compositeDef.group === "packaging" ? 1024 : 1280;
    const targetH = compositeDef.group === "packaging" ? 1024 : 960;
    const optimized = await optimizeProductPng(buffer, compositeDef.slug, {
      targetWidth: targetW,
      targetHeight: targetH,
    });
    return {
      optimized,
      score: 75,
      durationMs: Date.now() - started,
      method: "crop",
      prompt: `composite crop from ${compositeDef.pack}`,
      buffer,
    };
  }

  const sceneBuf = loadSceneBuffer(root, compositeDef.scene);
  if (!sceneBuf) {
    log(`    ⚠ composite ${compositeDef.slug}: missing scene "${compositeDef.scene}"`);
    return null;
  }

  const result = await compositeFromSceneSlug(compositeDef.scene, sceneBuf, packBuf, {
    placement: compositeDef.placement,
    useIsolation: compositeDef.useIsolation,
  });

  buffer = result.buffer;
  width = result.width;
  height = result.height;

  const score = await scoreProductImage(buffer, {
    width,
    height,
    packagingBoost: 10,
    emotionBoost: 8,
  });

  const optimized = await optimizeProductPng(buffer, compositeDef.slug, {
    targetWidth: width,
    targetHeight: height,
  });

  return {
    optimized,
    score,
    durationMs: Date.now() - started,
    method: compositeDef.mode === "crop" ? "crop" : "composite",
    prompt: `composite ${compositeDef.pack} on ${compositeDef.scene ?? "crop"}`,
    buffer,
  };
}

async function sharpMeta(buffer) {
  return sharp(buffer).metadata();
}

async function processAsset(supabase, product, productSlug, folderIds, shot, generated) {
  const group = shot.group;
  const { optimized, score, prompt, durationMs, method, buffer } = generated;

  if (buffer) {
    mkdirSync(join(STAGING, product.slug, group), { recursive: true });
    writeFileSync(join(STAGING, product.slug, group, `${shot.slug}.png`), buffer);
  }

  const paths = saveLocalOptimized(ROOT, product.slug, group, shot.slug, optimized);

  let remote = { url: paths.publicMain, path: `${product.id}/${PHASE}/${group}/${shot.slug}.webp` };
  try {
    await ensureProductsBucket(supabase);
    remote = await uploadProductAsset(supabase, product.id, group, shot.slug, optimized);
  } catch (err) {
    log(`  ⚠ upload ${shot.slug}: ${err instanceof Error ? err.message : err}`);
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
  } catch {
    /* schema limited */
  }

  return {
    productId: product.id,
    productSlug,
    slug: shot.slug,
    group,
    url: remote.url,
    localPath: paths.publicMain,
    score,
    prompt,
    method: method ?? shot.pipeline,
    durationMs,
    tags: [PHASE, "8.5a", group, product.slug, shot.slug],
  };
}

async function generateForProduct(root, supabase, env, product, folderIds, productSlug, candidateCount, checkpoint) {
  const assets = [];
  const packCache = new Map();
  const completed = new Set(checkpoint.completedShots ?? []);

  const compositeCount = COMPOSITE_SHOTS.length;
  log(`\n── ${product.name} ──`);
  log(`   Layer 2: ${PACK_RENDER_SHOTS.length} pack renders (FLUX)`);
  log(`   Layer 3: ${compositeCount} composites (Sharp)`);
  log(`   Layer 4: ${FLUX_HERO_SHOTS.length} heroes (FLUX)`);

  for (const shot of PACK_RENDER_SHOTS) {
    const key = shotPipelineKey(product.slug, shot.slug);
    if (completed.has(key)) {
      log(`  ↷ pack/${shot.slug}`);
      continue;
    }
    log(`  → pack/${shot.slug}`);
    const generated = await generateFluxShot(root, env, product, shot, candidateCount);
    if (!generated) {
      checkpoint.failed.push({ product: product.slug, shot: shot.slug, layer: "pack" });
      saveCheckpoint(checkpoint);
      continue;
    }
    packCache.set(`${product.slug}/${shot.slug}`, generated.buffer);
    mkdirSync(join(STAGING, product.slug, "packaging"), { recursive: true });
    writeFileSync(join(STAGING, product.slug, "packaging", `${shot.slug}.png`), generated.buffer);
    const record = await processAsset(supabase, product, productSlug, folderIds, shot, {
      ...generated,
      buffer: generated.buffer,
      method: "flux-pack",
    });
    assets.push(record);
    checkpoint.generationMs += generated.durationMs ?? 0;
    completed.add(key);
    checkpoint.completedShots = [...completed];
    saveCheckpoint(checkpoint);
    log(`  ✓ pack/${shot.slug} (${generated.durationMs}ms)`);
  }

  for (const comp of COMPOSITE_SHOTS) {
    const key = shotPipelineKey(product.slug, comp.slug);
    if (completed.has(key)) {
      log(`  ↷ composite/${comp.group}/${comp.slug}`);
      continue;
    }
    log(`  → composite/${comp.group}/${comp.slug}`);
    const shotMeta = ALL_OUTPUT_SHOTS.find((s) => s.slug === comp.slug && s.group === comp.group);
    const generated = await compositeShot(root, product, comp, packCache);
    if (!generated) {
      checkpoint.failed.push({ product: product.slug, shot: comp.slug, layer: "composite" });
      saveCheckpoint(checkpoint);
      continue;
    }
    const record = await processAsset(supabase, product, productSlug, folderIds, shotMeta ?? comp, generated);
    assets.push(record);
    checkpoint.compositeMs = (checkpoint.compositeMs ?? 0) + (generated.durationMs ?? 0);
    completed.add(key);
    checkpoint.completedShots = [...completed];
    saveCheckpoint(checkpoint);
    log(`  ✓ composite/${comp.slug} (${generated.durationMs}ms, ${generated.method})`);
  }

  for (const shot of FLUX_HERO_SHOTS) {
    const key = shotPipelineKey(product.slug, shot.slug);
    if (completed.has(key)) {
      log(`  ↷ hero/${shot.slug}`);
      continue;
    }
    log(`  → hero/${shot.slug}`);
    const generated = await generateFluxShot(root, env, product, shot, candidateCount);
    if (!generated) {
      checkpoint.failed.push({ product: product.slug, shot: shot.slug, layer: "hero" });
      saveCheckpoint(checkpoint);
      continue;
    }
    const record = await processAsset(supabase, product, productSlug, folderIds, shot, {
      ...generated,
      buffer: generated.buffer,
      method: "flux-hero",
    });
    assets.push(record);
    checkpoint.generationMs += generated.durationMs ?? 0;
    completed.add(key);
    checkpoint.completedShots = [...completed];
    saveCheckpoint(checkpoint);
    log(`  ✓ hero/${shot.slug} (${generated.durationMs}ms)`);
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
    orderedAssets.find((a) => a.slug === "front" && a.group === "packaging") ?? orderedAssets[0];

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
      await supabase
        .from("product_images")
        .update({ url: asset.url, alt: asset.alt, is_primary: asset === frontAsset && replaceRow.is_primary })
        .eq("id", replaceRow.id);
      assigned++;
    } else {
      await supabase.from("product_images").insert({
        product_id: product.id,
        url: asset.url,
        alt: asset.alt,
        position: position++,
        is_primary: false,
      });
      assigned++;
    }
  }
  return { assigned, skipped: rows.length, reason: "partial_replace" };
}

async function main() {
  const startedAt = Date.now();
  const { supabase, env } = loadSupabase(ROOT);
  const checkpoint = loadCheckpoint();
  const candidateCount = Math.max(1, Number(args.values.candidates) || 1);
  const metrics = estimatePipelineMetrics(22, candidateCount);

  log("\n══ Phase 8.5A — Layered Product Photography Pipeline ══\n");
  log(`Workflow: ${metrics.masterScenes} master scenes + ${metrics.fluxPerProduct} FLUX/product + ${metrics.compositePerProduct} composites/product`);
  log(`Estimated FLUX reduction: ${metrics.fluxReductionPct}% | Time saved: ~${metrics.timeSavedPct}%`);
  log(`Old: ~${metrics.oldTotalMinutes} min → New: ~${metrics.newTotalMinutes} min (${metrics.newMsPerAsset / 1000}s avg/asset)\n`);

  if (args.values.benchmark) {
    mkdirSync(join(__dirname, "data"), { recursive: true });
    writeFileSync(REPORT, JSON.stringify({ benchmark: metrics, updatedAt: new Date().toISOString() }, null, 2));
    log(`Benchmark written: ${REPORT}\n`);
    return;
  }

  const health = await checkComfyHealth(loadConfig(env));
  if (health.available) {
    log(`✓ ComfyUI online at ${health.url} (${health.latencyMs}ms)`);
  } else if (!args.values["assign-only"]) {
    log(`⚠ ComfyUI offline — pack renders and heroes require FLUX`);
  }

  if (!args.values["assign-only"]) {
    await ensureMasterScenes(ROOT, env);
  }

  let products = await discoverProducts(supabase);
  const batchSlugs = resolveBatchSlugs(args.values.batch);
  products = products.filter((p) => batchSlugs.includes(p.slug));
  if (args.values["product-slug"]) {
    products = products.filter((p) => p.slug === args.values["product-slug"]);
  }
  const limit = args.values.limit ? Number(args.values.limit) : null;
  if (limit && limit > 0) products = products.slice(0, limit);
  if (!products.length) die("No products matched filter.");

  log(`✓ ${products.length} product(s) in batch ${args.values.batch}`);

  const report = {
    phase: "8.5a",
    pipeline: "layered",
    batch: args.values.batch,
    updatedAt: new Date().toISOString(),
    metrics,
    comfyUi: health,
    layers: {
      masterScenes: MASTER_SCENES.length,
      packRendersPerProduct: PACK_RENDER_SHOTS.length,
      compositesPerProduct: COMPOSITE_SHOTS.length,
      fluxHeroesPerProduct: FLUX_HERO_SHOTS.length,
    },
    productsProcessed: 0,
    imagesGenerated: 0,
    fluxImages: 0,
    compositeImages: 0,
    imagesAttached: 0,
    generationMs: checkpoint.generationMs ?? 0,
    compositeMs: checkpoint.compositeMs ?? 0,
    products: [],
    reusableAssets: {
      masterScenes: MASTER_SCENES.map((s) => s.slug),
      scenesPath: `/images/products/${SCENE_PHASE}/`,
    },
  };

  let manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : { assets: [] };
  const batchAssets = [];

  for (const product of products) {
    const { productSlug, folderIds } = await ensureProductFolderTree(supabase, product);
    let assets = [];

    if (!args.values["assign-only"]) {
      if (!health.available) die("ComfyUI required for pack renders and heroes. Run: npm run ai:start");
      assets = await generateForProduct(ROOT, supabase, env, product, folderIds, productSlug, candidateCount, checkpoint);
      batchAssets.push(...assets);
      report.imagesGenerated += assets.length;
      report.fluxImages += assets.filter((a) => a.method?.startsWith("flux")).length;
      report.compositeImages += assets.filter((a) => a.method === "composite" || a.method === "crop").length;
    } else {
      assets = (manifest.assets ?? []).filter((a) => a.productId === product.id);
    }

    let assignment = { assigned: 0 };
    if (!args.values["generate-only"] && assets.length) {
      assignment = await assignGallery(supabase, product, assets);
      report.imagesAttached += assignment.assigned;
    }

    report.productsProcessed++;
    report.products.push({
      slug: product.slug,
      name: product.name,
      assetsGenerated: assets.length,
      galleryAssigned: assignment.assigned,
    });
  }

  const map = new Map((manifest.assets ?? []).map((a) => [`${a.productSlug}/${a.slug}`, a]));
  for (const a of batchAssets) map.set(`${a.productSlug}/${a.slug}`, a);
  writeFileSync(MANIFEST, JSON.stringify({ version: "8.5a", updatedAt: new Date().toISOString(), assets: [...map.values()] }, null, 2));

  report.generationMs = checkpoint.generationMs ?? 0;
  report.compositeMs = checkpoint.compositeMs ?? 0;
  report.elapsedMs = Date.now() - startedAt;
  report.avgMsPerAsset =
    report.imagesGenerated > 0
      ? Math.round((report.generationMs + report.compositeMs) / report.imagesGenerated)
      : metrics.newMsPerAsset;

  mkdirSync(join(__dirname, "data"), { recursive: true });
  writeFileSync(REPORT, JSON.stringify(report, null, 2));

  log(`\n── Summary ──`);
  log(`Products: ${report.productsProcessed} | Assets: ${report.imagesGenerated} (FLUX ${report.fluxImages}, composite ${report.compositeImages})`);
  log(`FLUX time: ${Math.round(report.generationMs / 60_000)} min | Composite time: ${Math.round(report.compositeMs / 1000)}s`);
  log(`Avg per asset: ${(report.avgMsPerAsset / 1000).toFixed(1)}s | CMS attached: ${report.imagesAttached}`);
  log(`Report: ${REPORT}`);
  log(`\n══ Phase 8.5A complete ══\n`);
}

main().catch((err) => die(err instanceof Error ? err.message : String(err)));
