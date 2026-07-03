# Phase 14 Part 2 — Premium Polish

**Goal:** Elevate homepage visual hierarchy to international premium DTC standard (Apple × Aesop × Ritual). UI-only — no logic, API, CMS, routing, or test changes.

**Date:** 2026-07-03

---

## Files changed

| File | Changes |
|------|---------|
| `src/app/globals.css` | Section rhythm tokens (120px / 24px / 32px / 80px), typography hierarchy, unified shadows/hover, `premium-image-frame`, stats band, timeline, product, testimonial, newsletter, footer utilities |
| `src/components/ui/Card.tsx` | Consistent `shadow-soft` / `shadow-premium` only — removed heavy `shadow-card` on variants |
| `src/components/homepage/HeroVisual.tsx` | Unified `premium-image-frame` on hero image |
| `src/components/sections/HeroSection.tsx` | Body line-height 1.75 |
| `src/components/sections/StatsBar.tsx` | Borderless integrated stats band (no card chrome) |
| `src/components/sections/BrandPromise.tsx` | Premium image frames, prose measure, wider grid gaps |
| `src/components/sections/ScienceSection.tsx` | Image left / text right, lighter feature headings, premium frame |
| `src/components/sections/LifestyleSection.tsx` | **Alternating layout** — text left, image right on desktop |
| `src/components/sections/FeaturedProducts.tsx` | Taller product images, 52px CTAs, stronger price, aligned badges |
| `src/components/sections/ResearchTimeline.tsx` | Thinner timeline line, circular year nodes, floating cards, taller media |
| `src/components/trust/QualityStandardsGrid.tsx` | `quality-promise-card` system, unified header rhythm |
| `src/components/trust/TestimonialShowcase.tsx` | Editorial layout — large featured story, grid below (carousel removed) |
| `src/components/sections/NewsletterCTA.tsx` | Editorial spacing, 52px input/button, 3:4 artwork ratio |
| `src/components/sections/Footer.tsx` | Grouped columns, more padding, mascot baseline alignment, lighter link motion |

---

## Before / After summary

| Area | Before | After |
|------|--------|-------|
| **Global spacing** | Mixed clamp values, compressed sections | `--space-section` up to 120px; heading 24px; intro 32px; grid 80px |
| **Typography** | Section headings 800 weight, 38ch | Hero stays bold; sections 700 weight; body 1.75 line-height; 40ch measure |
| **Images** | Mixed radius/shadow/border per section | Shared `.premium-image-frame` recipe |
| **Cards** | Heavy hover shadow, -3px lift | `shadow-premium` / `shadow-soft` only; -2px lift max |
| **Product grid** | 44px buttons, tight cards | Taller 4:4.75 images, 52px CTAs, stronger price hierarchy |
| **Science / Lifestyle** | Both image-left | Science: image left; Lifestyle: **text left, image right** |
| **Timeline** | Thick line, square nodes | Thin gradient line, circular year badges, elevated cards |
| **Stats** | Bordered glass cards | Integrated borderless stat band |
| **Quality promise** | Generic icon boxes | Gradient icon containers, equal-height cards, premium hover |
| **Testimonials** | Carousel + grid (CMS-like) | Editorial featured story + 3-card grid below |
| **Newsletter** | 48px controls, tight grid | 52px matched input/button, wider editorial gaps |
| **Footer** | 7-col crowded grid | 12-col grouped layout, 64–96px padding, mascots on baseline |
| **Micro-interactions** | Mixed durations, 3px lifts | Buttons 165ms, cards 220ms, links 150ms; ≤2% scale/lift |

---

## Performance impact

| Change | Impact |
|--------|--------|
| Removed testimonial carousel JS/timer | Slightly less client work |
| Stats band — no glass/blur cards | Lighter paint on scroll |
| CSS-only spacing/typography tokens | Zero bundle increase |
| No new dependencies or client components | Neutral |

---

## Responsive checklist

Verify at:

- [ ] **320px** — Stats 2-col; product 1-col; footer stacks; no overflow
- [ ] **390px** — Newsletter form stacks; testimonial featured readable
- [ ] **768px** — Lifestyle order flip; timeline single column
- [ ] **1024px** — Science/Lifestyle alternating layouts; product 4-col
- [ ] **1440px** — Full 120px section rhythm; footer 12-col grid

**Sections:** Hero · Trust strip · Stats · Promise · Science · Quality · Products · Lifestyle · Timeline · Testimonials · Newsletter · Footer

---

## Validation results

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors (21 pre-existing script warnings) |
| `npm run typecheck` | ✅ Pass |
| `npm test` | ✅ 118 tests passed |
| `npm run build` | ✅ Pass |

---

## Accessibility notes

- Contrast maintained on cream backgrounds (green-900 headings, green-700/800 body)
- Focus rings unchanged (`terra-500` / 3px)
- Reduced-motion: card/button hover transforms disabled via CSS
- Testimonial filters retain `role="tablist"` / `aria-selected`
- Newsletter form labels and error/status regions preserved

---

## Out of scope (unchanged)

Business logic, APIs, Supabase, checkout, pricing, CMS, routing, SEO, metadata, tests.
