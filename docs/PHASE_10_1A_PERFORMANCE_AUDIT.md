# Phase 10.1A — Enterprise Performance Audit

**Date:** 2026-07-01  
**Scope:** Analysis only — no application code modified  
**Build:** `npm run build` (Next.js 15.5.19, Turbopack) — **PASS**

---

## Executive Summary

BeyondBabyCo is production-functional with a solid App Router architecture (Server Components for data fetching, route-level splitting for 150+ routes). However, **First Load JS is uniformly high (~351–376 kB)** across storefront and admin due to a **large shared client bundle** (~371 kB) that includes cart/wishlist providers, global Navbar, Framer Motion, Lucide icons, and Radix Dialog — even on routes that do not need them.

| Area | Grade | Key Finding |
|------|-------|-------------|
| Build / routing | B+ | 150+ routes compile; SSG for 18 CMS `[slug]` pages; rest dynamic |
| Shared bundle | C | **371 kB First Load JS shared by all routes** |
| Middleware | C | **227 kB** — Supabase session refresh on every `/admin` + `/api` request |
| Client components | C+ | **190 `"use client"` modules**; ~30 storefront sections could be Server Components |
| Dependencies | B− | `react-hook-form`, `next-seo` appear **unused** in `src/` |
| Images | C | **126 MB / 734 PNGs** in `public/images`; largest **2.6 MB** each; no blur placeholders |
| Fonts | C+ | Montserrat loads **9 weights**; body uses system Helvetica (good) |
| CSS | B | **19.4 kB** compiled CSS; extensive glass/blur utilities |
| Animations | C+ | Framer Motion on homepage/trust; CSS hero animations with `will-change` |
| Dynamic imports | D | **Zero** `dynamic()` usage — no lazy loading of heavy client modules |
| Bundle analyzer | — | `@next/bundle-analyzer` **not installed**; `npm run analyze` non-functional |

**Top 3 pre-launch wins (estimated +15–25 Lighthouse perf points on storefront):**

1. **Route-group layouts** — move `StorefrontProviders` + `Navbar` out of root layout so `/admin/*` does not hydrate cart/wishlist/nav chrome (~40–60 kB client savings on admin; cleaner separation).
2. **Replace scroll-reveal Framer Motion** on marketing/trust sections with CSS `@keyframes` + `IntersectionObserver` wrapper or static CSS (remove ~25–40 kB gzip from shared graph on content pages).
3. **Hero & trust images** — convert largest PNGs to WebP/AVIF, serve via `next/image` with `priority` + `sizes` on LCP candidates (~1–2 s LCP improvement on `/` and `/trust-center`).

---

## Part 1 — Build Analysis

### Command

```bash
npm run build   # next build --turbopack — exit 0
```

### Shared JavaScript

| Metric | Value |
|--------|-------|
| **First Load JS shared by all** | **371 kB** |
| Compiled CSS chunk | 19.4 kB |
| Other shared chunks | 37.4 kB |

### Largest Shared Chunks (from build output)

| Chunk | Size | Likely contents |
|-------|------|-----------------|
| `5ff88aef7f7fc270.js` | 68.2 kB | React / Next runtime |
| `b4223ebfc37b31a8.js` | 66.1 kB | App framework + providers |
| `205090b594e2b4c0.js` | 59.0 kB | Supabase client / auth utilities |
| `a461a213fad618f8.js` | 46.1 kB | Framer Motion + animation lib |
| `c0554c4ff803263d.js` | 17.3 kB | Lucide icons (tree-shaken subset) |
| `e8cc5b18916ff2de.js` | 12.7 kB | Radix Dialog |
| `cbf0b6e0bf772868.js` | 12.4 kB | Cart / wishlist context |
| `798274f8af96cdd9.js` | 11.4 kB | UI primitives (Button, Card, Toast) |

*Disk sizes (uncompressed): largest chunk files are 250–305 kB each in `.next/static/chunks/`.*

### Largest Routes (First Load JS)

