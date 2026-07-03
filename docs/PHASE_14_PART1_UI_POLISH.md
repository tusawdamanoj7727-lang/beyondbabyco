# Phase 14 Part 1 — Homepage UI Polish

**Goal:** Apple × Aesop × CeraVe minimal premium DTC homepage — UI-only, no logic/API/CMS/routing changes.

**Date:** 2026-07-03

---

## Files changed

| File | Scope |
|------|--------|
| `src/app/globals.css` | Design tokens (`--shadow-nav`, `--shadow-premium`), header height (82px), Phase 14 utility classes |
| `src/components/layout/Navbar.tsx` | 3-column grid layout, centered nav (`gap-12`), logo padding, underline alignment |
| `src/components/layout/CustomerUserMenu.tsx` | Profile chip vertical centering |
| `src/components/layout/CustomerUserMenuPanel.tsx` | Dropdown `top-full` alignment |
| `src/components/brand/Logo.tsx` | Footer uses default (dark) logo on cream background |
| `src/components/trust/TrustWidgets.tsx` | Strip: flex center alignment, 17px icons, separators |
| `src/components/sections/HeroSection.tsx` | Premium spacing rhythm, trust pill alignment |
| `src/components/homepage/HeroVisual.tsx` | Hero mascots (Bella, Gigi, Poppy), CSS-only float |
| `src/components/trust/QualityStandardsGrid.tsx` | Unified `quality-icon-box`, equal card heights |
| `src/components/sections/FeaturedProducts.tsx` | Consistent crop, badge row, price/button alignment, softer shadow |
| `src/components/sections/ResearchTimeline.tsx` | Increased year spacing, consistent media height |
| `src/components/trust/TestimonialShowcase.tsx` | Tighter whitespace, centered filters, equal card heights |
| `src/components/sections/NewsletterCTA.tsx` | Cream background + green CTA (WCAG AA contrast) |
| `src/components/sections/Footer.tsx` | Cream Aesop-style footer, readable text, larger mascots with glow |

---

## Before / After

### Part 1 — Header / Navbar
| Before | After |
|--------|-------|
| Logo crowded against nav; flex spacer pushed links off-center | CSS grid `1fr auto 1fr` — logo left, nav truly centered, icons right |
| Uneven link gaps (`gap-x-6` / `gap-x-8`) | Uniform `gap-12` |
| Muddy clay shadow on scroll | Premium `--shadow-nav: 0 8px 40px rgba(0,0,0,.05)` |
| ~92px header | ~82px (`--header-nav: 5.125rem`) |
| Underline offset from text | Column flex link + full-width underline under label |

### Part 2 — Trust strip
| Before | After |
|--------|-------|
| Icon + stacked text misaligned | `inline-flex items-center gap-2` per item |
| Mixed icon sizes | Consistent 17px icons |
| Card-style pills on strip | Clean inline strip with vertical separators (sm+) |

### Part 3 — Hero
| Before | After |
|--------|-------|
| Tight copy rhythm | `hero-copy-block` clamp gaps (headline → body → CTAs) |
| Flat image frame | Premium shadow + stage padding |
| No mascots | Bella Bunny, Gigi, Poppy Panda — subtle CSS float, hidden on mobile |

### Part 4–8 — Sections
| Area | Change |
|------|--------|
| Quality Promise | Shared icon container, `min-h` cards |
| Featured Products | `object-[center_20%]`, aligned badges/price/buttons |
| Timeline | `gap-14`/`gap-16`, fixed media height via CSS |
| Testimonials | Reduced header whitespace, equal-height grid cards |

### Part 10–11 — Newsletter & Footer
| Before | After |
|--------|-------|
| Dark green newsletter — low contrast text | Cream background, green-900 headings, green CTA button |
| Dark green footer — dark-on-dark links | Cream footer, green-900 headings, green-700 links |
| Small mascots blending in | 88–96px mascots with drop-shadow glow |

### Part 12 — Global tokens
- `--shadow-nav`, `--shadow-premium`
- Shared `.quality-icon-box`, `.homepage-product-card`, `.homepage-newsletter`, `.homepage-footer`

---

## Performance impact

| Area | Impact |
|------|--------|
| Hero mascots | Server-rendered `<Image>` + CSS `@keyframes` — no new client JS |
| Navbar | Same client component; layout CSS-only change |
| Footer mascots | Existing client `Mascot` — unchanged count |
| Newsletter / Footer | Class-only color changes — zero bundle delta |
| Build | Passes; no new dependencies |

**Net:** Neutral to slightly positive — hero mascots avoid framer-motion by using CSS animation.

---

## Screenshots checklist

Manual QA at these breakpoints:

- [ ] **320px** — No horizontal overflow; mobile nav drawer; trust strip wraps cleanly
- [ ] **390px** — Hero copy readable; product grid 1-col
- [ ] **768px** — Trust separators visible; timeline line centered
- [ ] **1024px** — Navbar 3-column grid; hero mascots visible; nav `gap-12`
- [ ] **1440px** — Section rhythm consistent; footer columns baseline-aligned

**Sections to capture:**
- [ ] Navbar — logo spacing, centered links, profile chip
- [ ] Trust strip — icon/text alignment
- [ ] Hero — spacing + mascots around image
- [ ] Quality Promise grid
- [ ] Featured products row
- [ ] Research timeline
- [ ] Testimonials filters + cards
- [ ] Newsletter cream section
- [ ] Footer cream + mascot row

---

## Validation

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors (21 pre-existing script warnings) |
| `npm run typecheck` | ✅ Pass |
| `npm test` | ✅ 118 tests passed |
| `npm run build` | ✅ Pass |

---

## Out of scope (unchanged)

Business logic, APIs, Supabase, checkout, pricing, CMS, routing, SEO, metadata, tests.
