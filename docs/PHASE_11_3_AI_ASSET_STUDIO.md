# Phase 11.3 — AI Asset Studio & Editorial Photography System

**Status:** COMPLETE (studio built; website wiring deferred to Phase 11.4)

## Objective

One unified AI-powered visual identity for BeyondBabyCo. Every generated image follows a single commercial photoshoot art direction — not random AI output.

## Art Direction

Defined in `src/lib/brand/art-direction.ts`.

| Dimension | Specification |
|-----------|---------------|
| Lighting | Soft natural daylight; golden morning light; luxury editorial warm white; premium commercial |
| Palette | Ivory, cream, warm white, soft sage, muted eucalyptus, natural wood, cotton, linen |
| Camera | Canon EOS R5; 85mm, 50mm, 100mm macro; shallow DOF |
| Wardrobe | Neutral white, warm beige, soft oatmeal, cotton cream, minimal linen |
| Subjects | Indian families, natural expressions, quiet tenderness — no exaggerated smiles, no studio posing |
| Backgrounds | Minimal nursery; luxury bathroom; wood table; cotton towel; cream wall; botanical; premium home |

## Master Prompt Templates

Defined in `src/lib/brand/prompt-templates.ts`.

- **hero** — reusable FLUX master template
- **lifestyle** — reusable FLUX master template
- **research** — reusable FLUX master template
- **science** — reusable FLUX master template
- **product** — reusable FLUX master template
- **macro-ingredient** — reusable FLUX master template
- **newsletter** — reusable FLUX master template
- **timeline** — reusable FLUX master template
- **category** — reusable FLUX master template
- **trust** — reusable FLUX master template
- **marketing** — reusable FLUX master template
- **decorative** — reusable FLUX master template
- **background** — reusable FLUX master template

## Image Catalog

Defined in `src/lib/brand/asset-catalog.ts`.

**Catalog total:** 173 planned assets across 21 categories.

### Category coverage

| Category | Catalog | Generated (WebP on disk) | Coverage |
|----------|---------|--------------------------|----------|
| hero | 4 | 4 | 100% |
| lifestyle | 10 | 10 | 100% |
| research | 5 | 5 | 100% |
| science | 6 | 6 | 100% |
| products | 80 | 80 | 100% |
| ingredients | 6 | 6 | 100% |
| newsletter | 3 | 3 | 100% |
| timeline | 5 | 5 | 100% |
| categories | 9 | 9 | 100% |
| trust | 5 | 5 | 100% |
| mascots | 2 | 2 | 100% |
| backgrounds | 7 | 7 | 100% |
| decorative | 10 | 10 | 100% |
| marketing | 5 | 5 | 100% |
| social | 3 | 3 | 100% |
| campaigns | 2 | 2 | 100% |
| community | 2 | 2 | 100% |
| reviews | 2 | 2 | 100% |
| men-care | 2 | 2 | 100% |
| women-care | 2 | 2 | 100% |
| gift | 3 | 3 | 100% |
| **Total** | **173** | **173** | **100%** |

## Folder Structure

```
public/images/generated/
  hero/
  lifestyle/
  research/
  science/
  products/
  ingredients/
  newsletter/
  timeline/
  categories/
  trust/
  mascots/
  backgrounds/
  decorative/
  marketing/
  social/
  campaigns/
  community/
  reviews/
  men-care/
  women-care/
  gift/
```

Each asset produces:

- `.png` — source raster
- `.webp` — primary delivery format
- `.avif` — modern format (when supported)
- `-{480,768,1024,1536}.webp` — responsive variants
- `.blur.txt` — LQIP blur data URL

## npm Commands

- `npm run assets:hero`
- `npm run assets:lifestyle`
- `npm run assets:products`
- `npm run assets:research`
- `npm run assets:science`
- `npm run assets:ingredients`
- `npm run assets:timeline`
- `npm run assets:newsletter`
- `npm run assets:trust`
- `npm run assets:marketing`
- `npm run assets:all` — full catalog (procedural)
- `npm run assets:all:flux` — full catalog via ComfyUI FLUX

Generator: `scripts/assets/generate.mjs`

```bash
# Procedural (instant, brand-consistent placeholders)
npm run assets:hero

# FLUX editorial (requires ComfyUI: npm run ai:start)
node --experimental-strip-types scripts/assets/generate.mjs --category hero --flux
```

## Product Editorial Renders

Product lines: Baby Wipes, Baby Wash, Baby Lotion, Baby Shampoo, Baby Oil, Baby Powder, Gift Box, Newborn Kit, Men Care, Women Care.

Angles per line: front, front-45°, back, top, lifestyle, packaging closeup, transparent PNG, white background.

## Lifestyle, Science & Decorative

- **Lifestyle:** diaper change, bath time, lotion application, sleeping baby, nursery, morning routine, father holding baby, family, organic ingredients, premium home
- **Science:** scientist, dermatologist, microscope, lab, testing, ingredient research; ingredient macros (calendula, oat, chamomile, aloe)
- **Decorative:** botanical illustrations, leaf overlays, organic blobs, glass reflections, water ripples, cotton/cream textures, noise, shadows, gradients

## Manifest

Runtime manifest: `scripts/assets/data/manifest.json`

Last generation: 2026-07-02T08:34:51.816Z

## Estimated Coverage

- **Studio infrastructure:** 100% (art direction, catalog, prompts, pipeline, npm scripts)
- **Asset generation (this run):** 100% of catalog (173/173 WebP files on disk)
- **Website integration:** 0% (Phase 11.4)

## Remaining Photography

For Phase 11.4 website replacement, prioritize:

1. Homepage hero (`hero/gentle-care-hero`, `hero/science-backed-hero`)
2. Featured product packaging (`products/*/front`, `products/*/white-background`)
3. Lifestyle trust moments (`lifestyle/family`, `lifestyle/applying-lotion`)
4. Science page (`science/*`, `research/*`)
5. Category banners (`categories/*`)
6. Newsletter & marketing banners

Re-run with `--flux` when ComfyUI is available for photoreal editorial output. Procedural assets are brand-consistent placeholders until FLUX generation completes.

## Constraints (Phase 11.3)

- No database, checkout, payment, shipping, auth, CMS, or API changes
- No live website image replacement (Phase 11.4)
- Feature freeze remains active
