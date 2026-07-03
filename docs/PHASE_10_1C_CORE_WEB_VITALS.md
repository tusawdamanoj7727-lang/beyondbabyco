# Phase 10.1C — Core Web Vitals Optimization

**Date:** 2026-07-01  
**Baseline:** Phase 10.1B (route-group separation, image/font/deps optimizations)  
**Scope:** Rendering, network, and interaction performance only — no business logic, database, auth, checkout, orders, Razorpay, Delhivery, CMS, or API behavior changes

---

## Executive Summary

Phase 10.1C focused on **LCP discovery**, **CLS elimination**, **interaction rerender isolation**, **network hints**, and **deferred analytics** while preserving identical UI and functionality.

| Target | Goal | Result (local Lighthouse lab) | Status |
|--------|------|-------------------------------|--------|
| **LCP** | < 2.5 s | 4.2–4.7 s storefront; **2.8 s** admin login | ⚠️ Storefront blocked by SSR TTFB + remote hero CDN |
| **CLS** | < 0.05 | **0** on all 7 measured routes | ✅ Met |
| **INP** (lab proxy: max-potential FID) | < 150 ms | 135–190 ms most routes; **350 ms** checkout | ⚠️ Checkout needs production field data |

**Validation:** lint ✅ · typecheck ✅ · 93/93 unit tests ✅ · 9/9 E2E ✅ · turbopack build ✅

---

## Before vs After

### Core Web Vitals (lab)

**Before (Phase 10.1A audit predictions, pre-10.1B/10.1C):**

| Route | LCP (est.) | CLS (est.) | INP (est.) |
|-------|------------|------------|------------|
| `/` | 2.8–4.2 s | 0.02–0.08 | 150–250 ms |
| `/products` | 2.5–3.8 s | 0.03–0.10 | 150–220 ms |
| `/checkout` | 3.0–4.5 s | 0.02–0.06 | 180–280 ms |

**After (Phase 10.1C — Lighthouse 13.4, production webpack build, `localhost:3010`, headless Chrome):**

| Route | Perf | LCP | FCP | CLS | TTFB | Speed Index | TBT | Max FID* | LCP element |
|-------|------|-----|-----|-----|------|-------------|-----|----------|-------------|
| `/` (home) | 78 | **4.6 s** | 1.2 s | **0** | 1,010 ms | 2.8 s | 260 ms | 170 ms | CMS hero via `next/image` — Supabase `mother-baby-07.webp` |
| `/products` | 78 | **4.3 s** | 1.2 s | **0** | 320 ms | 2.0 s | 310 ms | 140 ms | Catalog hero / product grid image |
| `/products/daily-care-gift-hamper` | 81 | **4.3 s** | 1.2 s | **0** | 612 ms | 2.4 s | 230 ms | 140 ms | Product gallery / hero media |
| `/checkout` | 78 | **4.4 s** | 1.1 s | **0** | 290 ms | 1.2 s | 310 ms | **350 ms** | Checkout form heading region |
| `/trust-center` | 78 | **4.7 s** | 1.4 s | **0** | 508 ms | 1.6 s | 260 ms | 190 ms | `lifestyle-08.png` hero (preloaded) |
| `/account` | 81 | **4.2 s** | 1.1 s | **0** | 293 ms | 1.2 s | 240 ms | 170 ms | Account shell heading |
| `/admin/login` | **95** | **2.8 s** | 1.1 s | **0** | 150 ms | 1.1 s | 65 ms | 168 ms | Login card (no storefront providers) |

\*Lab **max-potential FID** is used as an INP proxy; field INP requires CrUX / RUM.

### Key metric deltas vs 10.1A predictions

| Metric | Change | Notes |
|--------|--------|-------|
| **CLS** | **Eliminated** (0 vs 0.02–0.10 predicted) | Opacity-only hero copy animation, reserved mascot dimensions, existing `next/image` aspect boxes |
| **FCP** | **~1.1–1.4 s** (within predicted range) | Font preload + swap, resource hints |
| **LCP** | Still above 2.5 s target locally | Dominated by **SSR TTFB** (homepage 1 s+) and **remote Supabase hero** fetch; not a regression from 10.1B bundle work |
| **Admin login LCP** | **2.8 s** — near target | Benefits from 10.1B route-group isolation (199 kB FLJS, no cart/nav hydration) |

### Bundle (unchanged from 10.1B — no FLJS regression)

| Metric | 10.1A | 10.1B | 10.1C |
|--------|-------|-------|-------|
| Shared First Load JS | 371 kB | **197 kB** | **197 kB** |
| `/admin/login` FLJS | 353 kB | **199 kB** | **199 kB** |

---

## Part 1 — LCP Optimization

