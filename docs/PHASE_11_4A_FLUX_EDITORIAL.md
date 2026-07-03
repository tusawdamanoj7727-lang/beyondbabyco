# Phase 11.4A — FLUX Editorial Photography & Auto Asset Selection

**Status:** COMPLETE (pipeline + auto-selection; FLUX generation runs via ComfyUI)

## Objective

Replace procedural placeholders with premium FLUX editorial photography from ONE luxury commercial photoshoot visual language. Auto-score, reject below 90/100, and assign highest-quality assets to site slots.

## Art Direction (11.4A)

Updated in `src/lib/brand/art-direction.ts` and `scripts/assets/data/art-direction.json`.

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

`scripts/assets/lib/flux-catalog-11-4a.mjs` — **355** editorial variations.

| Group | Variations |
|-------|------------|
| hero | 20 |
| lifestyle/mother-baby | 20 |
| lifestyle/father-baby | 15 |
| lifestyle/bath-time | 20 |
| lifestyle/diaper-change | 15 |
| lifestyle/sleeping-baby | 15 |
| research/lab | 15 |
| science/dermatologist | 15 |
| ingredients/calendula | 10 |
| ingredients/chamomile | 10 |
| ingredients/oat | 10 |
| ingredients/aloe | 10 |
| ingredients/coconut | 10 |
| ingredients/shea | 10 |
| newsletter | 15 |
| trust | 15 |
| community | 20 |
| products/baby-wipes | 11 |
| products/baby-wash | 11 |
| products/baby-lotion | 11 |
| products/baby-shampoo | 11 |
| products/baby-oil | 11 |
| products/baby-powder | 11 |
| products/gift-box | 11 |
| products/newborn-kit | 11 |
| products/men-care | 11 |
| products/women-care | 11 |

Legacy Phase 11.3 catalog (`173` assets) remains as procedural fallbacks until FLUX replacements score ≥ 90.

## Pipeline

| Script | Purpose |
|--------|---------|
| `scripts/assets/flux-generate.mjs` | FLUX generation + inline quality gate |
| `scripts/assets/flux-score.mjs` | Score all PNG assets on disk |
| `scripts/assets/flux-assign.mjs` | Auto-map best assets to site slots |
| `scripts/assets/lib/quality-score.mjs` | Editorial scorer (face, lighting, composition, depth, brand, realism) |

### npm Commands

```bash
npm run ai:start                    # ComfyUI FLUX backend
npm run assets:flux:generate        # Full 11.4A catalog via FLUX
npm run assets:flux:generate:hero   # Hero batch only
npm run assets:flux:score           # Re-score all assets
npm run assets:flux:assign          # Auto-assign to storefront slots
npm run assets:sync-blurs           # Refresh LQIP blur map
npm run assets:flux:report          # Regenerate this document
```

## Quality Gate

- **Threshold:** 90/100
- **Dimensions:** face quality, lighting, composition, depth of field, brand consistency, realism
- **Rejected assets:** moved to `public/images/generated/_rejected/`

## Generation Results

| Metric | Count |
|--------|-------|
| 11.4A catalog planned | 355 |
| Assets scored | 392 |
| Passed (≥ 90) | 42 |
| Rejected / below threshold | 350 |
| Rejected on disk (`_rejected/`) | 0 |
| WebP files on disk (all categories) | 173 |

## Auto Assignment

Selections manifest: `src/lib/brand/asset-selections.json`

| Assignment | Selected |
|------------|----------|
| Site editorial slots | 9 / 53 |
| Product packaging angles | 0 / 110 |

Site resolver: `src/lib/brand/generated-assets.ts` reads selections when `assigned: true` and score ≥ 90; otherwise retains Phase 11.3/11.4 fallback asset.

## Remaining Placeholders

- `EDITORIAL.science` — no passing candidate
- `EDITORIAL.lifestyleCards.0` — no passing candidate
- `EDITORIAL.lifestyleCards.1` — no passing candidate
- `EDITORIAL.brandPromise.1` — no passing candidate
- `EDITORIAL.brandPromise.2` — no passing candidate
- `EDITORIAL.newsletter` — no passing candidate
- `EDITORIAL.newsletterAlt` — no passing candidate
- `EDITORIAL.beyondCareMen` — no passing candidate
- `EDITORIAL.beyondCareWomen` — no passing candidate
- `EDITORIAL.trustBackdrop` — no passing candidate
- `EDITORIAL.meetFriendsBg` — no passing candidate
- `CONTENT_EDITORIAL.about` — no passing candidate
- `CONTENT_EDITORIAL.research` — no passing candidate
- `CONTENT_EDITORIAL.ingredients` — no passing candidate
- `CONTENT_EDITORIAL.manufacturing` — no passing candidate
- `CONTENT_EDITORIAL.certifications` — no passing candidate
- `CONTENT_EDITORIAL.safety` — no passing candidate
- `CONTENT_EDITORIAL.contact` — no passing candidate
- `CONTENT_EDITORIAL.scienceLab` — no passing candidate
- `CONTENT_EDITORIAL.family` — no passing candidate
- `CONTENT_EDITORIAL.ingredientOat` — no passing candidate
- `CONTENT_EDITORIAL.ingredientChamomile` — no passing candidate
- `CONTENT_EDITORIAL.ingredientAloe` — no passing candidate
- `CONTENT_EDITORIAL.microscope` — no passing candidate
- `CONTENT_EDITORIAL.scientist` — no passing candidate
- `TRUST_EDITORIAL.research` — no passing candidate
- `TRUST_EDITORIAL.ingredient` — no passing candidate
- `TRUST_EDITORIAL.laboratory` — no passing candidate
- `TRUST_EDITORIAL.safety` — no passing candidate
- `TRUST_EDITORIAL.dermatology` — no passing candidate
- `TRUST_EDITORIAL.pediatric` — no passing candidate
- `TRUST_EDITORIAL.clinical` — no passing candidate
- `TRUST_EDITORIAL.manufacturing` — no passing candidate
- `TRUST_EDITORIAL.quality` — no passing candidate
- `TRUST_EDITORIAL.feedback` — no passing candidate
- `TRUST_EDITORIAL.rawMaterials` — no passing candidate
- `TRUST_EDITORIAL.inspection` — no passing candidate
- `TRUST_EDITORIAL.production` — no passing candidate
- `TRUST_EDITORIAL.packaging` — no passing candidate
- `TRUST_EDITORIAL.warehouse` — no passing candidate
- `TRUST_EDITORIAL.delivery` — no passing candidate
- `TRUST_EDITORIAL.sustainability` — no passing candidate
- `TRUST_EDITORIAL.doctorAdvisory` — no passing candidate
- `TRUST_EDITORIAL.trustHero` — no passing candidate

## Output Formats

Each accepted asset in `public/images/generated/`:

- `.png` — source raster
- `.webp` / `.avif` — delivery formats
- `-{480,768,1024,1536}.webp` — responsive variants
- `.blur.txt` — LQIP placeholder

## Validation

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

## Constraints

- No database, API, auth, checkout, payment, shipping, CMS schema, or business logic changes
- Imagery-only improvement; feature freeze remains active