| Route | Route JS | First Load JS | Rendering |
|-------|----------|---------------|-----------|
| `/` (homepage) | 25.2 kB | **376 kB** | ƒ Dynamic |
| `/admin/communications` | 12.1 kB | **371 kB** | ƒ Dynamic |
| `/trust-center` | 18.2 kB | **369 kB** | ƒ Dynamic |
| `/admin/homepage` CMS | 10.2 kB | **369 kB** | ƒ Dynamic |
| `/admin/reviews/preview` | 10.2 kB | **369 kB** | ƒ Dynamic |
| `/[slug]` CMS pages | 14.7 kB | **366 kB** | ● SSG (18 paths) |
| `/products/[slug]` PDP | 14.2 kB | **365 kB** | ƒ Dynamic |
| `/checkout` | 8.12 kB | **360 kB** | ƒ Dynamic |
| `/products` catalog | 6.53 kB | **357 kB** | ƒ Dynamic |
| `/admin/login` | 2.53 kB | **353 kB** | ƒ Dynamic |

**Observation:** Route-specific JS is modest (2–25 kB). Performance pain is almost entirely in the **shared 371 kB shell**.

### Static vs Dynamic

| Type | Count | Examples |
|------|-------|----------|
| ○ Static | 1 | `/robots.txt` |
| ● SSG | 1 route (+18 `[slug]` paths) | `/about`, `/our-story`, `/research`, … |
| ƒ Dynamic | ~150 routes | Homepage, products, checkout, all admin |

### Middleware

| Metric | Value |
|--------|-------|
| **Middleware size** | **227 kB** |
| Matcher | `/admin/:path*`, `/api/:path*` |
| Responsibilities | Supabase `getUser()` session refresh, admin guard, CSRF (API), rate limiting, security headers |

**Impact:** Every admin page navigation and API call pays middleware cold-start + Supabase auth validation cost. Acceptable for admin; monitor p95 on `/api/checkout/*` under load.

### Server vs Client Components (high level)

| Category | Approx. count | Notes |
|----------|---------------|-------|
| Server pages/layouts | ~120 route files | Data fetching, guards, metadata |
| Client modules (`"use client"`) | **190** | See Part 3 |
| API routes | 22 | 0 B client JS |

---

## Part 2 — Bundle Analysis

### `@next/bundle-analyzer` Status

| Item | Status |
|------|--------|
| Package installed | **No** |
| `npm run analyze` script | Present (`ANALYZE=true next build --turbopack`) |
| Treemap generated | **No** — analyzer not wired in `next.config.ts` |

**Recommendation (Phase 10.1B):** Install `@next/bundle-analyzer` as devDependency and wrap config when `ANALYZE=true` to produce HTML treemaps for CI artifacts.

### Manual Bundle Graph (inferred)

```
371 kB Shared First Load JS
├── React 19 + react-dom          ~70 kB
├── Next.js client runtime        ~60 kB
├── Supabase browser client       ~45 kB
├── Framer Motion                 ~35–45 kB
├── Lucide React (partial)        ~15–20 kB
├── Radix Dialog                  ~12 kB
├── Cart + Wishlist + Toast ctx   ~15 kB
├── Navbar + MiniCartDrawer       ~25 kB
├── UI primitives (Button/Card)   ~10 kB
└── Misc hooks/utilities          ~30 kB
```

### Duplicate / Heavy Packages

| Package | Issue |
|---------|-------|
| `framer-motion` + CSS animations | Dual animation systems — CSS in `globals.css` + FM in 16 modules |
| `lucide-react` + custom `Icon.tsx` admin | Two icon systems (storefront Lucide, admin inline SVG sprite) |
| `@supabase/ssr` + `@supabase/supabase-js` | Required pair; appears once in graph but loaded on all storefront pages via providers |

### Dead Code Signals

| Signal | Detail |
|--------|--------|
| No `dynamic()` imports | Zero lazy-loaded client components |
| `react-hook-form` | In `package.json`, **0 imports in `src/`** |
| `next-seo` | **0 imports in `src/`** (metadata via Next.js `Metadata` API) |
| `styles/globals.css` | Stub file ("TODO Phase 2") — unused duplicate |
| `@theme` Geist font vars | Referenced in CSS but **not loaded** in `layout.tsx` |

### Hydration-Heavy Components (client boundary on critical path)

1. `StorefrontProviders` → cart, wishlist, toast, MiniCartDrawer
2. `Navbar` → Radix mobile menu, Lucide icons, cart badge, scroll spy
3. `HeroSection` + `HeroVisual` + `HeroBackground` → homepage LCP region
4. Trust page sections (8 client components with `MotionSection`)
5. `Button` / `Card` — marked `"use client"` globally; `Card` imports Framer Motion even when `animated={false}`

