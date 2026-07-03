# Phase 13.2 — Homepage Performance & Final Visual Cleanup

**Date:** 2026-07-02  
**Status:** Complete  
**Scope:** Homepage quality only — no DB, API, auth, checkout, or business-logic changes.

---

## Performance improvements

| Area | Before | After |
|------|--------|-------|
| Hero section | Client component (`useCallback` scroll handlers) | **Server component** — anchor CTAs, no hydration for copy |
| Featured products | Client + Framer Motion per card (8+ observers) | **Server section** + CSS `scroll-reveal-item` stagger |
| Card component | Always `motion.div` (Framer on every card) | **Static DOM** unless `animated={true}` |
| Science stat badge | Infinite Framer `floatingAnimation` loop | **Static** `hero-stat-card` (no continuous repaint) |
| Hero mascots | Floating Framer loops × 3 | **Static** mascots on hero visual |
| Section backdrops | 3× `blur-3xl` orbs per section | **Gradient-only** backdrops (removed heavy blurs) |
| Hero stat cards | `backdrop-filter: blur(20px)` | Solid cream background + `shadow-card` |
| Glass surfaces (homepage) | 16px blur everywhere | **10px blur** under `.homepage-main` |
| Section spacing | `clamp(4rem, 8vw, 7.5rem)` | **`clamp(3rem, 6vw, 5.5rem)`** — less scroll distance |

### Remaining recommendations

- Convert below-fold sections (`BrandPromise`, `Lifestyle`, `Footer`) from Framer `Reveal` grids to CSS `ScrollReveal` in a future pass.
- Newsletter mascot still uses floating animation — acceptable below fold; disable if profiling shows jank on low-end devices.
- Consider `content-visibility: auto` on timeline entries for very long pages.

---

## Images fixed / verified

All homepage sections resolve through the existing FLUX asset pipeline (`generated-assets.ts`, `visual-assets.ts`, `BrandSceneImage`):

| Section | Image source | Status |
|---------|--------------|--------|
| Hero | `resolveHeroContent` + `HeroVisual` / `EDITORIAL.hero` | ✓ priority + blur |
| Featured Collection | `resolveProductVisual` per launch SKU | ✓ lazy + sizes |
| Why BeyondBabyCo (Brand Promise) | `brandPromisePhoto` defaults | ✓ lazy + blur |
| Science | `sciencePhoto()` / CMS | ✓ lazy + blur |
| Lifestyle | `lifestylePhoto()` / CMS | ✓ lazy + blur |
| Research timeline | `resolveVisualUrl` + slot assignments | ✓ lazy + blur |
| Testimonials | `testimonialPortrait` / CMS avatars | ✓ lazy |
| Newsletter | `newsletterPhoto` / `EDITORIAL.newsletter` | ✓ lazy + blur |
| Footer | Logo PNG (no gradient placeholders) | ✓ |

No placeholder gradients or empty image containers in active homepage paths.

---

## Sections removed

- **Shop by Category** (`CategoriesSection`) removed from homepage render.
- `featured_categories` forced **disabled** in storefront payload (CMS schema unchanged; admin editor remains for future use).

---

## Featured Collection (launch catalog)

- Heading: **Featured Collection**
- Grid: **8 products** — 1 × Available Now (Baby Wipes) + 7 × Coming Soon
- **Notify Me** preserved via `NotifyMeButton` client island
- Storefront always serves launch catalog unless CMS publishes explicit `productIds`

---

## Visual polish

- Tighter section padding, grid gaps, and intro spacing
- Reduced hero min-height and vertical padding
- Featured cards: `elevated` variant + `shadow-card` (lighter than glass + 48px shadow)
- Stats bar: compact padding
- Footer: reduced top/bottom padding
- Navbar/logo: existing scroll scale retained; global spacing tokens tightened

---

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

---

## Files touched (summary)

- `src/components/homepage/HomePageContent.tsx` — removed categories
- `src/components/sections/FeaturedProducts.tsx` — server + launch grid
- `src/components/sections/HeroSection.tsx` — server component
- `src/components/ui/Card.tsx` — static by default
- `src/components/ui/PremiumSectionBackdrop.tsx` — removed blur orbs
- `src/lib/homepage/storefront.ts` — launch catalog + disable categories
- `src/lib/brand/copy.ts` — Featured Collection copy
- `src/app/globals.css` — Phase 13.2 spacing & glass tuning
