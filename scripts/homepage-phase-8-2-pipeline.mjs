#!/usr/bin/env node
/**
 * Phase 8.2 — Generate, optimize, register and assign homepage assets.
 *
 * Usage:
 *   node scripts/homepage-phase-8-2-pipeline.mjs
 *   node scripts/homepage-phase-8-2-pipeline.mjs --assign-only
 *   node scripts/homepage-phase-8-2-pipeline.mjs --generate-only
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import {
  BRAND_PROMISE_BACKGROUNDS,
  BRAND_PROMISE_ILLUSTRATIONS,
  BRAND_PROMISE_LIFESTYLE,
  CATEGORY_ASSET_TYPES,
  CATEGORY_SLUGS,
  DECORATION_KINDS,
  EMPTY_STATE_KINDS,
  LIFESTYLE_SCENES,
  NEWSLETTER_ASSETS,
  RESEARCH_STEPS,
  SCIENCE_SCENES,
  TESTIMONIAL_THEMES,
  TRUST_BADGES,
  decorationSvg,
  emptyStateSvg,
  generateBestAsset,
  trustBadgeSvg,
} from "./lib/homepage-procedural-gen.mjs";
import {
  PHASE,
  ensureBucket,
  ensureMediaFolder,
  isApprovedUrl,
  loadSupabase,
  optimizePngToWebp,
  publicPath,
  registerMedia,
  saveLocal,
  saveSvg,
  storagePath,
  svgToWebp,
  uploadAsset,
} from "./lib/homepage-asset-lib.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = join(__dirname, "data", "homepage-phase-8-2-manifest.json");
const STAGING = join(ROOT, "public", "images", "generated", "homepage", PHASE);

const args = parseArgs({
  options: {
    "assign-only": { type: "boolean", default: false },
    "generate-only": { type: "boolean", default: false },
  },
});

function log(msg) {
  console.log(msg);
}

function die(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

const MEDIA_FOLDERS = [
  { name: "Homepage", prefix: "phase-8-2" },
  { name: "Brand Promise", prefix: "phase-8-2/brand-promise" },
  { name: "Science", prefix: "phase-8-2/science" },
  { name: "Lifestyle", prefix: "phase-8-2/lifestyle" },
  { name: "Testimonials", prefix: "phase-8-2/testimonials" },
  { name: "Research", prefix: "phase-8-2/research" },
  { name: "Newsletter", prefix: "phase-8-2/newsletter" },
  { name: "Trust", prefix: "phase-8-2/trust" },
  { name: "Decorations", prefix: "phase-8-2/decorations" },
  { name: "Categories", prefix: "phase-8-2/categories" },
  { name: "Empty States", prefix: "phase-8-2/empty-states" },
];

async function processRasterAsset(root, supabase, folderIds, section, slug, pngBuffer, meta = {}) {
  mkdirSync(join(STAGING, section), { recursive: true });
  const pngPath = join(STAGING, section, `${slug}.png`);
  writeFileSync(pngPath, pngBuffer);
  const optimized = await optimizePngToWebp(pngPath);
  const paths = saveLocal(root, section, slug, optimized);
  let remote = null;
  try {
    await ensureBucket(supabase);
    remote = await uploadAsset(supabase, section, slug, optimized);
  } catch (err) {
    log(`  ⚠ Upload ${slug}: ${err instanceof Error ? err.message : err}`);
  }
  const folderId = folderIds[section] ?? folderIds.homepage;
  const url = remote?.url ?? paths.mainRel;
  try {
    await registerMedia(supabase, folderId, {
      path: storagePath(section, slug),
      url,
      sizeBytes: optimized.sizeBytes,
      originalName: `${slug}.webp`,
      alt: meta.alt ?? `${section} ${slug}`,
    });
  } catch (err) {
    log(`  ⚠ Register ${slug}: ${err instanceof Error ? err.message : err}`);
  }
  return {
    section,
    slug,
    url,
    thumbUrl: remote?.thumbUrl ?? paths.thumbRel,
    blurDataUrl: optimized.blurDataUrl,
    width: optimized.width,
    height: optimized.height,
    score: meta.score ?? null,
    tags: meta.tags ?? [section, PHASE],
  };
}

async function processSvgAsset(root, supabase, folderIds, section, slug, svg, meta = {}) {
  saveSvg(root, section, slug, svg);
  const optimized = await svgToWebp(root, section, slug);
  const paths = saveLocal(root, section, slug, optimized);
  let remote = null;
  try {
    await ensureBucket(supabase);
    remote = await uploadAsset(supabase, section, slug, optimized);
  } catch (err) {
    log(`  ⚠ Upload ${slug}: ${err instanceof Error ? err.message : err}`);
  }
  const folderId = folderIds[section] ?? folderIds.homepage;
  const url = remote?.url ?? paths.mainRel;
  const svgRel = `${publicPath(section, slug).replace(".webp", ".svg")}`;
  saveSvg(root, section, slug, svg);
  try {
    await registerMedia(supabase, folderId, {
      path: storagePath(section, slug),
      url,
      sizeBytes: optimized.sizeBytes,
      originalName: `${slug}.webp`,
      alt: meta.alt ?? slug,
      mimeType: "image/webp",
    });
  } catch (err) {
    log(`  ⚠ Register ${slug}: ${err instanceof Error ? err.message : err}`);
  }
  return { section, slug, url, svgUrl: svgRel, tags: meta.tags ?? [section, PHASE] };
}

async function generateAllAssets(root, supabase, folderIds) {
  const assets = [];
  log("\n── Brand Promise (36) ──");
  for (const item of BRAND_PROMISE_ILLUSTRATIONS) {
    const best = await generateBestAsset({
      slug: item.slug,
      type: "illustration",
      style: "illustration",
      width: 1024,
      height: 768,
      emotionBoost: 5,
    });
    assets.push(
      await processRasterAsset(root, supabase, folderIds, "brand-promise", item.slug, best.buffer, {
        alt: `Brand promise illustration: ${item.theme}`,
        score: best.score,
        tags: ["brand-promise", "illustration", PHASE],
      }),
    );
    log(`  ✓ ${item.slug} (${best.score})`);
  }
  for (const item of BRAND_PROMISE_LIFESTYLE) {
    const best = await generateBestAsset({
      slug: item.slug,
      type: "lifestyle",
      style: "lifestyle",
      width: 1200,
      height: 900,
      emotionBoost: 8,
    });
    assets.push(
      await processRasterAsset(root, supabase, folderIds, "brand-promise", item.slug, best.buffer, {
        alt: `Brand promise lifestyle: ${item.theme}`,
        score: best.score,
        tags: ["brand-promise", "lifestyle", PHASE],
      }),
    );
    log(`  ✓ ${item.slug} (${best.score})`);
  }
  for (const item of BRAND_PROMISE_BACKGROUNDS) {
    const best = await generateBestAsset({
      slug: item.slug,
      type: "background",
      style: "background",
      width: 1920,
      height: 1080,
    });
    assets.push(
      await processRasterAsset(root, supabase, folderIds, "brand-promise", item.slug, best.buffer, {
        alt: `Brand promise background ${item.slug}`,
        score: best.score,
        tags: ["brand-promise", "background", PHASE],
      }),
    );
    log(`  ✓ ${item.slug} (${best.score})`);
  }

  log("\n── Science (20) ──");
  for (let i = 0; i < 20; i++) {
    const slug = `science-${String(i + 1).padStart(2, "0")}`;
    const best = await generateBestAsset({
      slug,
      type: "science",
      style: "science",
      width: 1024,
      height: 1280,
      emotionBoost: 4,
    });
    assets.push(
      await processRasterAsset(root, supabase, folderIds, "science", slug, best.buffer, {
        alt: SCIENCE_SCENES[i],
        score: best.score,
        tags: ["science", PHASE],
      }),
    );
    log(`  ✓ ${slug} (${best.score})`);
  }

  log("\n── Lifestyle (20) ──");
  for (let i = 0; i < 20; i++) {
    const slug = `lifestyle-${String(i + 1).padStart(2, "0")}`;
    const best = await generateBestAsset({
      slug,
      type: "lifestyle",
      style: "lifestyle",
      width: 1280,
      height: 960,
      emotionBoost: 10,
    });
    assets.push(
      await processRasterAsset(root, supabase, folderIds, "lifestyle", slug, best.buffer, {
        alt: LIFESTYLE_SCENES[i],
        score: best.score,
        tags: ["lifestyle", PHASE],
      }),
    );
    log(`  ✓ ${slug} (${best.score})`);
  }

  log("\n── Categories (60) ──");
  for (const cat of CATEGORY_SLUGS) {
    for (const assetType of CATEGORY_ASSET_TYPES) {
      const slug = `${cat.slug}-${assetType.key}`;
      const best = await generateBestAsset({
        slug,
        type: "category",
        style: assetType.style,
        width: assetType.w,
        height: assetType.h,
        emotionBoost: 3,
      });
      assets.push(
        await processRasterAsset(root, supabase, folderIds, "categories", slug, best.buffer, {
          alt: `${cat.name} ${assetType.key}`,
          score: best.score,
          tags: ["categories", cat.slug, assetType.key, PHASE],
        }),
      );
      log(`  ✓ ${slug} (${best.score})`);
    }
  }

  log("\n── Testimonials (15) ──");
  for (let i = 0; i < 15; i++) {
    const slug = `portrait-${String(i + 1).padStart(2, "0")}`;
    const best = await generateBestAsset({
      slug,
      type: "portrait",
      style: "portrait",
      width: 512,
      height: 512,
      emotionBoost: 12,
    });
    assets.push(
      await processRasterAsset(root, supabase, folderIds, "testimonials", slug, best.buffer, {
        alt: TESTIMONIAL_THEMES[i],
        score: best.score,
        tags: ["testimonials", "portrait", PHASE],
      }),
    );
    log(`  ✓ ${slug} (${best.score})`);
  }

  log("\n── Research Timeline (10) ──");
  for (let i = 0; i < RESEARCH_STEPS.length; i++) {
    const slug = `research-${String(i + 1).padStart(2, "0")}`;
    const best = await generateBestAsset({
      slug,
      type: "research",
      style: "science",
      width: 800,
      height: 600,
      emotionBoost: 2,
    });
    assets.push(
      await processRasterAsset(root, supabase, folderIds, "research", slug, best.buffer, {
        alt: RESEARCH_STEPS[i],
        score: best.score,
        tags: ["research", PHASE],
      }),
    );
    log(`  ✓ ${slug} — ${RESEARCH_STEPS[i]} (${best.score})`);
  }

  log("\n── Newsletter (3) ──");
  for (const item of NEWSLETTER_ASSETS) {
    const best = await generateBestAsset({
      slug: item.slug,
      type: "newsletter",
      style: "lifestyle",
      width: 1024,
      height: 1024,
      emotionBoost: 6,
    });
    assets.push(
      await processRasterAsset(root, supabase, folderIds, "newsletter", item.slug, best.buffer, {
        alt: item.theme,
        score: best.score,
        tags: ["newsletter", PHASE],
      }),
    );
    log(`  ✓ ${item.slug} (${best.score})`);
  }

  log("\n── Decorations (10) ──");
  for (let i = 0; i < DECORATION_KINDS.length; i++) {
    const kind = DECORATION_KINDS[i];
    const slug = `deco-${kind}-${String(i + 1).padStart(2, "0")}`;
    const svg = decorationSvg(kind, i * 17);
    assets.push(
      await processSvgAsset(root, supabase, folderIds, "decorations", slug, svg, {
        alt: `Homepage decoration ${kind}`,
        tags: ["decorations", kind, PHASE],
      }),
    );
    log(`  ✓ ${slug}`);
  }

  log("\n── Trust Badges (10 SVG) ──");
  for (let i = 0; i < TRUST_BADGES.length; i++) {
    const label = TRUST_BADGES[i];
    const slug = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const svg = trustBadgeSvg(label);
    saveSvg(root, "trust", slug, svg);
    assets.push({
      section: "trust",
      slug,
      url: `/images/homepage/${PHASE}/trust/${slug}.svg`,
      svgUrl: `/images/homepage/${PHASE}/trust/${slug}.svg`,
      tags: ["trust", "badge", PHASE],
      label,
    });
    try {
      await registerMedia(supabase, folderIds.trust, {
        path: `${PHASE}/trust/${slug}.svg`,
        url: `/images/homepage/${PHASE}/trust/${slug}.svg`,
        sizeBytes: Buffer.byteLength(svg),
        originalName: `${slug}.svg`,
        alt: label,
        mimeType: "image/svg+xml",
      });
    } catch (err) {
      log(`  ⚠ Register badge ${slug}: ${err instanceof Error ? err.message : err}`);
    }
    log(`  ✓ ${slug}`);
  }

  log("\n── Empty States (6) ──");
  for (const kind of EMPTY_STATE_KINDS) {
    const slug = `empty-${kind}`;
    const svg = emptyStateSvg(kind);
    assets.push(
      await processSvgAsset(root, supabase, folderIds, "empty-states", slug, svg, {
        alt: `Empty state: ${kind}`,
        tags: ["empty-states", kind, PHASE],
      }),
    );
    log(`  ✓ ${slug}`);
  }

  return assets;
}

function assetUrl(assets, section, slug) {
  return assets.find((a) => a.section === section && a.slug === slug)?.url ?? null;
}

function topScored(assets, section, prefix, count = 1) {
  return assets
    .filter((a) => a.section === section && a.slug.startsWith(prefix))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, count);
}

async function getSectionConfig(supabase, key) {
  const { data } = await supabase
    .from("homepage_sections")
    .select("id, config")
    .eq("key", key)
    .maybeSingle();
  return data;
}

async function upsertSectionConfig(supabase, key, config) {
  const existing = await getSectionConfig(supabase, key);
  if (existing?.id) {
    await supabase
      .from("homepage_sections")
      .update({ config, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    return existing.id;
  }
  const { data } = await supabase
    .from("homepage_sections")
    .insert({ key, config, is_enabled: true })
    .select("id")
    .single();
  return data?.id;
}

async function assignCms(supabase, assets) {
  log("\n══ CMS Assignment ══\n");
  const report = { assigned: [], skipped: [], categories: [], testimonials: [] };

  const brandIllustrations = assets.filter(
    (a) => a.section === "brand-promise" && a.slug.startsWith("illustration-"),
  );
  const brandLifestyle = assets.filter(
    (a) => a.section === "brand-promise" && a.slug.startsWith("lifestyle-"),
  );
  const brandBackgrounds = assets.filter(
    (a) => a.section === "brand-promise" && a.slug.startsWith("background-"),
  );

  const brandExisting = (await getSectionConfig(supabase, "brand_promise"))?.config ?? {};
  const brandCards = (brandExisting.cards?.length ? brandExisting.cards : [
    { title: "Research", description: "Every ingredient selected after extensive research." },
    { title: "Safety", description: "Dermatologically tested with gentle ingredients." },
    { title: "Love", description: "Designed by parents, inspired by babies." },
  ]).map((card, i) => ({
    ...card,
    imageUrl: isApprovedUrl(card.imageUrl)
      ? card.imageUrl
      : brandIllustrations[i]?.url ?? card.imageUrl ?? "",
  }));

  const brandConfig = {
    ...brandExisting,
    heading: brandExisting.heading || "Every Product Begins\nWith Research, Safety & Love",
    description:
      brandExisting.description ||
      "Every BeyondBabyCo formulation is created with one goal — giving parents complete confidence.",
    backgroundUrl: isApprovedUrl(brandExisting.backgroundUrl)
      ? brandExisting.backgroundUrl
      : brandBackgrounds[0]?.url ?? "",
    galleryImages: brandBackgrounds.map((a) => a.url),
    cards: brandCards,
    lifestyleImages: brandLifestyle.map((a) => a.url),
  };
  await upsertSectionConfig(supabase, "brand_promise", brandConfig);
  report.assigned.push("brand_promise");

  const scienceExisting = (await getSectionConfig(supabase, "science"))?.config ?? {};
  const bestScience = topScored(assets, "science", "science-", 1)[0];
  const scienceConfig = {
    ...scienceExisting,
    heading: scienceExisting.heading || "Gentle Ingredients.\nPowerful Research.",
    description:
      scienceExisting.description ||
      "Every BeyondBabyCo product is thoughtfully formulated using carefully selected ingredients.",
    imageUrl: isApprovedUrl(scienceExisting.imageUrl)
      ? scienceExisting.imageUrl
      : bestScience?.url ?? "",
    galleryImages: assets.filter((a) => a.section === "science").map((a) => a.url),
  };
  await upsertSectionConfig(supabase, "science", scienceConfig);
  report.assigned.push("science");

  const lifestyleExisting = (await getSectionConfig(supabase, "lifestyle"))?.config ?? {};
  const bestLifestyle = topScored(assets, "lifestyle", "lifestyle-", 1)[0];
  const lifestyleCards = (lifestyleExisting.cards?.length ? lifestyleExisting.cards : [
    { title: "Gentle Ingredients", description: "Carefully selected for delicate baby skin." },
    { title: "Trusted Safety", description: "Dermatologically tested and formulated with care." },
    { title: "Everyday Comfort", description: "Made for the little moments families cherish." },
  ]).map((card, i) => ({
    ...card,
    imageUrl: isApprovedUrl(card.imageUrl)
      ? card.imageUrl
      : assets.filter((a) => a.section === "lifestyle")[i + 1]?.url ?? card.imageUrl ?? "",
  }));
  const lifestyleConfig = {
    ...lifestyleExisting,
    heading: lifestyleExisting.heading || "Moments of Love,\nMade Safer Every Day",
    description:
      lifestyleExisting.description ||
      "From diaper changes to bath time, every BeyondBabyCo product is thoughtfully designed.",
    imageUrl: isApprovedUrl(lifestyleExisting.imageUrl)
      ? lifestyleExisting.imageUrl
      : bestLifestyle?.url ?? "",
    cards: lifestyleCards,
    galleryImages: assets.filter((a) => a.section === "lifestyle").map((a) => a.url),
  };
  await upsertSectionConfig(supabase, "lifestyle", lifestyleConfig);
  report.assigned.push("lifestyle");

  const researchExisting = (await getSectionConfig(supabase, "research_timeline"))?.config ?? {};
  const defaultEntries = [
    { year: "2021", title: "Research Begins", description: "Initial ingredient research and safety studies." },
    { year: "2022", title: "Formulation", description: "Developing gentle, effective baby care formulas." },
    { year: "2023", title: "Clinical Testing", description: "Dermatological testing with pediatric oversight." },
    { year: "2024", title: "Certification", description: "Quality certifications and safety verification." },
    { year: "2025", title: "Production", description: "GMP manufacturing with natural ingredients." },
    { year: "2026", title: "Launch", description: "BeyondBabyCo arrives for Indian families." },
  ];
  const researchAssets = assets.filter((a) => a.section === "research");
  const entries = (researchExisting.entries?.length ? researchExisting.entries : defaultEntries).map(
    (entry, i) => ({
      ...entry,
      imageUrl: isApprovedUrl(entry.imageUrl)
        ? entry.imageUrl
        : researchAssets[i]?.url ?? entry.imageUrl ?? "",
    }),
  );
  await upsertSectionConfig(supabase, "research_timeline", {
    ...researchExisting,
    heading: researchExisting.heading || "5 Years of\nResearch Before Launch",
    entries,
  });
  report.assigned.push("research_timeline");

  const newsletterExisting = (await getSectionConfig(supabase, "newsletter"))?.config ?? {};
  const newsletterMain = assetUrl(assets, "newsletter", "newsletter-main");
  await upsertSectionConfig(supabase, "newsletter", {
    ...newsletterExisting,
    heading: newsletterExisting.heading || "Stay Connected\nWith BeyondBabyCo",
    description:
      newsletterExisting.description ||
      "Be the first to discover new launches, parenting tips, and exclusive offers.",
    buttonText: newsletterExisting.buttonText || "Subscribe",
    imageUrl: isApprovedUrl(newsletterExisting.imageUrl)
      ? newsletterExisting.imageUrl
      : newsletterMain ?? "",
    artworkUrl: assetUrl(assets, "newsletter", "newsletter-baby") ?? "",
  });
  report.assigned.push("newsletter");

  const portraits = assets.filter((a) => a.section === "testimonials");
  const { data: testimonialRows } = await supabase
    .from("testimonials")
    .select("id, avatar_url, position")
    .order("position", { ascending: true });

  if (testimonialRows?.length) {
    for (let i = 0; i < testimonialRows.length; i++) {
      const row = testimonialRows[i];
      const portrait = portraits[i];
      if (!portrait) break;
      if (isApprovedUrl(row.avatar_url)) {
        report.skipped.push(`testimonial ${row.id} (approved avatar)`);
        continue;
      }
      await supabase
        .from("testimonials")
        .update({ avatar_url: portrait.url, updated_at: new Date().toISOString() })
        .eq("id", row.id);
      report.testimonials.push({ id: row.id, url: portrait.url });
    }
  } else {
    log("  ⚠ No testimonials rows — avatars stored in manifest for manual seed");
  }

  for (const cat of CATEGORY_SLUGS) {
    const slug = cat.slug;
    const heroBanner = assetUrl(assets, "categories", `${slug}-hero-banner`);
    const desktopBanner = assetUrl(assets, "categories", `${slug}-desktop-banner`);
    const mobileBanner = assetUrl(assets, "categories", `${slug}-mobile-banner`);
    const card = assetUrl(assets, "categories", `${slug}-category-card`);
    const thumb = assetUrl(assets, "categories", `${slug}-category-thumbnail`);
    const icon = assetUrl(assets, "categories", `${slug}-transparent-illustration`);

    const { data: existing } = await supabase
      .from("categories")
      .select("id, banner_url, image_url, icon_url")
      .eq("slug", slug)
      .maybeSingle();

    const updates = {};
    if (existing) {
      if (!isApprovedUrl(existing.banner_url) && (heroBanner || desktopBanner)) {
        updates.banner_url = heroBanner ?? desktopBanner;
      }
      if (!isApprovedUrl(existing.image_url) && card) updates.image_url = card;
      if (!isApprovedUrl(existing.icon_url) && icon) updates.icon_url = icon;
      if (Object.keys(updates).length) {
        await supabase.from("categories").update(updates).eq("id", existing.id);
        report.categories.push({ slug, id: existing.id, ...updates, mobileBanner, thumb });
      }
    } else {
      log(`  ⚠ Category not in DB: ${slug} (assets generated)`);
      report.categories.push({ slug, generated: true, heroBanner, card, icon });
    }
  }

  const catIds = [];
  for (const cat of CATEGORY_SLUGS) {
    const { data } = await supabase.from("categories").select("id").eq("slug", cat.slug).maybeSingle();
    if (data?.id) catIds.push(data.id);
  }
  if (catIds.length) {
    const fcExisting = (await getSectionConfig(supabase, "featured_categories"))?.config ?? {};
    await upsertSectionConfig(supabase, "featured_categories", {
      ...fcExisting,
      heading: fcExisting.heading || "Shop by Category",
      limit: Math.max(fcExisting.limit ?? 6, catIds.length),
      categoryIds: fcExisting.categoryIds?.length ? fcExisting.categoryIds : catIds,
    });
    report.assigned.push("featured_categories");
  } else {
    const fcExisting = (await getSectionConfig(supabase, "featured_categories"))?.config ?? {};
    const categoryAssets = CATEGORY_SLUGS.map((cat, index) => {
      const slug = cat.slug;
      const colors = ["green", "terra", "cream", "green"];
      return {
        slug,
        title: cat.name,
        count: "Explore collection",
        iconUrl: assetUrl(assets, "categories", `${slug}-transparent-illustration`) ?? "",
        imageUrl: assetUrl(assets, "categories", `${slug}-category-card`) ?? "",
        color: colors[index % colors.length],
      };
    });
    await upsertSectionConfig(supabase, "featured_categories", {
      ...fcExisting,
      heading: fcExisting.heading || "Shop by Category",
      limit: 10,
      categoryIds: [],
      categoryAssets,
    });
    report.assigned.push("featured_categories");
  }

  return report;
}

async function loadManifestAssets() {
  if (!existsSync(MANIFEST_PATH)) return null;
  const data = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  return data.assets ?? [];
}

async function main() {
  const { supabase } = loadSupabase(ROOT);
  log("\n══ Phase 8.2 — Homepage Asset Pipeline ══\n");

  const folderIds = { homepage: null };
  for (const f of MEDIA_FOLDERS) {
    const key = f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    try {
      folderIds[key] = await ensureMediaFolder(supabase, f.name, f.prefix);
      log(`✓ Media folder: ${f.name}`);
    } catch (err) {
      log(`⚠ Folder ${f.name}: ${err instanceof Error ? err.message : err}`);
    }
  }
  folderIds["brand-promise"] = folderIds["brand-promise"] ?? folderIds.homepage;
  folderIds["empty-states"] = folderIds["empty-states"] ?? folderIds.homepage;

  let assets = [];
  if (!args.values["assign-only"]) {
    assets = await generateAllAssets(ROOT, supabase, folderIds);
    mkdirSync(join(__dirname, "data"), { recursive: true });
    writeFileSync(
      MANIFEST_PATH,
      JSON.stringify(
        {
          version: "8.2",
          updatedAt: new Date().toISOString(),
          assetCount: assets.length,
          assets,
        },
        null,
        2,
      ),
    );
    log(`\n✓ Manifest saved (${assets.length} assets)`);
  } else {
    assets = (await loadManifestAssets()) ?? [];
    if (!assets.length) die("No manifest found — run without --assign-only first");
  }

  if (!args.values["generate-only"]) {
    const report = await assignCms(supabase, assets);
    writeFileSync(
      join(__dirname, "data", "homepage-phase-8-2-report.json"),
      JSON.stringify({ updatedAt: new Date().toISOString(), assetCount: assets.length, ...report }, null, 2),
    );
    log(`\n── CMS: ${report.assigned.length} sections, ${report.testimonials.length} avatars, ${report.categories.length} categories ──`);
  }

  log("\n══ Phase 8.2 complete ══\n");
}

main().catch((err) => die(err instanceof Error ? err.message : String(err)));
