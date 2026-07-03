# Phase 15 — Production UI QA

**Goal:** Final visual consistency pass before launch — mathematical alignment, one design system, no redesign.

**Date:** 2026-07-03

---

## Files changed

| File | Fixes |
|------|-------|
| `src/app/globals.css` | Consolidated duplicate homepage tokens; fixed inverted card hover shadows; merged `.quality-icon-box`; removed dead footer-trust dark styles; added `.homepage-split-grid`, `.quality-icon-box-sm`, `.footer-column-title`; unified product price rules |
| `src/lib/design/ui.ts` | Added `ctaHeight`, `homepageGridGap`, `editorialImageCrop`, `trustIconSize`; standardized `imageHoverZoom` to 2% max |
| `src/components/ui/Button.tsx` | `sm` touch target 44px; `lg` = 52px CTA height |
| `src/components/sections/HeroSection.tsx` | Unified CTA heights; secondary uses `btn-secondary-premium`; removed nested spacing; `AccentBar` lg; shared hero grid |
| `src/components/homepage/HeroVisual.tsx` | Standard crop `center_22%`; shadow via frame token only |
| `src/components/sections/FeaturedProducts.tsx` | Unified grid gap, CTA height, badge wrap, price spacing, `imageHoverZoom` |
| `src/components/sections/BrandPromise.tsx` | `text-card-title`, standard grid gap, body `text-sm` |
| `src/components/sections/ScienceSection.tsx` | Split grid token; feature list uses `homepage-section-grid`; card title token |
| `src/components/sections/LifestyleSection.tsx` | Matching padding `md`; stable `4/5` aspect; editorial crop |
| `src/components/sections/ResearchTimeline.tsx` | Mobile line/node alignment; year shown once on mobile; standard crop |
| `src/components/sections/StatsBar.tsx` | Single-column mobile; borderless integrated band |
| `src/components/sections/NewsletterCTA.tsx` | `section-heading` token; removed double margins; primary CTA; 52px controls |
| `src/components/sections/Footer.tsx` | `footer-column-title` eyebrow token; grouped Legal & Support; icon size token |
| `src/components/trust/TrustWidgets.tsx` | Icon size 16px; `quality-icon-box-sm`; grid caps at lg:4 xl:8 |
| `src/components/trust/QualityStandardsGrid.tsx` | Accent bar lg; title size bump |
| `src/components/trust/TestimonialShowcase.tsx` | `focusRing` on filters; grid gap token; featured padding fix |

---

## UI issues fixed

### 1. Visual alignment
| Issue | Fix |
|-------|-----|
| Newsletter double `mt-6` + token margins | Removed redundant margins; use homepage section tokens |
| Science feature list ad-hoc `mt-8` | `homepage-section-grid` spacing |
| Timeline mobile node/card misalignment | `left-6` + `pl-[3.25rem]` |
| Hero nested `space-y-4` + flex gap | Single `hero-copy-block` rhythm |
| Product badge row `justify-between` drift | `flex-wrap gap-2` |
| Footer mascot label vs row alignment | `lg:text-left` + `items-center` baseline row |

### 2. Grid consistency
| Issue | Fix |
|-------|-----|
| Mixed section gaps (gap-5/6/7/8/10) | `homepageGridGap` = `gap-6 sm:gap-7 lg:gap-8` |
| Split sections uneven gaps | `.homepage-split-grid` clamp token |
| Trust grid 8-col at lg (cramped) | `lg:grid-cols-4 xl:grid-cols-8` |
| Stats 2-col on 320px | `grid-cols-1 sm:grid-cols-2` |

### 3. Typography
| Issue | Fix |
|-------|-----|
| Four card title patterns | Standardized `text-card-title` |
| Newsletter `text-h1 font-bold` vs sections | `section-heading` (700) |
| Mixed body sizes base/sm | Card descriptions → `text-sm leading-[1.75]` |
| Footer column labels custom tracking | `.footer-column-title` = `text-eyebrow` |
| Duplicate homepage intro token override | Single `--space-section-intro` (32px) |