---

## Part 3 — Client Component Audit

**Total:** 190 `"use client"` modules  
**Admin:** 94 (expected — tables, forms, dialogs)  
**Storefront / shared:** 96

### Storefront Client Components — Classification

| Category | Count | Why client? | Server Component candidate? |
|----------|-------|-------------|----------------------------|
| Admin `*Client.tsx` | 94 | State, mutations, tables | No — interactivity required |
| Catalog / checkout | 22 | Cart, filters, gallery, payment UI | Partial — product grid shell could SSR |
| Marketing sections | 22 | Framer scroll reveals, hero scroll CTAs | **Yes** — 15+ sections only animate on scroll |
| Trust sections | 8 | `MotionSection` wrappers | **Yes** — content is static |
| Layout / providers | 6 | Context, pathname, cart | Partial — split by route group |
| Auth forms | 4 | Form state | No |
| UI primitives | 5 | `Button`, `Card`, `Badge`, `Toast`, `AccentBar` | **Yes** for Button/Badge — no hooks needed |
| Analytics | 2 | Pageview listener | No |

### High-Impact Unnecessary Client Rendering

| Component | Current reason | Recommendation |
|-----------|----------------|----------------|
| `components/ui/Button.tsx` | `"use client"` + CSS classes only | Convert to Server Component (no state) |
| `components/ui/Badge.tsx` | `"use client"` | Server Component |
| `components/sections/Footer.tsx` | Reveal animations | Server + CSS fade-in |
| `components/trust/*Section.tsx` (×8) | MotionSection scroll reveal | Server + CSS `@media (prefers-reduced-motion)` |
| `components/sections/StatsBar.tsx` | MotionSection | Server + CSS |
| `HideOnAdmin` | Pathname check | Route-group layouts eliminate need |

### Context / State on Global Path

```
RootLayout
  └── StorefrontProviders (client)
        ├── CartProvider
        ├── WishlistProvider
        ├── CartSyncEffect
        ├── MiniCartDrawer (Radix Dialog)
        └── ToastProvider (Framer Motion)
  └── Navbar (client) — NOT hidden on /admin
```

**Critical finding:** Admin routes (`/admin/*`) still hydrate **Navbar + full cart/wishlist stack** because only `AnnouncementBar` and `StorefrontFooter` are wrapped in `HideOnAdmin`. Admin First Load JS (~359–371 kB) includes storefront commerce UI.

---

## Part 4 — Dependency Audit

### `package.json` Dependencies

