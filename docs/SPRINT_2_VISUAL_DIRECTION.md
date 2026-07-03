# Sprint 2 — Premium Visual Direction & Brand Elevation

Luxury D2C visual refinement. **UI and asset curation only** — no database, API, checkout, auth, payment, shipping, CMS schema, admin architecture, or business logic changes.

## Reference quality

Apple · Aesop · Mustela · CeraVe · Dyson · Tubby Todd — calm, premium, minimal, editorial.

---

## Pages refined

| Page / area | Changes |
|-------------|---------|
| **Homepage — Hero** | Single editorial focal; CTAs before trust row; calmer type scale |
| **Homepage — Featured Collection** | Product pedestal, reflection, white-balance filter, tighter card rhythm |
| **Homepage — All sections** | Unified spacing tokens; body copy at 38ch measure |
| **Homepage — Footer** | Trust badges, newsletter link, Lucide social, tighter grid |
| **Global design system** | Typography scale, motion timing, interaction states |

---

## Components improved

| Component | Sprint 2 changes |
|-----------|------------------|
| `HeroVisual.tsx` | **Server component** — removed mascots + stat cards; one image + pedestal/reflection |
| `HeroSection.tsx` | CTA hierarchy (primary solid / secondary ghost); trust pills below CTAs; `prose-measure` subtitle |
| `FeaturedProducts.tsx` | `product-pedestal-stage`, reflection layer, premium crop `center_18%` |
| `HomeSectionHeader.tsx` | Intro uses `prose-measure` (38ch) |
| `Footer.tsx` | Trust badge row (Lucide 1.75), newsletter link, refined spacing, smaller mascots |
| `InstagramIcon.tsx` | Migrated to **Lucide** `Instagram` @ 1.75 stroke |
| `Button.tsx` | CTA variant uses `shadow-soft` (not clay) |
| `globals.css` | Sprint 2 tokens: hero editorial, product pedestal, rhythm, state classes |

---

## Images replaced (approved FLUX slot assignments)

Updated `asset-reviews.json` slot assignments to diversify homepage editorial away from repeated `hero-background-01`:

| Slot | New approved asset |
|------|-------------------|
| `EDITORIAL.hero` | `hero/phase-8-1/mother-baby/mother-baby-07` |
| `EDITORIAL.lifestyleCards.0` | `hero/phase-8-1/mother-baby/mother-baby-14` |
| `EDITORIAL.lifestyleCards.1` | `hero/phase-8-1/hero-glass/hero-glass-04` |
| `EDITORIAL.brandPromise.0` | `hero/phase-8-1/mother-baby/mother-baby-16` |
| `EDITORIAL.newsletter` | `hero/phase-8-1/trust-background/trust-background-06` |
| `EDITORIAL.beyondCareWomen` | `hero/phase-8-1/mother-baby/mother-baby-19` |

All assignments remain **approved** Phase 8.1 FLUX assets. Resolver logic unchanged — only slot → asset mapping.

**Rejected categories** (e.g. `science/dermatologist`, product `front` PNGs) are not used; existing approval gate in `resolveSelectedVisual()` holds.

---

## Typography changes

| Token | Before (max) | After (max) |
|-------|--------------|-------------|
| `--text-hero` | 4.25rem | 3.625rem |
| `--text-h1` | 3.75rem | 3rem |
| `--text-h2` | 2.75rem | 2.375rem |
| `--text-h3` | 1.875rem | 1.625rem |

- Body / intro: **`prose-measure`** = `38ch` (~40–60 character ideal line length)
- Fonts unchanged: **Montserrat** headings, **Helvetica Neue** body

---

## Spacing improvements

New rhythm tokens in `:root`:

- `--space-heading-body` — eyebrow/heading → body gap
- `--space-card` — in-card element spacing
- `--space-button` — CTA / trust row separation

Section padding slightly increased for editorial breathing room. Homepage section headers use consistent `margin-bottom: var(--space-grid)`.

---

## Micro-interactions (unified)

| Surface | Timing | Notes |
|---------|--------|-------|
| Buttons | **165ms** | `--duration-button`, `.motion-button` |
| Cards | **220ms** | `--duration-card`, `.motion-card`, `.homepage-card` |
| Hover lift | card shadow | `interactive-lift` → `shadow-card` (not clay) |
| Focus | terra ring | Existing `focusRing` + `.state-focus` utility |
| Loading / success / error | — | `.state-loading`, `.state-success`, `.state-error` utilities |

---

## Iconography

- Storefront social: **Lucide-compatible Instagram** @ 1.75 stroke (`InstagramIcon.tsx` — brand icons excluded from lucide-react core)
- Hero + footer trust: Lucide `ShieldCheck`, `Globe`, `Leaf` @ 1.75
- Trust widgets: existing Lucide via `TrustIcons.tsx`

---

## Performance

| Check | Status |
|-------|--------|
| Hero visual → server component | ✅ Less client JS on LCP path |
| Hero image `priority` + fixed `aspect-[4/5]` | ✅ Reduced CLS risk |
| Product images lazy + explicit `sizes` | ✅ Unchanged / verified |
| No new client islands | ✅ |

Homepage First Load JS remains within Phase 13 budget (~406 kB).

---

## Remaining recommendations

1. **Product photography** — Regenerate and approve `products/*/front` FLUX assets; current QC rejects force fallback paths. Pedestal CSS compensates visually.
2. **Science section** — Assign approved science-category FLUX when available (current slot uses approved hero-glass editorial).
3. **Real photography** — Add `/images/real/` manifests for hero + flagship SKUs when studio shots exist.
4. **Meet Our Friends** — Consider static mascot grid (no Framer float) for further JS reduction.
5. **Admin auth icons** — Legacy inline SVGs in `AuthShell` / login remain; out of storefront scope.

---

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

---

## Files touched

- `src/components/homepage/HeroVisual.tsx`
- `src/components/sections/HeroSection.tsx`
- `src/components/sections/FeaturedProducts.tsx`
- `src/components/sections/Footer.tsx`
- `src/components/homepage/HomeSectionHeader.tsx`
- `src/components/ui/InstagramIcon.tsx`
- `src/components/ui/Button.tsx`
- `src/app/globals.css`
- `src/lib/brand/asset-reviews.json` (slot assignments only)
