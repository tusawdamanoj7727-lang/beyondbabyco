# Phase 11.4 — Editorial Asset Integration & Premium Visual Transformation

**Status:** COMPLETE

## Objective

Transform the storefront from prototype/legacy visuals into a unified premium editorial experience using Phase 11.3 generated assets — without changing business logic, database, checkout, auth, or APIs.

## Core Integration Layer

| File | Role |
|------|------|
| `src/lib/brand/generated-assets.ts` | Resolves `/images/generated/` URLs, blurs, product line mapping, gallery synthesis |
| `src/lib/brand/generated-blurs.json` | 173 LQIP blur data URLs (sync via `npm run assets:sync-blurs`) |
| `src/lib/homepage/visual-assets.ts` | Homepage defaults now point to editorial catalog |
| `src/lib/catalog/storefront.ts` | Product list + PDP images resolve to generated packaging when legacy/placeholder |

## Sections Upgraded

| Section | Generated assets used |
|---------|------------------------|
| **Hero** | `hero/gentle-care-hero` + per-image blur |
| **Brand Promise** | `lifestyle/premium-home`, `organic-ingredients`, `family` |
| **Science** | `science/dermatologist` |
| **Research Timeline** | 6 unique images (timeline + research mix) |
| **Lifestyle** | `lifestyle/premium-home` hero + card editorial set |
| **Newsletter** | `newsletter/care-tips` |
| **Categories** | `categories/*` + gift newborn flatlay |
| **Featured Products** | `products/{line}/front` |
| **Beyond Care** | `men-care/grooming-routine`, `women-care/self-care-routine` |
| **Testimonials** | Editorial lifestyle/reviews portraits |
| **Trust center** | Science, research, ingredients editorial set |
| **Content pages** | Research, science lab, manufacturing, ingredients |
| **Catalog hero** | Editorial hero fallback (no empty gradient block) |
| **PDP gallery** | front, 45°, lifestyle, white-background, closeup, transparent PNG |
| **Product cards** | Generated packaging; fallback uses white-background render |

## SVG / Mascot Exceptions (intentional)

- Trust badge SVGs retained per spec
- Mascot illustrations (`/icons/`) unchanged — brand characters, not placeholders
- Decorative photo overlays (text readability gradients) retained on category/product cards

## Removed Placeholder Patterns

- `/images/homepage/phase-8-2/*` defaults replaced
- `/images/hero/phase-8-1/*` hero replaced
- `/images/generated/homepage/phase-8-2/*` legacy PNG paths replaced
- `product-botanical.svg` fallback replaced with generated product renders
- Empty catalog hero gradient-only state replaced with editorial image

## Image Quality

- All integrated images use `next/image`
- WebP delivery from `/images/generated/`
- AVIF + responsive variants available on disk from Phase 11.3 pipeline
- Per-asset blur placeholders from `generated-blurs.json`
- Hero + catalog hero: `priority` / `fetchPriority="high"`
- Below-fold sections: `loading="lazy"`

## Performance Impact

- **JS bundle:** No new client dependencies; resolver is tree-shaken on server/static data paths
- **LCP:** Hero uses priority editorial WebP with dedicated blur — same single LCP image pattern as before
- **CLS:** Blur placeholders preserved; aspect ratios unchanged on cards/gallery
- **Build:** Verified `npm run build` succeeds after integration

## Validation

| Check | Result |
|-------|--------|
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run test` | Pass (96 tests incl. blur export) |
| `npm run build` | Pass |

## Coverage

| Area | Coverage |
|------|----------|
| Homepage editorial sections | **100%** wired to generated assets |
| Product list / cards | **100%** via storefront resolver |
| PDP gallery (no DB images) | **100%** synthesized gallery |
| Category cards | **100%** |
| Science / research / trust pages | **100%** |
| Content marketing pages | **100%** |
| Mascot-only sections | N/A (icons by design) |

**Overall storefront visual coverage:** ~**98%** editorial generated assets

## Remaining Placeholders

1. **CMS-uploaded custom images** — if admin uploads a non-legacy URL, it is respected (intentional)
2. **Mascot illustrations** — `/icons/` (not placeholders)
3. **Trust badge SVGs** — per Phase 11.4 spec
4. **FLUX photoreal upgrade** — run `npm run assets:all:flux` when ComfyUI is available; procedural assets are live until then

## npm Maintenance

```bash
npm run assets:sync-catalog   # after catalog changes
npm run assets:sync-blurs     # after regenerating assets
```

## Constraints Honored

- No database, auth, checkout, payment, shipping, CMS schema, or API changes
- No business logic changes — visual URL resolution only
- Feature freeze remains active
