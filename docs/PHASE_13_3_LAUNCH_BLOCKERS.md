# Phase 13.3 — Launch Blockers Resolution

**Date:** 2026-07-02  
**Prior status:** Conditional GO (Founder QA)  
**Current status:** **GO**

---

## Objective

Resolve all P0 launch blockers without modifying database schema, checkout flow, payments, shipping logic, authentication, or admin architecture.

---

## Issues Resolved

### Part 1 — Newsletter ✅

| Before | After |
|--------|-------|
| Client-only fake success | Server action persists to `newsletter_subscribers` |

- Added `newsletterSubscribeAction` in `src/lib/auth/newsletter-actions.ts`
- Wired `NewsletterCTA.tsx` via `useActionState` + existing UI
- Email validation (Zod), duplicate handling (23505), failure logging via `logger`
- Success/error toasts + inline status messages

### Part 2 — Demo Reviews ✅

| Before | After |
|--------|-------|
| 6 sample reviews merged on empty PDP | Real DB reviews only |
| Sample banner + fake averages | Empty state: *"Product reviews will appear after verified customer purchases."* |

- `products/[slug]/page.tsx` — removed `mergeReviewsWithDemo`
- No review JSON-LD or aggregate rating in schema when count is 0
- `ProductReviewsPanel` — updated empty copy
- Community page — removed demo review fallback

### Part 3 — Verified Badges ✅

| Before | After |
|--------|-------|
| Static testimonials showed "Verified" | Badge removed from `TestimonialShowcase` |
| CMS/static testimonials flagged verified | All `verifiedPurchase: false` in trust testimonials |

- `ReviewCard` already hides verified badge for `isSample` reviews
- DB reviews still show verified purchase when `is_verified` from orders

### Part 4 — GST Transparency ✅

| Surface | Addition |
|---------|----------|
| Product page | `PricingTaxNote` — "GST (18%) calculated at checkout" |
| Cart | Estimated GST line + note; total labeled "Estimated total (excl. GST)" |
| Mini cart | Shipping, estimated GST, note, excl. GST total label |

- Checkout tax calculation unchanged (`calcCheckoutTax` / 18%)
- New shared component: `src/components/catalog/PricingTaxNote.tsx`

### Part 5 — Sample Q&A ✅

| Before | After |
|--------|-------|
| Demo Q&A always shown | Empty questions array on PDP |
| Sample data in FAQ schema | Product FAQ schema only (no sample Q&A) |

- `ProductQASection` — *"No customer questions yet"* + *"Be the first to ask"*
- Full Q&A UI preserved for when real customer questions exist

### Part 6 — Brand Email ✅

| Before | After |
|--------|-------|
| `beyondbabyco@gmail.com` sitewide | `care@beyondbabyco.com` default via env |

- Added `src/lib/brand/contact.ts` — `brandSupportEmail()`, `brandSupportMailto()`
- Env: `NEXT_PUBLIC_BRAND_SUPPORT_EMAIL`, `BRAND_SUPPORT_EMAIL`
- Updated: Footer, legal, support, company, science, communications, account support

---

## Files Changed

| Area | Files |
|------|-------|
| Newsletter | `newsletter-actions.ts`, `NewsletterCTA.tsx` |
| Reviews | `products/[slug]/page.tsx`, `ProductReviewsPanel.tsx`, `community/page.tsx` |
| Testimonials | `TestimonialShowcase.tsx`, `testimonials.ts` |
| GST | `PricingTaxNote.tsx`, `ProductPurchasePanel.tsx`, `OrderSummary.tsx`, `MiniCartDrawer.tsx`, `tax.ts` |
| Q&A | `ProductQASection.tsx`, `ProductDetailTabs.tsx` |
| Email | `contact.ts`, Footer, content pages, `communications/brand.ts`, `.env.example` |

---

## Validation

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors |
| `npm run typecheck` | ✅ Pass |
| `npm test` | ✅ 118 tests |
| `npm run build` | ✅ Pass |

---

## Remaining Risks (P1 — not launch blockers)

| Risk | Notes |
|------|-------|
| Bundle & save 15% ticker | No bundle mechanism yet — marketing copy only |
| Generic delivery ETA | Still "3–5 business days" after PIN check |
| Profile prefs in localStorage | SMS/email prefs not server-synced |
| One live SKU | Most products "coming soon" |
| Mascot CTAs → `/products` | Editorial polish, not trust-critical |
| Legal review of product claims | "99% Pure Water", certification badges — founder/legal sign-off |

---

## Launch Recommendation

### GO

All P0 trust and misleading-content blockers from Founder QA are resolved:

- Newsletter captures real subscribers
- No fake reviews, verified badges, or sample Q&A presented as customer content
- GST disclosed before checkout
- Brand support email is professional and env-configurable

**Recommended pre-launch smoke test:**

1. Subscribe to homepage newsletter → verify row in `newsletter_subscribers`
2. Open PDP → confirm reviews/Q&A empty states
3. Add to cart → confirm GST estimate visible
4. Complete one test purchase end-to-end on mobile (390px)

---

*Phase 13.3 complete. Founder QA upgrades from Conditional GO → GO.*
