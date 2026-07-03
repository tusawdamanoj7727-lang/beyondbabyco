#!/usr/bin/env node
/**
 * Phase 11.3 — Write docs/PHASE_11_3_AI_ASSET_STUDIO.md from manifest + catalog.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ASSET_CATALOG, getAssetCounts, NPM_CATEGORY_MAP, ASSET_CATEGORIES } from "./lib/catalog.mjs";
import { GENERATED_ROOT } from "./lib/pipeline.mjs";

const PROMPT_TEMPLATE_IDS = [
  "hero",
  "lifestyle",
  "research",
  "science",
  "product",
  "macro-ingredient",
  "newsletter",
  "timeline",
  "category",
  "trust",
  "marketing",
  "decorative",
  "background",
];

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const MANIFEST_PATH = join(__dirname, "data", "manifest.json");
const REPORT_PATH = join(ROOT, "docs", "PHASE_11_3_AI_ASSET_STUDIO.md");

function countWebpInDir(dir) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) n += countWebpInDir(p);
    else if (entry.name.endsWith(".webp") && !/-(?:480|768|1024|1536)\.webp$/.test(entry.name)) n++;
  }
  return n;
}

function countFilesOnDisk() {
  const counts = {};
  let total = 0;
  for (const cat of ASSET_CATEGORIES) {
    const dir = join(ROOT, GENERATED_ROOT, cat);
    counts[cat] = countWebpInDir(dir);
    total += counts[cat];
  }
  return { counts, total };
}

function main() {
  const catalogCounts = getAssetCounts();
  const catalogTotal = ASSET_CATALOG.length;
  const disk = countFilesOnDisk();

  let manifest = null;
  if (existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  }

  const generatedTotal = manifest?.generatedTotal ?? disk.total;
  const coveragePct = Math.round((generatedTotal / catalogTotal) * 100);

  const templateList = PROMPT_TEMPLATE_IDS.map((id) => `- **${id}** — reusable FLUX master template`).join("\n");

  const npmCommands = Object.keys(NPM_CATEGORY_MAP)
    .map((c) => `- \`npm run assets:${c}\``)
    .concat(["- `npm run assets:all` — full catalog (procedural)", "- `npm run assets:all:flux` — full catalog via ComfyUI FLUX"])
    .join("\n");

  const categoryTable = ASSET_CATEGORIES.map((cat) => {
    const planned = catalogCounts[cat] ?? 0;
    const onDisk = disk.counts[cat] ?? 0;
    return `| ${cat} | ${planned} | ${onDisk} | ${planned ? Math.round((onDisk / planned) * 100) : 0}% |`;
  }).join("\n");

  const body = `# Phase 11.3 — AI Asset Studio & Editorial Photography System

**Status:** COMPLETE (studio built; website wiring deferred to Phase 11.4)

## Objective

One unified AI-powered visual identity for BeyondBabyCo. Every generated image follows a single commercial photoshoot art direction — not random AI output.

## Art Direction

Defined in \`src/lib/brand/art-direction.ts\`.

| Dimension | Specification |
|-----------|---------------|
| Lighting | Soft natural daylight; golden morning light; luxury editorial warm white; premium commercial |
| Palette | Ivory, cream, warm white, soft sage, muted eucalyptus, natural wood, cotton, linen |
| Camera | Canon EOS R5; 85mm, 50mm, 100mm macro; shallow DOF |
| Wardrobe | Neutral white, warm beige, soft oatmeal, cotton cream, minimal linen |
| Subjects | Indian families, natural expressions, quiet tenderness — no exaggerated smiles, no studio posing |
| Backgrounds | Minimal nursery; luxury bathroom; wood table; cotton towel; cream wall; botanical; premium home |

## Master Prompt Templates

Defined in \`src/lib/brand/prompt-templates.ts\`.

${templateList}

## Image Catalog

Defined in \`src/lib/brand/asset-catalog.ts\`.

**Catalog total:** ${catalogTotal} planned assets across ${ASSET_CATEGORIES.length} categories.

### Category coverage

| Category | Catalog | Generated (WebP on disk) | Coverage |
|----------|---------|--------------------------|----------|
${categoryTable}
| **Total** | **${catalogTotal}** | **${disk.total}** | **${coveragePct}%** |

## Folder Structure

\`\`\`
public/images/generated/
${ASSET_CATEGORIES.map((c) => `  ${c}/`).join("\n")}
\`\`\`

Each asset produces:

- \`.png\` — source raster
- \`.webp\` — primary delivery format
- \`.avif\` — modern format (when supported)
- \`-{480,768,1024,1536}.webp\` — responsive variants
- \`.blur.txt\` — LQIP blur data URL

## npm Commands

${npmCommands}

Generator: \`scripts/assets/generate.mjs\`

\`\`\`bash
# Procedural (instant, brand-consistent placeholders)
npm run assets:hero

# FLUX editorial (requires ComfyUI: npm run ai:start)
node --experimental-strip-types scripts/assets/generate.mjs --category hero --flux
\`\`\`

## Product Editorial Renders

Product lines: Baby Wipes, Baby Wash, Baby Lotion, Baby Shampoo, Baby Oil, Baby Powder, Gift Box, Newborn Kit, Men Care, Women Care.

Angles per line: front, front-45°, back, top, lifestyle, packaging closeup, transparent PNG, white background.

## Lifestyle, Science & Decorative

- **Lifestyle:** diaper change, bath time, lotion application, sleeping baby, nursery, morning routine, father holding baby, family, organic ingredients, premium home
- **Science:** scientist, dermatologist, microscope, lab, testing, ingredient research; ingredient macros (calendula, oat, chamomile, aloe)
- **Decorative:** botanical illustrations, leaf overlays, organic blobs, glass reflections, water ripples, cotton/cream textures, noise, shadows, gradients

## Manifest

Runtime manifest: \`scripts/assets/data/manifest.json\`

${manifest ? `Last generation: ${manifest.generatedAt}` : "_No manifest yet — run `npm run assets:all`._"}

## Estimated Coverage

- **Studio infrastructure:** 100% (art direction, catalog, prompts, pipeline, npm scripts)
- **Asset generation (this run):** ${coveragePct}% of catalog (${disk.total}/${catalogTotal} WebP files on disk)
- **Website integration:** 0% (Phase 11.4)

## Remaining Photography

For Phase 11.4 website replacement, prioritize:

1. Homepage hero (\`hero/gentle-care-hero\`, \`hero/science-backed-hero\`)
2. Featured product packaging (\`products/*/front\`, \`products/*/white-background\`)
3. Lifestyle trust moments (\`lifestyle/family\`, \`lifestyle/applying-lotion\`)
4. Science page (\`science/*\`, \`research/*\`)
5. Category banners (\`categories/*\`)
6. Newsletter & marketing banners

Re-run with \`--flux\` when ComfyUI is available for photoreal editorial output. Procedural assets are brand-consistent placeholders until FLUX generation completes.

## Constraints (Phase 11.3)

- No database, checkout, payment, shipping, auth, CMS, or API changes
- No live website image replacement (Phase 11.4)
- Feature freeze remains active
`;

  mkdirSync(join(ROOT, "docs"), { recursive: true });
  writeFileSync(REPORT_PATH, body, "utf8");
  console.log(`Report written: ${REPORT_PATH}`);
}

main();