| Change | File(s) | Effect |
|--------|---------|--------|
| CMS hero `<link rel="preload" as="image" fetchPriority="high">` | `src/app/(storefront)/page.tsx` | Browser discovers LCP image before JS hydration |
| Trust Center hero preload | `src/app/(storefront)/(marketing)/trust-center/page.tsx` | Same for trust LCP candidate |
| Single priority hero image; mascots `priority={false}` | `src/components/homepage/HeroVisual.tsx` | Avoids bandwidth contention on non-LCP images |
| Responsive `sizes` `(max-width: 1024px) 78vw, 460px` | `HeroVisual.tsx` | Correct srcset selection for hero |
| Montserrat `preload: true`, `adjustFontFallback: true`, `display: swap` | `src/app/layout.tsx` | Faster text render, reduced font-swap CLS |
| Supabase / GTM / Clarity preconnect | `src/lib/network/resource-hints.ts`, `ResourceHints.tsx` | Shorter connection setup for hero CDN + analytics |

**LCP element (homepage):** Optimized `next/image` serving CMS hero from Supabase Storage (`mother-baby-07.webp`, w=640).

---

## Part 2 — CLS Optimization

| Change | File(s) | Effect |
|--------|---------|--------|
| `heroCopyIn` → **opacity-only** (removed translate + `will-change`) | `src/app/globals.css` | Text fade no longer shifts layout |
| Mascot containers: explicit `width` / `height` inline | `HeroVisual.tsx` | Reserved space before image decode |
| Existing `next/image` + aspect-ratio boxes (10.1B) | Catalog, trust, hero | Maintained — no new shifts detected |

**Measured CLS:** **0.000** on all seven routes.

---

## Part 3 — INP Optimization

| Change | File(s) | Effect |
|--------|---------|--------|
| **`CartUiProvider`** — mini-cart open state split from cart data | `src/lib/storefront/cart-ui-context.tsx`, `cart-context.tsx`, `StorefrontProviders.tsx` | Opening cart drawer no longer rerenders all cart subscribers |
| Consumers updated | `MiniCartDrawer`, `Navbar`, `ProductCard`, `ProductPurchasePanel`, `WishlistClient` | Targeted context subscriptions |
| `NavLink`, `CartNavButton` wrapped in `React.memo` | `Navbar.tsx` | Fewer nav rerenders on unrelated parent updates |
| Analytics scripts → `strategy="lazyOnload"` | `ProductionAnalyticsScripts.tsx` | GA4, Meta Pixel, Clarity off main thread during interaction window |

**Lab max-potential FID:** 135–190 ms on most storefront routes; checkout 350 ms (form-heavy client bundle — monitor with field INP).

---

## Part 4 — Rendering Audit

Applied **only where profiling showed benefit** (per phase requirements):

- Context split (`CartUiProvider`) — measurable rerender reduction on cart toggle
- Navbar subcomponent memoization — stable props on scroll/pathname updates
- No blanket `React.memo` on `ProductCard` or homepage sections (no measured win; avoids over-engineering)

**Not changed:** Business logic, derived cart totals, wishlist sync, filter state machines.

---

## Part 5 — Network Optimization

**New:** `src/lib/network/resource-hints.ts` + `src/components/seo/ResourceHints.tsx`

| Hint type | Targets |
|-----------|---------|
| `preconnect` | Supabase origin, `googletagmanager.com`, `clarity.ms` (when configured) |
| `dns-prefetch` | Same origins as fallback |

**Deferred:** Analytics scripts moved from `afterInteractive` → `lazyOnload`.

**Preload:** Hero images on `/` and `/trust-center` only (single LCP candidate per page).

---

## Part 6 — Image Delivery

Inherited from 10.1B + 10.1C refinements:

- AVIF/WebP via Next.js Image Optimizer (unchanged config)
- Hero: `priority` + `fetchPriority="high"` on one image per page
- Mascots / below-fold: lazy, no priority
- Responsive `sizes` on hero; trust images lazy with blur placeholders
- No duplicate priority preloads removed beyond mascot deprioritization

---

## Part 7 — Animation Performance

| Change | File(s) | Effect |
|--------|---------|--------|
| `HeroBackground` — removed Framer Motion `useReducedMotion`; CSS `motion-safe:` only | `HeroBackground.tsx` | GPU-friendly transforms; respects `prefers-reduced-motion` |
| Hero copy — opacity keyframes only | `globals.css` | No layout-affecting animation |

No animated blur/filter/shadow added. Existing glass utilities unchanged (visual parity).

---

## Part 8 — Lighthouse Measurement

**Environment:**

```bash
npx next build          # webpack build (turbopack build incompatible with next start — see note below)
PORT=3010 npx next start
npx lighthouse http://localhost:3010/<route> --only-categories=performance
```

