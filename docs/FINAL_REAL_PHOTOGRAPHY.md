# Final Task 1 — Real Photography Integration

**Status:** COMPLETE  
**Date:** 2026-07-02

## Objective

Wire production photography into the existing AI Asset Manager resolver chain without changing code architecture. Every approved FLUX slot that has a matching production source now serves real WebP from `/images/real/`. Slots and product angles without production sources continue to use QC-approved FLUX only. No placeholders are used anywhere in the visual pipeline.

---

## Architecture (unchanged)

```
genVisual({ category, slug })
  ├─ resolveRealVisual()     → /images/real/{category}/{slug}.webp  (manifest)
  └─ genPath() + genBlur()   → /images/generated/...                 (approved FLUX fallback)

resolveSelectedVisual(slotKey, fallback)
  ├─ approvedSlotVisual()    → asset-reviews.json slotAssignments
  └─ genVisual()               → real-first, then FLUX
```

| Component | Path |
|-----------|------|
| Real resolver | `src/lib/brand/real-assets.ts` |
| Visual resolver | `src/lib/brand/generated-assets.ts` |
| Slot assignments | `src/lib/brand/asset-reviews.json` |
| Manifest (auto-generated) | `src/lib/brand/real-assets-manifest.json` |
| Production drop zone | `public/images/real/` |
| Sync script | `scripts/sync-real-photography.mjs` |
| Manifest rebuild | `npm run brand:assets` |

---

## Sync pipeline

New command **`npm run brand:sync-real`** (also runs at the start of `npm run brand:assets`):

1. Reads all **approved** assets and slot assignments from `asset-reviews.json`
2. Copies Phase 8.1 hero production WebP from `public/images/hero/phase-8-1/` → `public/images/real/hero/phase-8-1/`
3. Copies Phase 8.5 packaging WebP from `public/images/products/phase-8-5/{product}/packaging/` → `public/images/real/products/{line}/`
4. Writes sync report to `scripts/assets/data/sync-real-photography-report.json`
5. `build-brand-assets.mjs` rescans `/images/real/` and updates `real-assets-manifest.json`

### Production sources

| Source | Count | Destination key pattern |
|--------|-------|-------------------------|
| `images/hero/phase-8-1/**/*.webp` | 50 | `hero/phase-8-1/{group}/{slug}` |
| `images/products/phase-8-5/2-in-1-wash-shampoo/packaging/*.webp` | 5 angles × 2 lines | `products/baby-wash/{angle}`, `products/baby-shampoo/{angle}` |

**Product line mapping:** `2-in-1-wash-shampoo` → `baby-wash` + `baby-shampoo` (matches `resolveProductLine()` for wash/shampoo PDPs and featured cards).

---

## Manifest summary

| Metric | Value |
|--------|-------|
| Total real assets | **60** |
| Hero editorial (Phase 8.1) | 50 |
| Product packaging | 10 (5 angles × 2 lines) |
| Approved FLUX assets in QC | 25 (all have production hero sources) |
| AI Asset Manager slots | 71 |
| Slots serving real photography | **71 / 71** (100%) |

---

## Coverage by priority

### 1. Hero

| Slot | Approved asset | Real path | Status |
|------|----------------|-----------|--------|
| `EDITORIAL.hero` | `hero/phase-8-1/mother-baby/mother-baby-07` | `/images/real/hero/phase-8-1/mother-baby/mother-baby-07.webp` | ✅ Real |
| `EDITORIAL.heroAlt` | `hero/phase-8-1/hero-background/hero-background-01` | `/images/real/hero/phase-8-1/hero-background/hero-background-01.webp` | ✅ Real |

Homepage hero (`EDITORIAL.hero`) now serves the Phase 8.1 mother-baby production shot instead of FLUX PNG.

### 2. Featured Products

No `PRODUCT.*` slot assignments (removed in Phase 11.5 slot fix). Featured product cards resolve via `resolveProductSelection()` → `genVisual({ category: "products", slug: "{line}/front" })`.

| Product line | Angle | Real available | Fallback |
|--------------|-------|----------------|----------|
| `baby-wash` | front, front-45, back, top, side | ✅ Phase 8.5 packaging | — |
| `baby-shampoo` | front, front-45, back, top, side | ✅ Phase 8.5 packaging | — |
| All other lines | all angles | ❌ | Approved FLUX via `/images/generated/products/` |

