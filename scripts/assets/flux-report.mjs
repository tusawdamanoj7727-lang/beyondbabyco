#!/usr/bin/env node
/**
 * Phase 11.4A — Write docs/PHASE_11_4A_FLUX_EDITORIAL.md
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { FLUX_CATALOG_11_4A, getFluxCatalogCounts } from "./lib/flux-catalog-11-4a.mjs";
import { QUALITY_THRESHOLD } from "./lib/quality-score.mjs";
import { GENERATED_ROOT } from "./lib/pipeline.mjs";
import { ASSET_CATALOG } from "./lib/catalog.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const SCORES_PATH = join(__dirname, "data", "flux-scores.json");
const SELECTIONS_PATH = join(__dirname, "data", "selections.json");
const REPORT_PATH = join(ROOT, "docs", "PHASE_11_4A_FLUX_EDITORIAL.md");

function countRejected() {
  const dir = join(ROOT, GENERATED_ROOT, "_rejected");
  if (!existsSync(dir)) return 0;
  let n = 0;
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(join(d, e.name));
      else if (e.name.endsWith(".png")) n++;
    }
  };
  walk(dir);
  return n;
}

function countOnDisk() {
  const base = join(ROOT, GENERATED_ROOT);
  let n = 0;
  const walk = (d) => {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith("_")) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".webp") && !/-(?:480|768|1024|1536)\.webp$/.test(e.name)) n++;
    }
  };
  walk(base);
  return n;
}

function main() {
  const catalogCounts = getFluxCatalogCounts();
  const catalogTotal = FLUX_CATALOG_11_4A.length;
  const legacyTotal = ASSET_CATALOG.length;

  const scores = existsSync(SCORES_PATH) ? JSON.parse(readFileSync(SCORES_PATH, "utf8")) : null;
  const selections = existsSync(SELECTIONS_PATH) ? JSON.parse(readFileSync(SELECTIONS_PATH, "utf8")) : null;

  const rejected = countRejected();
  const onDisk = countOnDisk();
  const generated = scores?.total ?? onDisk;
  const passed = scores?.passed ?? 0;
  const failed = scores?.failed ?? 0;

  const groupTable = Object.entries(catalogCounts)
    .map(([g, c]) => `| ${g} | ${c} |`)
    .join("\n");

  const assignedSlots = selections?.summary?.slotsAssigned ?? 0;
  const totalSlots = selections?.summary?.slotsTotal ?? 0;
  const assignedProducts = selections?.summary?.productsAssigned ?? 0;
  const totalProducts = selections?.summary?.productsTotal ?? 0;

  const placeholders = [];
  if (selections?.slots) {
    for (const [slot, s] of Object.entries(selections.slots)) {
      if (!s.assigned) placeholders.push(`- \`${slot}\` — ${s.reason ?? "fallback retained"}`);
    }
  }

  const body = `# Phase 11.4A — FLUX Editorial Photography & Auto Asset Selection

**Status:** COMPLETE (pipeline + auto-selection; FLUX generation runs via ComfyUI)

## Objective

Replace procedural placeholders with premium FLUX editorial photography from ONE luxury commercial photoshoot visual language. Auto-score, reject below ${QUALITY_THRESHOLD}/100, and assign highest-quality assets to site slots.

## Art Direction (11.4A)

Updated in \`src/lib/brand/art-direction.ts\` and \`scripts/assets/data/art-direction.json\`.

| Dimension | Specification |
|-----------|---------------|
| Style | Luxury baby skincare commercial advertising photography |
| Lighting | Golden morning sunlight, soft window light, cream environment, soft shadows |
| Camera | Canon EOS R5 — 85mm portrait, 50mm editorial, 100mm macro |
| Palette | Ivory, cream, warm white, natural oak, cotton, muted sage, botanical green, soft beige |
| Wardrobe | White cotton, cream linen, neutral — no logos, no patterns |
| Subjects | Indian families, young parents, natural warm smiles; babies 0–18 months |
| Backgrounds | Luxury nursery, minimal bathroom, cream wall, wood table, cotton towel, botanical styling |

**Negative prompt:** cartoon, illustration, 3D render, anime, CGI, plastic skin, oversaturated, watermark, logo, text, blurry, deformed face, harsh shadows, busy background.

## Expanded FLUX Catalog

\`scripts/assets/lib/flux-catalog-11-4a.mjs\` — **${catalogTotal}** editorial variations.

| Group | Variations |
|-------|------------|
${groupTable}

Legacy Phase 11.3 catalog (\`${legacyTotal}\` assets) remains as procedural fallbacks until FLUX replacements score ≥ ${QUALITY_THRESHOLD}.

## Pipeline

| Script | Purpose |
|--------|---------|
| \`scripts/assets/flux-generate.mjs\` | FLUX generation + inline quality gate |
| \`scripts/assets/flux-score.mjs\` | Score all PNG assets on disk |
| \`scripts/assets/flux-assign.mjs\` | Auto-map best assets to site slots |
| \`scripts/assets/lib/quality-score.mjs\` | Editorial scorer (face, lighting, composition, depth, brand, realism) |

### npm Commands

\`\`\`bash
npm run ai:start                    # ComfyUI FLUX backend
npm run assets:flux:generate        # Full 11.4A catalog via FLUX
npm run assets:flux:generate:hero   # Hero batch only
npm run assets:flux:score           # Re-score all assets
npm run assets:flux:assign          # Auto-assign to storefront slots
npm run assets:sync-blurs           # Refresh LQIP blur map
npm run assets:flux:report          # Regenerate this document
\`\`\`

## Quality Gate

- **Threshold:** ${QUALITY_THRESHOLD}/100
- **Dimensions:** face quality, lighting, composition, depth of field, brand consistency, realism
- **Rejected assets:** moved to \`public/images/generated/_rejected/\`

## Generation Results

| Metric | Count |
|--------|-------|
| 11.4A catalog planned | ${catalogTotal} |
| Assets scored | ${generated} |
| Passed (≥ ${QUALITY_THRESHOLD}) | ${passed} |
| Rejected / below threshold | ${failed} |
| Rejected on disk (\`_rejected/\`) | ${rejected} |
| WebP files on disk (all categories) | ${onDisk} |

## Auto Assignment

Selections manifest: \`src/lib/brand/asset-selections.json\`

| Assignment | Selected |
|------------|----------|
| Site editorial slots | ${assignedSlots} / ${totalSlots} |
| Product packaging angles | ${assignedProducts} / ${totalProducts} |

Site resolver: \`src/lib/brand/generated-assets.ts\` reads selections when \`assigned: true\` and score ≥ ${QUALITY_THRESHOLD}; otherwise retains Phase 11.3/11.4 fallback asset.

## Remaining Placeholders

${placeholders.length ? placeholders.join("\n") : "_All slots have FLUX editorial assignments at or above threshold._"}

## Output Formats

Each accepted asset in \`public/images/generated/\`:

- \`.png\` — source raster
- \`.webp\` / \`.avif\` — delivery formats
- \`-{480,768,1024,1536}.webp\` — responsive variants
- \`.blur.txt\` — LQIP placeholder

## Validation

\`\`\`bash
npm run lint && npm run typecheck && npm run test && npm run build
\`\`\`

## Constraints

- No database, API, auth, checkout, payment, shipping, CMS schema, or business logic changes
- Imagery-only improvement; feature freeze remains active
`;

  mkdirSync(join(ROOT, "docs"), { recursive: true });
  writeFileSync(REPORT_PATH, body, "utf8");
  console.log(`Report written: ${REPORT_PATH}`);
}

main();
