# Phase 17 — Premium Collection Experience

World-class `/products` shopping presentation aligned with Phases 14–16 design tokens. **UI and CSS only** — no changes to APIs, database, checkout, auth, CMS, or business logic.

---

## Files changed

| File | Change |
|------|--------|
| `src/app/globals.css` | Phase 17 `.collection-*` design system (hero, search, chips, filters, grid, pagination, bundle, compare, sticky toolbar) |
| `src/app/(storefront)/products/page.tsx` | Premium layout, trust panel, bundle section, sticky toolbar, recently viewed |
| `src/components/catalog/CatalogHero.tsx` | Editorial collection hero with gradient overlay and typography tokens |
| `src/components/catalog/CatalogSearchBar.tsx` | Premium 52px search field with brand placeholder copy |
| `src/components/catalog/CategoryChips.tsx` | Snap-scroll chip rail with active states |
| `src/components/catalog/CatalogFilters.tsx` | Refine sidebar, premium filter options, mobile bottom sheet |
| `src/components/catalog/ActiveFilterChips.tsx` | Premium removable filter chips |
| `src/components/catalog/CollectionStickyToolbar.tsx` | Sticky sort/filter bar with scroll border state |
| `src/components/catalog/ProductGrid.tsx` | Collection grid, quick compare provider, premium pagination |
| `src/components/catalog/ProductCard.tsx` | Compare toggle on collection grid |
| `src/components/catalog/ProductCardSkeleton.tsx` | Premium skeleton + `CatalogPageSkeleton` loading state |
| `src/components/catalog/CatalogEmptyState.tsx` | Editorial empty state panel |
| `src/components/catalog/FeaturedCollections.tsx` | Homepage-style featured grid |
| `src/components/catalog/CatalogBundleRecommendations.tsx` | **New** — bundle recommendations panel |
| `src/components/catalog/QuickCompareContext.tsx` | **New** — client-side compare state (max 2 products) |
| `src/components/catalog/QuickCompareBar.tsx` | **New** — sticky compare action bar |
| `src/components/catalog/QuickCompareModal.tsx` | **New** — side-by-side compare modal |
| `src/components/catalog/RecentlyViewed.tsx` | Collection variant with homepage card grid |

---

## UI improvements

### Collection hero
- Full-width editorial hero with softer image opacity and deep gradient
- Eyebrow, title, and intro typography tokens (`collection-hero-*`)
- Generous vertical rhythm (`clamp(3.5rem, 8vw, 5.5rem)`)

### Search
- Premium pill search at 52px with soft shadow and terra focus ring
- Uses existing `MICROCOPY.search.placeholder` — redirects to `/search` unchanged

### Filters
- Desktop **Refine** sidebar with premium panel, grouped filter titles, hover options
- Mobile bottom sheet with “Show N products” CTA
- Price inputs, availability checkbox, and rating radios styled consistently

### Sorting
- 52px pill sort select aligned with PDP/collection CTA height
- Product count with bold emphasis

### Product grid
- Responsive 1 / 2 / 3 column grid with equal-height cards
- Homepage pedestal styling available via `homepage-product-card` on featured/related rows

### Empty state
- Editorial panel with mascot, hierarchy, and 52px CTAs

### Loading state
- `CatalogPageSkeleton` — toolbar shimmer + 6-card grid skeleton
- Used as Suspense fallback for main catalog content

### Pagination
- Premium pill page links with active state and soft hover

### Bundle recommendations
- **Complete your routine** panel using existing featured products (no new API)
- 3-column bundle item cards with 2% hover zoom
- “Bundle & save 15%” launch note — presentation only

### Recently viewed
- Added to collection page via `variant="collection"`
- Homepage 4-column grid from localStorage (existing fetch action)

### Quick compare
- Toggle up to 2 products from the grid (client-side only)
- Sticky compare bar + side-by-side modal (price, availability, age, rating)
- No checkout or cart logic changes

### Mobile filters
- Full-width bottom sheet with backdrop blur
- 52px filter trigger and apply button

### Sticky filter bar
- `CollectionStickyToolbar` sticks below navbar while browsing
- Border appears on scroll; holds sort, mobile filters, and active chips

---

## Performance impact

| Area | Impact |
|------|--------|
| JS bundle | Small increase on `/products` (~11.8 kB route) for compare context + sticky toolbar scroll listener |
| CSS | ~400 lines of scoped `.collection-*` utilities in `globals.css` |
| APIs | **None** — same server data fetching |
| Runtime | Compare uses in-memory product objects already on the page |
| LCP | Hero image retains `priority` + `fetchPriority="high"` |

---

## Validation

| Check | Result |
|-------|--------|
| `npm run lint` | ✅ 0 errors |
| `npm run typecheck` | ✅ Pass |
| `npm test` | ✅ 118 / 118 tests passed |
| `npm run build` | ✅ Production build succeeded |

---

## Constraints preserved

- No API, database, checkout, auth, or CMS changes
- Filter/sort/search URL params and routing unchanged
- Cart, wishlist, and product listing logic unchanged
- Compare and bundle sections are presentation-layer only
