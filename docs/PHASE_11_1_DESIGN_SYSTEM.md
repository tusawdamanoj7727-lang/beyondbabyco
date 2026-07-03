# Phase 11.1 — Premium Design System

**Date:** 2026-07-02  
**Scope:** Design language only — typography, spacing, buttons, cards, icons, backgrounds. No business logic changes.

---

## Summary

Established a single premium design system across the storefront foundation, cascading through shared CSS tokens, core UI components, and key surfaces (hero, product cards, section backdrops).

---

## Typography

| Token | Font | Weight | Usage |
|-------|------|--------|-------|
| `.text-hero` | Montserrat | 800 (ExtraBold) | Hero headlines |
| `.text-h1` / `.section-heading` | Montserrat | 800 | Page titles |
| `.text-h2` | Montserrat | 700 (Bold) | Section titles |
| `.text-h3` / `.text-subheading` | Montserrat | 600 (SemiBold) | Subsections |
| `.text-card-title` | Montserrat | 700 | Product & card titles |
| `.text-eyebrow` | Montserrat | 700 | Uppercase labels |
| `.text-label` | Helvetica Neue | 600 | Form labels |
| `.text-body` | Helvetica Neue | 400 | Body copy |
| `.text-caption` | Helvetica Neue | 400 | Helper text |

**Changes:**
- Removed **Arial** from all font stacks (`globals.css`, email brand tokens)
- Montserrat limited to weights **600, 700, 800** via `next/font`
- Body stack: `"Helvetica Neue", Helvetica, sans-serif` only
- Removed unused Geist font theme references

---

## Spacing

4px-base scale defined as CSS variables:

`--space-1` through `--space-24`, plus semantic tokens:

| Token | Value |
|-------|-------|
| `--space-section` | `clamp(4rem, 8vw, 7.5rem)` |
| `--space-section-sm` | `clamp(3rem, 6vw, 5rem)` |
| `--space-stack` | `clamp(1.5rem, 3vw, 2rem)` |
| `--space-grid` | `clamp(3rem, 6vw, 4.5rem)` |

Utility classes: `.section-padding`, `.section-padding-sm`, `.section-stack`, `.section-grid-gap`

---

## Buttons

Premium pill system (`rounded-full`):

| Variant | Style |
|---------|-------|
| **Primary** | Green gradient, soft shadow, hover elevation (`.btn-primary-premium`) |
| **Secondary** | Cream background, green border (`.btn-secondary-premium`) |
| **Ghost** | Transparent, subtle green hover (`.btn-ghost-premium`) |

Updated in `components/ui/Button.tsx`.

---

## Cards

One glass premium recipe (`.premium-card`):

- 24px radius (`--radius-card`)
- Cream glass background + blur
- Soft shadow
- Premium hover lift

Applied to `Card.tsx` default variant and `ProductCard.tsx`.

---

## Icons

- **Single family:** Lucide outline only (already site-wide)
- Standardized stroke: **1.75**
- New wrapper: `components/ui/Icon.tsx`
- Global rules in `.icon-outline` and `.icon-btn svg`

---

## Backgrounds

Enhanced layered premium backgrounds:

- Cream gradient base on `body`
- `PremiumSectionBackdrop`: gradients, organic blobs, noise grain, light vignette
- `HeroBackground`: added vignette layer
- Utilities: `.homepage-grain`, `.premium-vignette`, `.premium-page-bg`

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/globals.css` | Full token system, typography, spacing, buttons, cards, backgrounds |
| `src/app/layout.tsx` | Montserrat 600/700/800 only |
| `src/lib/design/tokens.ts` | **New** — programmatic tokens |
| `src/lib/design/ui.ts` | Extended utility exports |
| `src/components/ui/Button.tsx` | Premium variants + pill shape |
| `src/components/ui/Card.tsx` | Premium glass card default |
| `src/components/ui/Icon.tsx` | **New** — Lucide wrapper |
| `src/components/ui/PremiumSectionBackdrop.tsx` | Layered premium backgrounds |
| `src/components/sections/HeroSection.tsx` | `.text-hero` token |
| `src/components/homepage/HeroBackground.tsx` | Vignette |
| `src/components/catalog/ProductCard.tsx` | Premium card + title token |
| `src/components/trust/TrustIcons.tsx` | Consistent stroke |
| `src/lib/communications/brand.ts` | Removed Arial from email fonts |

---

## Validation

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` | ✅ 0 errors |

---

## Next Steps (optional)

- Migrate remaining ad-hoc `font-heading text-lg` patterns to `.text-card-title` / `.text-h3` incrementally
- Adopt `Icon` wrapper in high-traffic components for strict stroke consistency
- Run visual QA on admin surfaces (admin uses same globals.css tokens)
