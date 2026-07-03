#!/usr/bin/env node
/** Phase 11.4C — Write docs/PHASE_11_4C_AI_ASSET_MANAGER.md */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const REPORT = join(ROOT, "docs", "PHASE_11_4C_AI_ASSET_MANAGER.md");

const body = `# Phase 11.4C — Intelligent AI Asset Manager & Human Curation

**Status:** COMPLETE

## Objective

Production-grade AI asset workflow: **AI generates candidates → human approves → only approved assets go live.**

No database schema changes. Review state persisted in \`src/lib/brand/asset-reviews.json\`.

## Admin UI

**Route:** [\`/admin/ai-assets\`](/admin/ai-assets) (Catalog → AI Assets)

| Column | Description |
|--------|-------------|
| Preview | Thumbnail + detail modal |
| Category | hero, lifestyle, products, science, … |
| Score | Auto quality score (0–100) |
| Scene | Curated scene slug |
| Product | Product line (packaging shots) |
| Status | Pending / Approved / Rejected / Archived |
| Prompt | Master + scene prompt excerpt |
| Created | File / generation timestamp |

## Status workflow

| Status | Storefront |
|--------|------------|
| **Pending** | Not live — awaits human review |
| **Approved** | Eligible for live assignment |
| **Rejected** | Hidden; kept in \`_rejected/\` or archived |
| **Archived** | Retained for history, not live |

Only **Approved** assets with confirmed slot assignment appear on the storefront (\`generated-assets.ts\`).

## Human review actions

- **Approve / Reject** — single or bulk
- **Replace** — swap live slot assignment to another approved asset
- **Crop** — upload cropped PNG → regenerates WebP/AVIF/blur derivatives
- **Download / Open original** — PNG source
- **Compare** — side-by-side with score dimensions; choose winner
- **View prompt / score / generation meta** — seed, steps, CFG, resolution, FLUX version
- **Assign to slot** — admin confirms mapping to EDITORIAL.* / CONTENT.* / TRUST.* slots

## Auto assign (admin-confirmed)

\`assignApprovedAssetToSlot(assetId, slotKey)\` writes to \`asset-reviews.json → slotAssignments\`.

Auto CLI assign (\`flux-assign.mjs\`) no longer goes live without approval gate.

## Product packaging references

Upload real packaging PNG via admin → stored at:

\`public/images/generated/products/{line}/reference-packaging.png\`

FLUX product prompts reference uploaded packaging — never redraw logos.

## Prompt history

Each review entry stores:

- Master prompt, negative prompt
- Seed, sampler, CFG, steps, resolution, FLUX version, duration

Registered automatically by \`flux-generate.mjs\` via \`review-registry.mjs\`.

## Bulk actions

Approve · Reject · Archive · Assign · Delete · Export selected

## Media library integration

Approved assets surface in:

- AI Assets dashboard → “Approved media library”
- Media Library link with \`?source=generated\`
- Tags: Generated, Editorial, Hero, Lifestyle, Product, Science, Ingredient

## Quality dashboard

- Acceptance rate, average score
- Rejection reason breakdown
- Top / weak prompts
- Slot coverage vs missing scenes

## Key files

| File | Role |
|------|------|
| \`src/app/admin/(protected)/ai-assets/\` | Admin review UI |
| \`src/lib/admin/ai-asset-library.ts\` | List, dashboard, approved resolver |
| \`src/lib/admin/ai-asset-actions.ts\` | Server actions (approve, assign, bulk, packaging) |
| \`src/lib/brand/asset-reviews.json\` | Review + slot assignment manifest |
| \`src/lib/brand/generated-assets.ts\` | Live resolver — approved assignments only |
| \`scripts/assets/lib/review-registry.mjs\` | Generation → pending review registration |
| \`scripts/assets/sync-reviews.mjs\` | Seed pending from existing disk assets |

## npm Commands

\`\`\`bash
npm run assets:reviews:sync     # Seed pending reviews from disk
npm run assets:flux:generate    # New candidates → pending queue
\`\`\`

## Validation

\`\`\`bash
npm run lint && npm run typecheck && npm run test && npm run build
\`\`\`

## Constraints

- No storefront UI changes (resolver gate only)
- No database schema, auth, checkout, payment, shipping, CMS, or business logic changes
- Feature freeze remains active for non-asset areas
`;

mkdirSync(join(ROOT, "docs"), { recursive: true });
writeFileSync(REPORT, body, "utf8");
console.log(`Report written: ${REPORT}`);