| Package | Used? | Weight concern | Notes |
|---------|-------|----------------|-------|
| `next` 15.5.19 | Yes | — | Turbopack build |
| `react` / `react-dom` 19 | Yes | High (required) | — |
| `framer-motion` | Yes (16 files) | **High** | Homepage, trust, Card, Toast, admin Shell |
| `lucide-react` | Yes (37 files) | Medium | Storefront icons; optimized via `optimizePackageImports` |
| `@radix-ui/react-dialog` | Yes (10 files) | Medium | Drawers/modals — appropriate |
| `@supabase/ssr` + `supabase-js` | Yes | Medium | Auth + realtime |
| `@sentry/nextjs` | Conditional | Medium | Only when `SENTRY_DSN` set |
| `react-hook-form` | **No imports in src/** | Medium | **Remove candidate** |
| `next-seo` | **No imports in src/** | Low | **Remove candidate** — using native Metadata API |
| `zod` | Yes | Low | Validation |
| `clsx` + `tailwind-merge` | Yes | Low | — |
| `server-only` | Yes | None | — |

### DevDependencies (performance-relevant)

| Package | Notes |
|---------|-------|
| `sharp` | Used by Next.js image optimizer — good |
| `@playwright/test` | E2E only — not in prod bundle |

### Duplicate Functionality

| Overlap | Files |
|---------|-------|
| Animation: Framer + CSS | `lib/animations.ts` + `globals.css` keyframes |
| Icons: Lucide + admin `Icon.tsx` | Intentional split; no dedup needed |
| SEO: `next-seo` vs `buildPageMetadata()` | Remove `next-seo` |

---

## Part 5 — Image Audit

### Configuration (`next.config.ts`)

| Setting | Value |
|---------|-------|
| Formats | AVIF, WebP |
| deviceSizes | 640–1920 |
| imageSizes | 16–256 |
| minimumCacheTTL | 24 h |
| remotePatterns | `**.supabase.co` storage |

### Asset Inventory

| Location | Files | Total size |
|----------|-------|------------|
| `public/images/` | 734 images | **~126 MB** |
| Largest single file | `hero-background-02.png` | **2.6 MB** |
| Largest folder | `generated/hero/phase-8-1/mother-baby/` | **39.8 MB** |

### Top Image Categories

| Area | Folder | Size | Format |
|------|--------|------|--------|
| Hero | `generated/hero/phase-8-1/*` | ~93 MB | PNG (unoptimized) |
| Homepage CMS | `generated/homepage/phase-8-2/*` | ~20 MB | PNG |
| Products | `generated/products/phase-8-5/*` | ~5 MB | PNG |
| Brand / logo | `icons/`, brand paths | <1 MB | PNG/SVG |

### `next/image` Usage

| Metric | Value |
|--------|-------|
| Files importing `next/image` | ~20 |
| Raw `<img>` tags | **~15** (admin thumbnails, hero trust badges, CMS previews) |
| `priority` prop usage | Logo (nav), HeroVisual mascots, ReviewGallery lightbox |
| `placeholder="blur"` / `blurDataURL` | **0** — none configured |
| Responsive `sizes` | Good on ProductCard, Logo, ReviewGallery; missing on some trust images |

### Per-Area Verdict

| Area | next/image | sizes | priority | blur | WebP/AVIF |
|------|------------|-------|----------|------|-----------|
| Hero | Partial (`HeroVisual`, `BrandSceneImage`) | Partial | Partial (mascots) | No | Only via optimizer when using `Image` |
| Products | Yes (`ProductCard`, `ProductGallery`) | Yes | Lazy default | No | Yes when via `Image` |
| Homepage sections | Mixed | Partial | No on section backgrounds | No | PNGs served static from `/public` |
| Trust Center | Mostly static server components | Limited | No | No | PNG backgrounds |
| Admin media | Raw `<img>` in tables | N/A | No | No | No |
| Reviews gallery | Yes | Yes | Yes on modal | No | Yes |

**Risk:** Static PNGs in `/public` bypass Next image optimizer — browsers download full 2+ MB files on hero/trust pages.

---

## Part 6 — Font Audit

### Current Setup (`src/app/layout.tsx`)

```typescript
const montserrat = Montserrat({
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
  subsets: ["latin"],
});
```

| Item | Status |
|------|--------|
| Font | Google Fonts — Montserrat |
| Weights loaded | **9 weights (200–900)** — likely 3–4 needed (400, 600, 700, 800) |
| Subsets | `latin` only — good |
| Display | `swap` — good |
| Preload | Automatic via `next/font` |
| Body font | **Helvetica/Arial system stack** — excellent (zero download) |
| Unused | `@theme` references `--font-geist-sans/mono` — never loaded |

**Estimated waste:** Loading 9 Montserrat weights ≈ **180–250 kB** over the wire; trimming to 4 weights saves ~100 kB.

---

## Part 7 — CSS Audit

### Output

| File | Size |
|------|------|
| Compiled CSS chunk | **19.4 kB** (gzip, in First Load JS) |
| Source `app/globals.css` | ~660 lines |

### Tailwind v4

- Uses `@import "tailwindcss"` + `@theme inline` — modern pipeline
- Design tokens well-organized in `:root`

### Notable Patterns

| Pattern | Occurrences | Perf impact |
|---------|-------------|-------------|
| `backdrop-filter: blur()` | 10+ utility classes (`.glass-surface`, `.nav-glass`, `.drawer-panel`) | **GPU-heavy** on scroll |
| `will-change: transform` | `.hero-copy`, `.interactive-lift`, `.motion-button` | Good intent; limit to animating elements |
| `@keyframes` hero/ticker/float | 8 keyframe blocks | GPU-friendly (`translate3d`) |
| `prefers-reduced-motion` | Present for hero, shimmers, lifts | **Good accessibility** |
| Duplicate file | `src/styles/globals.css` (stub) | Dead file |

### Unused / Low-Value CSS

- Geist font theme tokens (no font loaded)
- Some admin-only utilities may tree-shake poorly if imported globally

---

## Part 8 — Animation Audit

### Framer Motion (16 importing modules)

| Usage | Components | Cost |
|-------|------------|------|
| Scroll reveal | `MotionSection`, `Reveal`, trust sections, homepage sections | Intersection observers × N sections on homepage |
| UI feedback | `Card` (animated prop), `ToastProvider`, admin `Shell` | Always in bundle |
| Product gallery | `ProductGallery` | PDP only but FM still in shared chunk |
| Mascot float | `Mascot.tsx` | Infinite loop animations |

**Expensive patterns:**

- `whileInView` on **every homepage section** (~12 observers)
- `floatingAnimation` infinite loops on 5 hero mascots
- `Card` imports FM even for static cards

### CSS Animations (preferred, already present)

| Animation | Location | GPU-safe? |
|-----------|----------|-----------|
| `heroCopyIn`, `heroBlob`, `heroCloud` | `globals.css` | Yes (`translate3d`) |
| `ticker` (24s linear infinite) | TickerBar | Yes (transform) |
| `float` / mascot CSS | Mascot component | Yes |
| `shimmer` skeleton | Loading states | Uses `background-position` — moderate |
| `backdrop-filter` on dialogs | Dialog overlay | **Expensive** — blur(4px) |

### Layout Animations

- No Framer `layout` prop usage detected — good (avoids layout thrashing)

### Filter / Blur Animations

- Dialog overlays use `backdrop-filter: blur(4px)` — acceptable for modals
- Nav glass uses `blur(14px)` persistently — **always composited on scroll**

---

## Part 9 — Lighthouse Prediction

*Estimates for production deploy on Vercel-like infra, mobile simulation, no CDN edge caching of HTML. Actual scores require live audit.*

| Page | Performance | Accessibility | Best Practices | SEO | Primary bottlenecks |
|------|-------------|---------------|----------------|-----|---------------------|
| `/` | **58–68** | 92–96 | 92–96 | 95–100 | 371 kB JS, hero PNG LCP, FM scroll observers, Montserrat weights |
| `/products` | **62–72** | 90–95 | 92–96 | 90–95 | Shared JS, product grid hydration |
| `/products/[slug]` | **55–68** | 88–94 | 90–95 | 90–95 | Gallery client JS, multiple images, FM |
| `/checkout` | **60–72** | 90–94 | 88–94 | N/A (noindex) | CheckoutClient + Razorpay embed load |
| `/account` | **65–78** | 90–95 | 92–96 | N/A | Lighter page JS; still inherits shared shell |
| `/trust-center` | **52–65** | 90–95 | 92–96 | 95–100 | 18.2 kB route JS + 8 motion sections + large PNG hero |
| `/admin` | **70–85** | 88–94 | 90–95 | N/A | Large but acceptable for internal; unnecessary storefront providers |

### Core Web Vitals (predicted mobile)

| Metric | Homepage | PDP | Trust |
|--------|----------|-----|-------|
| LCP | 2.8–4.2 s | 2.5–3.8 s | 3.0–4.5 s |
| INP | 150–250 ms | 150–220 ms | 180–280 ms |
| CLS | 0.02–0.08 | 0.03–0.10 | 0.02–0.06 |

---

## Part 10 — Optimization Roadmap

### P0 — Pre-launch (high impact, moderate risk)

| # | Item | Perf gain | Bundle reduction | Complexity | Risk |
|---|------|-----------|------------------|------------|------|
| P0-1 | **Route groups:** `(storefront)/layout.tsx` with Providers+Navbar; `(admin)/layout.tsx` without | +8–12 Lighthouse pts (admin) | −40–60 kB admin FLJS | Medium | Low — structural only |
| P0-2 | **Trim Montserrat** to 400, 600, 700, 800 | +2–4 pts LCP | −80–120 kB fonts | Low | Low |
| P0-3 | **Hero LCP image:** WebP/AVIF + `next/image` + `priority` + explicit `sizes` | +5–10 pts LCP | N/A (transfer) | Medium | Low |
| P0-4 | **Remove unused deps:** `react-hook-form`, `next-seo` | +0–1 pt | −15–25 kB install/build | Low | Low |

### P1 — Post-launch sprint 1

| # | Item | Perf gain | Bundle reduction | Complexity | Risk |
|---|------|-----------|------------------|------------|------|
| P1-1 | Replace homepage/trust **Framer scroll reveals** with CSS + optional lazy observer | +5–8 pts | −25–40 kB shared | Medium | Low |
| P1-2 | Convert `Button`/`Badge` to Server Components; lazy-load FM `Card` only when `animated` | +2–4 pts | −10–15 kB | Low | Low |
| P1-3 | **`dynamic()` import** heavy clients: `CheckoutClient`, `ProductGallery`, admin `RichTextEditor` | +3–6 pts route-specific | Route-level −20–40 kB | Medium | Medium |
| P1-4 | Batch-convert `public/images` PNG → WebP (CI script) | +5–8 pts on image-heavy pages | −60–80% transfer | Medium | Low |
| P1-5 | Wire `@next/bundle-analyzer` + CI artifact | Diagnostic | — | Low | None |

### P2 — Optimization pass

| # | Item | Perf gain | Bundle reduction | Complexity | Risk |
|---|------|-----------|------------------|------------|------|
| P2-1 | Add `blurDataURL` placeholders for product/hero images | +2–3 pts CLS/LCP | Small | Medium | Low |
| P2-2 | Reduce persistent `backdrop-filter` on navbar (solid bg fallback on low-end) | +2–4 pts scroll | — | Low | Low |
| P2-3 | Middleware: narrow Supabase refresh to admin-only paths that need it | −20–50 ms TTFB admin | — | High | Medium |
| P2-4 | Admin table thumbnails → `next/image` with fixed dimensions | Admin perf | — | Low | Low |
| P2-5 | Enable Sentry tracing sampling (when DSN set) | Observability | +small JS if enabled | Low | Low |

### P3 — Nice to have

| # | Item | Perf gain | Complexity |
|---|------|-----------|------------|
| P3-1 | Partial prerender (PPR) for homepage product sections | +3–5 pts | High |
| P3-2 | Redis edge rate limiter (multi-instance) | Reliability | Medium |
| P3-3 | Replace infinite mascot float with CSS only | +1–2 pts CPU | Low |
| P3-4 | Delete unused `src/styles/globals.css` stub | Hygiene | Trivial |
| P3-5 | Consolidate icon systems or lazy-load Lucide per route | −5–10 kB | Medium |

---

## Part 11 — Expected Lighthouse Improvements

If **P0 + P1** implemented:

| Page | Current (est.) | After P0+P1 (est.) | Delta |
|------|----------------|---------------------|-------|
| `/` | 58–68 | **72–82** | +12–14 |
| `/products` | 62–72 | **75–85** | +10–13 |
| `/products/[slug]` | 55–68 | **68–80** | +12–15 |
| `/checkout` | 60–72 | **72–82** | +10–12 |
| `/trust-center` | 52–65 | **68–78** | +14–16 |
| `/admin` | 70–85 | **82–92** | +10–12 |

---

## Validation

```bash
npm run build   # ✅ PASS (2026-07-01)
```

No application code, UI, database, or business logic was modified during this audit.

---

## Appendix A — Client Component File Count by Area

| Area | Files |
|------|-------|
| Admin modules | 94 |
| Storefront catalog/checkout | 22 |
| Homepage / sections / trust | 22 |
| Layout / providers / auth | 14 |
| Campaigns / reviews / account | 18 |
| UI / hooks / lib client | 20 |

## Appendix B — Bundle Analyzer Next Steps

To generate treemap in Phase 10.1B:

```bash
npm install -D @next/bundle-analyzer
# Wrap next.config.ts with withBundleAnalyzer when process.env.ANALYZE === 'true'
npm run analyze
# Opens .next/analyze/client.html
```

## Appendix C — Key Config References

- Build config: `next.config.ts` (`optimizePackageImports`, image formats)
- Root layout: `src/app/layout.tsx` (fonts, global providers)
- Middleware: `src/middleware.ts` (227 kB)
- Animations: `src/lib/animations.ts`, `src/app/globals.css`
- Performance hints: `src/lib/operations/performance.ts`

---

**Phase 10.1A complete.** Ready for prioritized implementation in Phase 10.1B (optimization execution) when feature freeze lifts.