### 3. Product Detail (PDP)

`resolveProductGalleryImages()` uses `resolveProductSelection()` per angle. For `2-in-1-wash-shampoo` (line: `baby-shampoo`):

| Gallery angle | Source |
|---------------|--------|
| `front`, `front-45` | ✅ Real packaging |
| `lifestyle`, `bathroom`, `nursery`, `white-background`, `reflection`, `transparent-png` | FLUX (no production source) |

### 4. Newsletter

| Slot | Real path | Status |
|------|-----------|--------|
| `EDITORIAL.newsletter` | `…/trust-background/trust-background-06.webp` | ✅ Real |
| `EDITORIAL.newsletterAlt` | `…/mother-baby/mother-baby-07.webp` | ✅ Real |

### 5. Research

| Slot group | Count | Status |
|------------|-------|--------|
| `TIMELINE.0` – `TIMELINE.5` | 6 | ✅ Real (hero-background series) |
| `CONTENT_EDITORIAL.research` | 1 | ✅ Real (hero-glass-01) |
| `TRUST_EDITORIAL.research`, `.clinical`, `.inspection`, etc. | 8 | ✅ Real |

### 6. Lifestyle

| Slot | Status |
|------|--------|
| `EDITORIAL.lifestyleHero` | ✅ Real |
| `EDITORIAL.lifestyleCards.0–2` | ✅ Real |
| `EDITORIAL.brandPromise.0–2` | ✅ Real |
| `SCENE.lifestyle` | ✅ Real |

### 7. Trust

All 21 `TRUST_EDITORIAL.*` slots and `EDITORIAL.trustBackdrop` resolve to Phase 8.1 production hero photography. ✅ Real

### 8. Community

All 8 `TESTIMONIAL.*` portrait slots resolve to Phase 8.1 mother-baby / hero-background production shots. ✅ Real

---

## Fallback behavior

| Condition | Resolver behavior |
|-----------|-------------------|
| Real asset in manifest | `genVisual()` returns `/images/real/...` |
| No real asset, approved FLUX slot | `resolveSelectedVisual()` → `/images/generated/...` |
| No real asset, no approval | Generated path from fallback `VisualRef` |
| Legacy / placeholder URL in CMS | `shouldUseGeneratedAsset()` → generated editorial |
| Empty DB product images | `resolveProductGalleryImages()` → generated/real gallery |

**Never used:** SVG gradients, Unsplash, placehold.co, or `/images/homepage/phase-8-2/` legacy paths (blocked by `LEGACY_VISUAL_PATTERNS`).

---

## Commands

```bash
# Sync production photography into /images/real/
npm run brand:sync-real

# Full brand rebuild (sync + logos/OG + manifest scan)
npm run brand:assets

# Validation
npm run lint && npm run typecheck && npm run test && npm run build
```

---

## Verification

After sync, confirm hero resolves to real:

```typescript
import { EDITORIAL } from "@/lib/brand/generated-assets";

EDITORIAL.hero.url
// → "/images/real/hero/phase-8-1/mother-baby/mother-baby-07.webp"
```

Unit test: `tests/unit/real-brand-assets.test.ts` — asserts `genVisual()` prefers manifest entries for Phase 8.1 hero slugs.

---

## Future uploads

1. Drop new files into `public/images/real/{category}/{slug}.webp` matching AI Asset Manager keys
2. Or add production sources under `public/images/hero/phase-8-1/` / `public/images/products/phase-8-5/` and extend `PRODUCT_LINE_MAP` in `scripts/sync-real-photography.mjs`
3. Run `npm run brand:assets`

No resolver or component changes required.

---

## Files changed

| File | Change |
|------|--------|
| `scripts/sync-real-photography.mjs` | **New** — production → real sync |
| `package.json` | Added `brand:sync-real`; chained into `brand:assets` |
| `public/images/real/**` | 60 production WebP assets |
| `src/lib/brand/real-assets-manifest.json` | Regenerated (60 entries) |
| `public/images/real/README.md` | Updated key structure docs |
| `tests/unit/real-brand-assets.test.ts` | Real-first assertion for hero slug |
| `scripts/assets/data/sync-real-photography-report.json` | Sync audit report |

**No changes** to `generated-assets.ts`, `real-assets.ts`, components, DB, APIs, or checkout.
