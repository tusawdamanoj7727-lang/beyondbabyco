# Phase 11.4B — Commercial FLUX Prompt Engineering

**Status:** COMPLETE (prompt system + quality gate; generation via ComfyUI)

## Objective

Improve FLUX acceptance from **10.7%** (42/392 Phase 11.4A baseline) toward **>90% usable images** by generating fewer, much better commercial photographs.

## Global Master Prompt

Every image begins with this unified style (`scripts/assets/lib/commercial-prompts.mjs`):

> Luxury commercial baby skincare campaign photograph for BeyondBabyCo. Ultra realistic. Shot on Canon EOS R5. 85mm RF lens. Natural morning window light. Premium editorial photography. Indian parents. Healthy happy baby. Luxury nursery. Cream walls. Soft sage botanical accents. Warm ivory palette. Natural skin texture. Professional commercial color grading. Shallow depth of field. Magazine quality. Award-winning advertising photography.

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
| Volume | 355 catalog entries, 20/scene | **84 curated scenes** → **168 final outputs** (top 2 kept) |
| Candidates | 1 per asset | **5–8 candidates/scene**, keep top **2** |

## Scene Catalog

`84` commercial scenes (`scripts/assets/lib/flux-catalog-11-4b.mjs`):

| Group | Scenes | Final outputs |
|-------|--------|---------------|
| hero | 5 scenes | 10 outputs |
| lifestyle/mother-baby | 4 scenes | 8 outputs |
| lifestyle/father-baby | 3 scenes | 6 outputs |
| lifestyle/bath-time | 4 scenes | 8 outputs |
| lifestyle/diaper-change | 3 scenes | 6 outputs |
| lifestyle/sleeping-baby | 3 scenes | 6 outputs |
| research | 3 scenes | 6 outputs |
| science | 3 scenes | 6 outputs |
| ingredients/calendula | 1 scenes | 2 outputs |
| ingredients/chamomile | 1 scenes | 2 outputs |
| ingredients/oat | 1 scenes | 2 outputs |
| ingredients/aloe | 1 scenes | 2 outputs |
| ingredients/coconut | 1 scenes | 2 outputs |
| ingredients/shea | 1 scenes | 2 outputs |
| newsletter | 3 scenes | 6 outputs |
| trust | 3 scenes | 6 outputs |
| community | 4 scenes | 8 outputs |
| products/baby-wipes | 4 scenes | 8 outputs |
| products/baby-wash | 4 scenes | 8 outputs |
| products/baby-lotion | 4 scenes | 8 outputs |
| products/baby-shampoo | 4 scenes | 8 outputs |
| products/baby-oil | 4 scenes | 8 outputs |
| products/baby-powder | 4 scenes | 8 outputs |
| products/gift-box | 4 scenes | 8 outputs |
| products/newborn-kit | 4 scenes | 8 outputs |
| products/men-care | 4 scenes | 8 outputs |
| products/women-care | 4 scenes | 8 outputs |
| **Total** | **84** | **168** |

Generation budget: ~504 FLUX calls (vs 355+ in 11.4A).

## Category Prompts

### Hero
Indian mother, baby, luxury home, natural window light, minimal styling, editorial warmth, looking at baby, no camera pose.

### Product
Professional commercial product photography referencing **on-disk packaging** (`public/images/generated/products/{line}/front.png`). No imagined packaging. No text. No distortion.

### Science
Indian dermatologist, luxury research center, microscope, ingredient testing, cream laboratory, natural light.

### Ingredients
100mm RF macro, magazine macro quality, per-ingredient botanical detail.

## Negative Prompt

```
plastic skin, cgi, cartoon, anime, illustration, painting, duplicate child, deformed hands, extra fingers, text, watermark, logo, cropped face, blurry, bad anatomy, wrong packaging, dark lighting, harsh shadows, oversaturated, low resolution, 3D render, deformed face, unrealistic eyes, fake smile, busy background, neon, AI artifacts, wrong colors, packaging distortion, incorrect logos
```

## Quality Gate (Hard Reject)

Immediate rejection (`scripts/assets/lib/quality-score.mjs`) if:

- AI artifacts (face region chaos)
- Bad eyes (face region too flat)
- Packaging distortion (product asymmetry)
- Dark lighting (brightness < 95)
- Oversaturated channel spread
- Low resolution / low realism (PNG size heuristics)
- Procedural placeholder detected

Composite score must still reach **90/100**.

### Rejected Reasons (latest run)

| Reason | Count |
|--------|-------|
| _Run generation to populate_ | — |

## Acceptance Rates

| Metric | Rate |
|--------|------|
| Phase 11.4A baseline (all assets on disk) | **10.7%** (42/392) |
| Current scored library | **10.7%** (42/392) |
| Phase 11.4B candidate acceptance (after multi-candidate runs) | _Run `npm run assets:flux:generate` to measure_ |
| **Target** | **>90%** |

## Expected Quality Improvement

1. **Master prompt unification** — eliminates style drift between categories
2. **Packaging reference prompts** — reduces wrong-packaging / logo hallucination
3. **Curated scenes** — fewer generations, stronger art direction per shot
4. **Multi-candidate selection** — 6 attempts, keep best 2
5. **Hard reject gates** — filter AI artifacts before composite scoring

Expected outcome: **>90% candidate acceptance** on FLUX output (vs ~11% library-wide baseline that included procedural placeholders).

## npm Commands

```bash
npm run ai:start
npm run assets:flux:generate              # 6 candidates/scene, keep top 2
npm run assets:flux:generate:hero
npm run assets:flux:score
npm run assets:flux:assign
npm run assets:flux:prompt-report           # Regenerate this document
```

## Constraints

- No storefront, database, admin, CMS, API, or business logic changes
- Prompt and generation pipeline improvements only