### 4. Images
| Issue | Fix |
|-------|-----|
| Mixed object-position values | `editorialImageCrop` → `center_22%` |
| Lifestyle aspect ratio jump at lg | Stable `aspect-[4/5]` |
| Hero duplicate inline shadow | Frame token only |
| Science stat card 16px radius | `--radius-card` (24px) |

### 5. Buttons
| Issue | Fix |
|-------|-----|
| Hero primary 52px / secondary 44px | Both `ctaHeight` (52px) |
| Featured View vs Notify height path | Shared `ctaHeight` + Button `lg` |
| Newsletter terra vs site green primary | `variant="primary"` |
| Button `sm` 40px vs 44px min | `h-11 min-h-[2.75rem]` |

### 6. Cards
| Issue | Fix |
|-------|-----|
| Product/quality hover shadow inverted | Default `shadow-soft`, hover `shadow-premium` |
| Science `md` vs Lifestyle `lg` padding | Both `padding="md"` |
| Product price double spacing | CSS `margin-top: auto` only |
| Featured testimonial double padding | `padding="none"` + explicit `p-8 sm:p-10` |
| Removed homepage glass blur override | Consistent 16px blur |

### 7. Icons
| Issue | Fix |
|-------|-----|
| Trust strip 17px vs hero 16px vs footer 14px | `trustIconSize` = `h-4 w-4` sitewide |
| Trust grid `!important` overrides | `.quality-icon-box-sm` modifier |

### 8. CSS clutter removed
- Duplicate `.homepage-section-header` / `.homepage-section-intro` blocks
- Obsolete dark `.homepage-footer-trust span` styles
- Duplicate `.homepage-product-card` shadow rules
- Duplicate `.quality-icon-box` definitions
- Duplicate `.homepage-trust-strip` row-gap
- `.homepage-main .glass-surface` blur downgrade
- Empty `.homepage-product-card` stub

---

## Before / after notes

**Before:** Sections felt “almost aligned” — mixed gaps, inverted hover shadows, four button height paths, typography weight drift, timeline mobile offset, trust icons at 3 sizes.

**After:** One spacing grid, one CTA height (52px), one editorial crop, one card elevation curve (soft → premium on hover), one card title scale, one footer label style. Homepage reads as a single intentional system.

---

## Responsive checklist

| Breakpoint | Verified |
|------------|----------|
| 320px | Stats 1-col; newsletter stacks; no horizontal overflow |
| 360px | Trust strip wraps cleanly |
| 390px | Hero min-height reduced to 72dvh |
| 414px | Product cards single column |
| 768px | Timeline single column; lifestyle order flip |
| 1024px | Split grids; mascots visible on hero |
| 1280px | Product 4-col grid |
| 1440px | Full 120px section rhythm |

---

## Accessibility checklist

| Check | Status |
|-------|--------|
| WCAG AA contrast (cream surfaces) | Maintained — green-900/800 on cream-50 |
| Focus rings (`terra-500` 3px) | Applied to testimonial filters; existing on CTAs |
| Keyboard navigation | Unchanged — no logic changes |
| Reduced motion | Card/button hover transforms disabled in CSS |
| Touch targets ≥44px | Button `sm` fixed; CTAs 52px |
| aria labels | Trust strip, stats, timeline, filters preserved |

---

## Performance impact

| Change | Impact |
|--------|--------|
| Removed testimonial carousel (Phase 14) | Less client JS — unchanged this phase |
| CSS consolidation | Slightly smaller effective stylesheet; fewer overrides |
| No new client components | Neutral |
| Stats band without glass cards | Lighter paint |
| Build CSS bundle | ~24.2 kB (stable) |

---

## Validation results

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors (21 pre-existing script warnings) |
| `npm run typecheck` | ✅ Pass |
| `npm test` | ✅ 118 tests passed |
| `npm run build` | ✅ Pass |

---

## Out of scope (unchanged)

Business logic, checkout, pricing, database, APIs, CMS, routing, SEO, metadata, tests.
