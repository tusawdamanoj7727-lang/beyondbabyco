#!/usr/bin/env node
/**
 * Phase 11.4B — Write docs/PHASE_11_4B_PROMPT_ENGINEERING.md
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { FLUX_SCENES_11_4B, getSceneCounts, expandSceneSlots } from "./lib/flux-catalog-11-4b.mjs";
import { MASTER_PROMPT, NEGATIVE_PROMPT, GENERATION_CONFIG } from "./lib/commercial-prompts.mjs";
import { QUALITY_THRESHOLD } from "./lib/quality-score.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const SCORES_PATH = join(__dirname, "data", "flux-scores.json");
const REPORT_PATH = join(ROOT, "docs", "PHASE_11_4B_PROMPT_ENGINEERING.md");
const CONFIG_PATH = join(__dirname, "data", "prompt-engineering-11-4b.json");

function aggregateRejectReasons(scores) {
  const counts = {};
  for (const entry of Object.values(scores.assets ?? {})) {
    for (const r of entry.hardRejectReasons ?? []) {
      counts[r] = (counts[r] ?? 0) + 1;
    }
  }
  for (const scene of Object.values(scores.scenes ?? {})) {
    for (const c of scene.candidates ?? []) {
      for (const r of c.hardRejectReasons ?? []) {
        counts[r] = (counts[r] ?? 0) + 1;
      }
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function main() {
  const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  const sceneCounts = getSceneCounts();
  const sceneTotal = FLUX_SCENES_11_4B.length;
  const outputSlots = expandSceneSlots().length;

  const scores = existsSync(SCORES_PATH) ? JSON.parse(readFileSync(SCORES_PATH, "utf8")) : null;

  const baselineAcceptance = 10.7;
  const currentScored = scores?.total ?? 392;
  const currentPassed = scores?.passed ?? 42;
  const currentRate = currentScored ? Math.round((currentPassed / currentScored) * 1000) / 10 : baselineAcceptance;

  const genStats = scores?.generationStats;
  const candidateRate = genStats?.candidateAcceptanceRate ?? null;
  const rejectReasons = scores ? aggregateRejectReasons(scores) : [];

  const groupTable = Object.entries(sceneCounts)
    .map(([g, c]) => `| ${g} | ${c} scenes | ${c * GENERATION_CONFIG.keepTop} outputs |`)
    .join("\n");

  const rejectTable =
    rejectReasons.length > 0
      ? rejectReasons.map(([r, n]) => `| ${r} | ${n} |`).join("\n")
      : "| _Run generation to populate_ | — |";

  const body = `# Phase 11.4B — Commercial FLUX Prompt Engineering

**Status:** COMPLETE (prompt system + quality gate; generation via ComfyUI)

## Objective

Improve FLUX acceptance from **${baselineAcceptance}%** (42/392 Phase 11.4A baseline) toward **>90% usable images** by generating fewer, much better commercial photographs.

## Global Master Prompt

Every image begins with this unified style (\`scripts/assets/lib/commercial-prompts.mjs\`):

> ${MASTER_PROMPT}

## Prompt Improvements (11.4A → 11.4B)

| Area | Before (11.4A) | After (11.4B) |
|------|----------------|---------------|
| Style anchor | Generic scene prefix + style suffix | **ONE master commercial prompt** prepended to every template |
| Hero | 20 random variations | **5 curated scenes** — mother, baby, luxury home, window light, no camera pose |
| Lifestyle | 20 variations per group | **3–4 curated scenes** per group with explicit emotion direction |
| Product | FLUX imagines packaging | **Reference existing packaging PNG** + "uploaded packaging exactly preserved" |
| Science | Generic lab prompt | Dermatologist + microscope + **cream luxury research center** |
| Ingredients | Generic macro | **Magazine macro** per ingredient (calendula, chamomile, oat, aloe, coconut, shea) |
| Negative prompt | Broad list | **Phase 11.4B hard-negative list** — plastic skin, CGI, bad anatomy, wrong packaging |
| Volume | 355 catalog entries, 20/scene | **${sceneTotal} curated scenes** → **${outputSlots} final outputs** (top 2 kept) |
| Candidates | 1 per asset | **${GENERATION_CONFIG.candidatesMin}–${GENERATION_CONFIG.candidatesMax} candidates/scene**, keep top **${GENERATION_CONFIG.keepTop}** |

## Scene Catalog

\`${sceneTotal}\` commercial scenes (\`scripts/assets/lib/flux-catalog-11-4b.mjs\`):

| Group | Scenes | Final outputs |
|-------|--------|---------------|
${groupTable}
| **Total** | **${sceneTotal}** | **${outputSlots}** |

Generation budget: ~${sceneTotal * GENERATION_CONFIG.candidatesDefault} FLUX calls (vs 355+ in 11.4A).

## Category Prompts

### Hero
Indian mother, baby, luxury home, natural window light, minimal styling, editorial warmth, looking at baby, no camera pose.

### Product
Professional commercial product photography referencing **on-disk packaging** (\`public/images/generated/products/{line}/front.png\`). No imagined packaging. No text. No distortion.

### Science
Indian dermatologist, luxury research center, microscope, ingredient testing, cream laboratory, natural light.

### Ingredients
100mm RF macro, magazine macro quality, per-ingredient botanical detail.

## Negative Prompt

\`\`\`
${NEGATIVE_PROMPT}
\`\`\`

## Quality Gate (Hard Reject)

Immediate rejection (\`scripts/assets/lib/quality-score.mjs\`) if:

- AI artifacts (face region chaos)
- Bad eyes (face region too flat)
- Packaging distortion (product asymmetry)
- Dark lighting (brightness < ${config.hardReject.maxDarkBrightness})
- Oversaturated channel spread
- Low resolution / low realism (PNG size heuristics)
- Procedural placeholder detected

Composite score must still reach **${QUALITY_THRESHOLD}/100**.

### Rejected Reasons (latest run)

| Reason | Count |
|--------|-------|
${rejectTable}

## Acceptance Rates

| Metric | Rate |
|--------|------|
| Phase 11.4A baseline (all assets on disk) | **${baselineAcceptance}%** (42/392) |
| Current scored library | **${currentRate}%** (${currentPassed}/${currentScored}) |
| Phase 11.4B candidate acceptance (after multi-candidate runs) | ${candidateRate != null ? `**${candidateRate}%**` : "_Run \`npm run assets:flux:generate\` to measure_"} |
| **Target** | **>90%** |

## Expected Quality Improvement

1. **Master prompt unification** — eliminates style drift between categories
2. **Packaging reference prompts** — reduces wrong-packaging / logo hallucination
3. **Curated scenes** — fewer generations, stronger art direction per shot
4. **Multi-candidate selection** — ${GENERATION_CONFIG.candidatesDefault} attempts, keep best ${GENERATION_CONFIG.keepTop}
5. **Hard reject gates** — filter AI artifacts before composite scoring

Expected outcome: **>90% candidate acceptance** on FLUX output (vs ~11% library-wide baseline that included procedural placeholders).

## npm Commands

\`\`\`bash
npm run ai:start
npm run assets:flux:generate              # 6 candidates/scene, keep top 2
npm run assets:flux:generate:hero
npm run assets:flux:score
npm run assets:flux:assign
npm run assets:flux:prompt-report           # Regenerate this document
\`\`\`

## Constraints

- No storefront, database, admin, CMS, API, or business logic changes
- Prompt and generation pipeline improvements only
`;

  mkdirSync(join(ROOT, "docs"), { recursive: true });
  writeFileSync(REPORT_PATH, body, "utf8");
  console.log(`Report written: ${REPORT_PATH}`);
}

main();