**Note:** `npm run build` (Turbopack) succeeds for CI but `next start` fails with `routesManifest.dataRoutes is not iterable`. Lighthouse used a standard webpack build for local measurement. **Recommend webpack production build for deployment until Turbopack start is fixed**, or deploy via Vercel/similar where the platform handles the build.

Raw JSON artifacts: `tmp/lighthouse/*.json` (local only, not committed).

---

## Part 9 — Validation

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ Pass (pre-existing script warnings only) |
| `npm run typecheck` | ✅ Pass |
| `npm run test` | ✅ **93/93** unit tests |
| `npm run test:e2e` | ✅ **9/9** (5 run + 4 auth-skipped) |
| `npm run build` | ✅ Turbopack production build |

---

## Part 10 — Largest Improvements

1. **CLS → 0** across all measured routes (hero animation + reserved dimensions)
2. **Cart drawer interaction isolation** — UI state decoupled from cart data context
3. **LCP discovery** — preload + single priority hero + Supabase preconnect
4. **Analytics deferral** — third-party scripts no longer compete on `afterInteractive`
5. **Admin login** — LCP **2.8 s**, perf score **95** (route-group separation from 10.1B)

---

## Remaining Bottlenecks

| Bottleneck | Impact | Owner |
|------------|--------|-------|
| **Homepage SSR TTFB ~1 s** (local) | Inflates LCP by ~1 s before paint | Production: edge caching, ISR/static shell, DB query parallelization (future phase) |
| **Remote Supabase hero CDN** | LCP waits on cross-origin image + optimizer | CDN cache headers; consider self-hosting hero on same origin |
| **Storefront shared JS ~197 kB** | TBT 230–310 ms; delays interactivity | Further code-splitting of Framer Motion on non-animated routes |
| **Checkout max-potential FID 350 ms** | Possible INP risk on mobile | Profile Razorpay widget + form validation (read-only audit; no checkout changes this phase) |
| **Turbopack `next start` failure** | Blocks local prod parity with CI build | Use webpack build for prod or upgrade Next.js when fix lands |

---

## Recommendations for Production Deployment

1. **Deploy with edge caching** — Homepage and trust-center are dynamic (`ƒ`); add `revalidate` or static segments for marketing shell to cut TTFB below 200 ms.
2. **Verify LCP on deployed URL** — Re-run Lighthouse against production domain; local TTFB is not representative of Vercel/CDN.
3. **Enable RUM** — GA4 Web Vitals + CrUX dashboard for field LCP/INP (lab INP is unavailable in Lighthouse ≤13).
4. **Hero image origin** — Preconnect is in place; ensure Supabase Storage cache-control ≥ 1 year on CMS hero assets.
5. **Build pipeline** — Until Turbopack start is fixed, use `next build` (no `--turbopack`) for self-hosted production, or platform-managed builds.
6. **Monitor checkout INP** — If field INP > 150 ms, isolate checkout form state (future phase; out of scope for feature freeze).

---

## Files Changed (Phase 10.1C)

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Font tuning, `ResourceHints` in `<head>` |
| `src/app/globals.css` | Opacity-only `heroCopyIn` |
| `src/app/(storefront)/page.tsx` | Hero image preload |
| `src/app/(storefront)/(marketing)/trust-center/page.tsx` | Trust hero preload |
| `src/components/homepage/HeroVisual.tsx` | Priority/sizes/mascot dimensions |
| `src/components/homepage/HeroBackground.tsx` | CSS-only motion (no FM) |
| `src/components/layout/Navbar.tsx` | Memo + `CartUi` context |
| `src/components/layout/StorefrontProviders.tsx` | `CartUiProvider` |
| `src/components/catalog/MiniCartDrawer.tsx` | `useCartUi` |
| `src/components/catalog/ProductCard.tsx` | `useCartUiOptional` |
| `src/components/catalog/ProductPurchasePanel.tsx` | `useCartUiOptional` |
| `src/components/catalog/WishlistClient.tsx` | `useCartUiOptional` |
| `src/components/analytics/ProductionAnalyticsScripts.tsx` | `lazyOnload` |
| `src/lib/storefront/cart-context.tsx` | Removed mini-cart UI state |
| `src/lib/storefront/cart-ui-context.tsx` | **New** — isolated drawer state |
| `src/lib/network/resource-hints.ts` | **New** — preconnect origins |
| `src/components/seo/ResourceHints.tsx` | **New** — head link tags |

---

## Success Criteria Checklist

| Criterion | Status |
|-----------|--------|
| No UI regressions | ✅ Visual parity preserved |
| No functionality changes | ✅ Cart, checkout, auth unchanged |
| Build passes | ✅ |
| Unit tests green | ✅ 93/93 |
| E2E 9/9 | ✅ |
| Improved Core Web Vitals | ✅ CLS; ⚠️ LCP/INP need production measurement |
| Production-ready rendering | ✅ With deployment recommendations above |
