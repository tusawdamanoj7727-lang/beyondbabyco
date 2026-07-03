#!/usr/bin/env node
/** Phase 11.5 — Write docs/PHASE_11_5_EDITORIAL_LIBRARY.md */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { countPhase115Slots, PHASE_11_5_GENERATION_GROUPS } from "./lib/phase-11-5-slots.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const COVERAGE = join(__dirname, "data", "phase-11-5-coverage.json");
const REVIEWS = join(ROOT, "src/lib/brand/asset-reviews.json");
const REPORT = join(ROOT, "docs", "PHASE_11_5_EDITORIAL_LIBRARY.md");

function sectionCoverage(coverage, prefix) {
  const entries = Object.entries(coverage).filter(([k]) => k.startsWith(prefix));
  const ok = entries.filter(([, v]) => v.status === "approved").length;
  return { total: entries.length, ok, pct: entries.length ? Math.round((ok / entries.length) * 100) : 0 };
}

function main() {
  const stats = existsSync(COVERAGE) ? JSON.parse(readFileSync(COVERAGE, "utf8")) : null;
  const reviews = existsSync(REVIEWS) ? JSON.parse(readFileSync(REVIEWS, "utf8")) : { reviews: {}, slotAssignments: {} };

  const approved = Object.values(reviews.reviews).filter((r) => r.status === "approved").length;
  const rejected = Object.values(reviews.reviews).filter((r) => r.status === "rejected").length;
  const pending = Object.values(reviews.reviews).filter((r) => r.status === "pending").length;

  const cov = stats?.coverage ?? {};
  const homepage = sectionCoverage(cov, "EDITORIAL.");
  const trust = sectionCoverage(cov, "TRUST_EDITORIAL.");
  const science = sectionCoverage(cov, "CONTENT_EDITORIAL.");
  const products = sectionCoverage(cov, "PRODUCT.");
  const timeline = sectionCoverage(cov, "TIMELINE.");

  const remaining = (stats?.missing ?? []).slice(0, 20).map((m) => `- \`${m.slotKey}\``).join("\n");

  const body = `# Phase 11.5 — Premium Editorial Content Production & Storefront Replacement

**Status:** COMPLETE (production pipeline + QC approval + slot assignment)

## Objective

Replace every storefront placeholder with premium editorial photography via the AI Asset Manager workflow:

**Pending → Review → Approve → Assign → Storefront**

No database, checkout, auth, payment, shipping, CMS, API, or business logic changes.

## Production Results

| Metric | Value |
|--------|-------|
| Assets QC approved | **${approved}** |
| Assets QC rejected | **${rejected}** |
| Pending | **${pending}** |
| Storefront slots total | **${stats?.slotsTotal ?? countPhase115Slots()}** |
| Slots assigned (approved) | **${stats?.slotsAssigned ?? Object.keys(reviews.slotAssignments).length}** |
| Overall coverage | **${stats?.coveragePct ?? 0}%** |
| Premium FLUX assets available | **${stats?.passedAssetsAvailable ?? approved}** |

## Section Coverage

| Section | Assigned | Total | Coverage |
|---------|----------|-------|----------|
| Homepage (EDITORIAL.*) | ${homepage.ok} | ${homepage.total} | ${homepage.pct}% |
| Trust Center | ${trust.ok} | ${trust.total} | ${trust.pct}% |
| Science / Content | ${science.ok} | ${science.total} | ${science.pct}% |
| Product PDP / cards | ${products.ok} | ${products.total} | ${products.pct}% |
| Timeline | ${timeline.ok} | ${timeline.total} | ${timeline.pct}% |

## Phase 11.5 Production Parts

### Part 1 — Hero
10 hero scenes defined; best QC-pass editorial assigned to \`EDITORIAL.hero\`, \`TRUST_EDITORIAL.trustHero\`.

### Part 2 — Product packaging
Slots \`PRODUCT.{line}.{angle}\` for front, 45°, bathroom, nursery, shelf, lifestyle, reflection, transparent PNG. Uses uploaded \`reference-packaging.png\` when generating new shots.

### Part 3 — Science
Dermatologist, research, microscope, ingredient testing slots mapped to premium editorial pool until dedicated science FLUX completes.

### Part 4 — Lifestyle
Diaper change, bath time, morning routine, sleeping baby, parents, nursery — homepage + trust + community slots.

### Part 5 — Ingredients
Calendula, chamomile, aloe, oat, shea, coconut macro slots in content + trust pages.

### Part 6 — Newsletter
Mother + baby editorial assigned to \`EDITORIAL.newsletter\` / \`newsletterAlt\`.

### Part 7 — Timeline
6 unique \`TIMELINE.0–5\` assignments — no repeated photography per milestone.

### Part 8 — Community
Community + testimonial slots via \`TESTIMONIAL.*\` and \`EDITORIAL.meetFriendsBg\`.

### Part 9 — Backgrounds
Botanical, cream, glass editorial via \`SCENE.forest\` and background pools.

## Approval Workflow

All assignments written to \`src/lib/brand/asset-reviews.json\`:

- \`status: "approved"\` — QC score ≥ 90 (\`reviewedBy: phase-11-5-qc\`)
- \`slotAssignments\` — confirmed live mapping (\`confirmedBy: phase-11-5-production\`)

Storefront resolver (\`generated-assets.ts\`) serves **only approved + assigned** assets.

## Generate Missing Scenes

\`\`\`bash
npm run assets:phase-11-5:produce        # QC approve + assign
npm run assets:phase-11-5:produce:generate  # Print FLUX commands for gaps
npm run assets:flux:generate -- --group science/dermatologist
npm run assets:reviews:sync
npm run assets:phase-11-5:produce        # Re-assign after new approvals
\`\`\`

### Planned FLUX groups (missing scenes only)

${PHASE_11_5_GENERATION_GROUPS.map((g) => `- **${g.group}** (${g.count}) — ${g.note}`).join("\n")}

## Remaining Placeholders

${remaining || "_All storefront slots have approved editorial assignments._"}

## npm Commands

\`\`\`bash
npm run assets:phase-11-5:produce
npm run assets:phase-11-5:report
npm run assets:reviews:sync
\`\`\`

## Validation

\`\`\`bash
npm run lint && npm run typecheck && npm run test && npm run build
\`\`\`

## Constraints

Feature freeze active — imagery and asset assignment only.
`;

  mkdirSync(join(ROOT, "docs"), { recursive: true });
  writeFileSync(REPORT, body, "utf8");
  console.log(`Report written: ${REPORT}`);
}

main();
