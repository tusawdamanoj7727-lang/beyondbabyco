# Phase 11.2 — Premium Content, Typography & Brand Storytelling

**Date:** 2026-07-02  
**Scope:** Editorial copy, microcopy, typography polish, brand voice — **no business logic, schema, auth, checkout, payment, or API changes**.

---

## Executive Summary

The storefront now speaks with one consistent editorial voice: warm, honest, research-led, and calm — inspired by premium global baby-care brands without generic ecommerce clichés.

**Central source of truth:** `src/lib/brand/copy.ts`

---

## Brand Voice Guide

### Personality
Warm · Honest · Premium · Scientific · Calm · Modern · Indian · Trustworthy

### We sound like
A thoughtful parent who happens to understand formulation science — never a billboard.

### We avoid
`100% safe`, `best`, `#1`, `chemical-free`, `perfect`, `game-changer`, `revolutionary`, `unlock`, `elevate your`

### We prefer
`Thoughtfully crafted`, `Developed through research`, `Gentle on delicate skin`, `Made with care in India`, `Created with parents in mind`

---

## Sections Rewritten

| Section | Before (sample) | After (sample) |
|---------|-----------------|----------------|
| **Hero** | "Every Baby Deserves The Safest Touch" | "Gentle care. Backed by science." |
| **Hero subcopy** | Generic safety/confidence pitch | Research-led, parent-focused editorial |
| **Brand Promise** | "Research, Safety & Love" | "Every formula begins with intention" |
| **Science** | "Powerful Research" | "Mindful ingredients. Rigorous research." |
| **Lifestyle** | "Made Safer Every Day" | "The quiet moments matter most" |
| **Research timeline** | Generic milestone labels | Narrative journey (2021–2026) |
| **Featured products** | "Our Launch Collection" | "Our launch line" + honest availability |
| **Categories** | "Everything Your Baby Needs" | "Care for every stage" |
| **Testimonials** | "Trusted By Families, Loved By Babies" | "Voices from our community" |
| **Newsletter** | "Stay Connected" | "Quiet updates for growing families" |
| **Mascots** | Generic friend descriptions | Editorial role copy per character |
| **Community** | "Parents Love BeyondBabyCo" | "Stories from our community" |
| **Footer** | Generic tagline | "Thoughtfully crafted baby care…" |
| **Ticker** | Emoji-heavy promos | Clean, editorial announcement lines |

---

## Hero Copy (Final Defaults)

```
Badge:    Created with parents · refined through research
Headline: Gentle care.
          Backed by science.
Subcopy:  Thoughtfully crafted baby care — developed over years of
          ingredient research, dermatological testing, and quiet
          listening to what families actually need.
Primary:  Explore the collection
Secondary: Our research story
```

---

## Microcopy Changes

| Context | Before | After |
|---------|--------|-------|
| Loading | "Loading…" | "Preparing something gentle…" |
| Search (pending) | "Searching…" | "Looking through the collection…" |
| Product grid (filters) | "No matches for your filters" | "We couldn't find a match" |
| Product grid (empty) | "No products found" | "The collection is growing" |
| Search (no results) | "No results found" | "Nothing matched that search" |
| Cart empty | "Your cart is empty" | "Your bag is waiting" |
| Wishlist empty | "Your wishlist is empty" | "Nothing saved yet" |
| 404 | "Page not found" | "This page isn't here" |
| Add to cart toast | "Added to cart" | "Added to your bag" |
| PDP tab empty states | Generic placeholders | Editorial, honest "will appear when published" |

All microcopy lives in `MICROCOPY` within `src/lib/brand/copy.ts`.

---

## Typography Improvements

| Change | Detail |
|--------|--------|
| Hero | Uses `.text-hero` token |
| Section headings | `.section-heading` / `.text-h1` |
| Newsletter dark section | `.text-h1` on cream background |
| Community | `.text-h2` |
| Brand promise cards | `.text-h3` |
| Product cards | `.text-card-title` |
| Body copy | `.text-body` with `.prose-width` (max 42rem) |
| Section subcopy | `max-width: 42rem` in CSS for readable line length |
| Cart page title | `.text-h1` |

Fonts unchanged from Phase 11.1: Montserrat 600–800 headings, Helvetica Neue body, no Arial.

---

## Product Copy

- **Homepage featured cards** — editorial descriptions, honest "Arriving 2026" pricing language
- **PDP tabs** — empty states use `MICROCOPY.pdp.*` (benefits, ingredients, directions, FAQ)
- **Safety panel** — softened to non-medical, patch-test guidance only
- **Sample reviews note** — honest disclosure via `MICROCOPY.pdp.reviewsSampleNote`

Database product content (CMS/Supabase) unchanged — only UI defaults and static fallbacks updated.

---

## Accessibility Impact

| Area | Status |
|------|--------|
| Heading hierarchy | Preserved — h1 hero, h2 sections, h3 cards |
| ARIA / sr-only | Unchanged — search listbox, pagination, section labels intact |
| Readable line length | Improved via `prose-width` (≈42rem / ~65 characters) |
| Screen reader text | Rating stars still include sr-only counts |
| Semantic HTML | No structural changes — same elements, better copy |
| Loading states | `role="status"` + `aria-live="polite"` on ModuleLoading |

---

## Files Changed (Key)

| File | Role |
|------|------|
| `src/lib/brand/copy.ts` | **New** — brand voice, homepage copy, microcopy |
| `src/lib/data.ts` | Wired to copy.ts + image URLs |
| `src/components/sections/*` | Homepage section defaults |
| `src/components/catalog/*` | Cart, wishlist, search, PDP, product grid |
| `src/components/reviews/CommunitySection.tsx` | Community editorial tone |
| `src/components/ui/ModuleLoading.tsx` | Premium loading message |
| `src/app/not-found.tsx` | 404 microcopy |
| `src/app/layout.tsx` | Site title metadata |
| `src/app/globals.css` | Section subcopy max-width |

---

## Validation

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors (pre-existing script warnings) |
| `npm run typecheck` | ✅ Pass |
| `npm run test` | ✅ 93/93 |
| `npm run build` | ✅ Pass |

---

## Remaining Recommendations

1. **CMS homepage content** — Re-publish homepage sections in admin so live CMS overrides match new editorial defaults (optional; fallbacks already updated).
2. **Trust Center / About / Research pages** — `lib/content/pages/*` still contain long-form content from prior phases; consider a Phase 11.3 pass to align with `BRAND_VOICE`.
3. **Admin microcopy** — Admin UI retains operational language (intentional); storefront-only scope in 11.2.
4. **Email templates** — `lib/communications/*` fonts updated in 11.1; body copy could be aligned in a future communications pass.
5. **Demo review data** — `lib/reviews/demo-data.ts` sample reviews retained for layout; flagged as sample in UI.

---

## Success Criteria

| Criterion | Status |
|-----------|--------|
| Premium editorial voice | ✅ |
| No placeholder hero copy | ✅ |
| No generic marketing superlatives in defaults | ✅ |
| No AI-sounding clichés in rewritten copy | ✅ |
| One consistent voice across storefront | ✅ |
| No functionality changes | ✅ |
| Feature freeze maintained | ✅ |

**Verdict:** Phase 11.2 complete — ready for manual editorial QA and visual review.
