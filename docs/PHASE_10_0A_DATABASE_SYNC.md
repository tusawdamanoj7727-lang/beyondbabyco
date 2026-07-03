# BeyondBabyCo — Phase 10.0A Database Migration Audit & Synchronization

**Date:** 2026-07-01  
**Project:** `dawywibxularpygspogp.supabase.co`  
**Objective:** Align connected Supabase database with application-expected schema.  
**Constraint:** No application business-logic changes. Database synchronization only.

---

## Executive Summary

| Metric | Value |
|--------|------:|
| Migration files on disk | **23** |
| Migrations verified applied | **7** |
| Migrations missing / partial | **15** (+ 003 indeterminate) |
| Missing core tables | **8** |
| E2E pass rate (pre-sync) | **7/9** |
| New repair migration required | **No** — existing files cover all gaps |

**Root cause:** The database received `001`, `002`, `004`, `005`, `006`, `022`, and `023` (partial/out-of-order), but **migrations 007–021 were never applied**. This matches the E2E failures on `/admin/products` (`products.sale_price`) and `/admin/customers` (`customers.deleted_at`).

**Repair approach (selected):** Paste `supabase/database/APPLY_ALL.sql` in Supabase SQL Editor. All migrations are idempotent — safe to re-run.

---

## Part 1 — Migration Audit

### Applied migrations (verified via REST sentinels)

| # | File | Sentinel |
|---|------|----------|
| 001 | `001_initial_schema.sql` | `roles` table |
| 002 | `002_indexes.sql` | `products.slug` |
| 004 | `004_storage.sql` | `media_folders` |
| 005 | `005_seed.sql` | `permissions` |
| 006 | `006_auth_functions.sql` | `current_user_role()` RPC |
| 022 | `022_admin_bootstrap.sql` | `marketing.view` permission |
| 023 | `023_delhivery_integration.sql` | `shipment_tracking` table |

### Missing migrations (must apply)

| # | File | Key gap |
|---|------|---------|
| 007 | `007_products_admin.sql` | `products.sale_price`, `products.deleted_at`, `log_audit()` |
| 008 | `008_categories_brands_admin.sql` | `categories.deleted_at`, brand extensions |
| 009 | `009_media_library.sql` | `media_library.original_name`, DAM metadata |
| 010 | `010_homepage_cms.sql` | `hero_slides.description`, CMS permissions |
| 011 | `011_inventory_warehouse.sql` | `warehouses.is_default`, PO extensions |
| 012 | `012_orders_fulfillment.sql` | `orders.internal_notes`, shipment fields |
| 013 | `013_customers_crm.sql` | **`customers.deleted_at`**, `customer_events` |
| 014 | `014_reviews_moderation.sql` | `reviews.deleted_at` |
| 015 | `015_returns_rma.sql` | `returns` table + RMA workflow |
| 016 | `016_coupons_promotions.sql` | `coupons.deleted_at`, gift cards |
| 017 | `017_shipping_logistics.sql` | `shipping_zones`, `shipping_rates`, carriers |
| 018 | `018_payments_gateway.sql` | `payment_gateways`, `payment_logs`, webhooks |
| 019 | `019_reports_analytics.sql` | `saved_reports`, `analytics_snapshots` |
| 020 | `020_accounting_finance.sql` | `journal_entries`, ledger, GST |
| 021 | `021_marketing_automation.sql` | `marketing_campaigns`, `email_queue` |

### Indeterminate

| # | File | Notes |
|---|------|-------|
| 003 | `003_rls.sql` | RLS helper functions (`is_admin`, etc.) exist in Postgres but are **not REST-exposed**. Requires `DATABASE_URL` for pg_catalog verification. **Apply via APPLY_ALL.sql** — idempotent `create or replace`. |

### Out-of-order application detected

| Observation | Detail |
|-------------|--------|
| 023 applied before 007–021 | `shipment_tracking` exists while core module columns missing |
| 022 applied without 007–021 | Bootstrap permissions seeded; catalog/CRM columns missing |
| No `schema_migrations` table | Project uses manual SQL Editor application, not Supabase CLI tracking |

---

## Part 2 — Schema Verification

### Core tables

| Domain | Table | Status |
|--------|-------|--------|
| Products | `products` | ✅ exists — ⚠️ missing columns from 007 |
| Categories | `categories` | ✅ — ⚠️ missing `deleted_at` (008) |
| Collections | N/A | Collections are admin/filter concept; no dedicated table |
| Brands | `brands` | ✅ — ⚠️ missing extensions (008) |
| Variants | `product_variants` | ✅ |
| Customers | `customers` | ✅ — ⚠️ missing `deleted_at` (013) |
| Profiles | `profiles` | ✅ |
| Orders | `orders` | ✅ — ⚠️ missing fulfillment columns (012) |
| Order Items | `order_items` | ✅ |
| Payments | `payments` | ✅ |
| Shipments | `shipments` | ✅ — Delhivery columns from 023 ✅ |
| Coupons | `coupons` | ✅ — ⚠️ missing `deleted_at` (016) |
| Wishlist | `wishlist` | ✅ |
| Cart | `cart`, `cart_items` | ✅ |
| Addresses | `customer_addresses` | ✅ |
| Media | `media_library`, `media_folders` | ✅ — ⚠️ missing DAM columns (009) |
| Marketing | `marketing_campaigns` | ❌ missing (021) |
| Communications | `email_queue` | ❌ missing (021) |
| Analytics | `saved_reports`, `analytics_snapshots` | ❌ missing (019) |
| Operations | health via API | ✅ (no dedicated table) |
| Reports | `saved_reports` | ❌ missing (019) |
| Homepage CMS | `homepage_settings`, `hero_slides` | ✅ — ⚠️ missing hero columns (010) |
| Research | content-only | N/A (no DB table) |
| Testimonials | `testimonials` | ✅ |
| Notifications | `notifications` | ✅ |
| Audit Logs | `audit_logs` | ✅ |
| Settings | `settings` | ✅ |

---

## Part 3 — Missing Columns (E2E blockers highlighted)

| Column | Table | Source migration | E2E impact |
|--------|-------|------------------|------------|
| **`sale_price`** | `products` | 007 | ❌ `/admin/products` 500 |
| **`deleted_at`** | `products` | 007 | Admin trash filter |
| **`deleted_at`** | `customers` | 013 | ❌ `/admin/customers` 500 |
| `deleted_at` | `categories` | 008 | Admin category trash |
| `deleted_at` | `reviews` | 014 | Review moderation |
| `deleted_at` | `coupons` | 016 | Coupon trash |
| `original_name` | `media_library` | 009 | Media metadata |
| `description` | `hero_slides` | 010 | Homepage CMS |
| `is_default` | `warehouses` | 011 | Inventory default warehouse |
| `internal_notes` | `orders` | 012 | Order admin notes |
| `status`, `is_vip`, `tags` | `customers` | 013 | CRM filters |

**No duplicate columns needed.** All gaps are covered by existing migrations 007–021.

---

## Part 4 — Functions

| Function | Expected in | REST probe | Status |
|----------|-------------|------------|--------|
| `current_user_role()` | 006 / 022 | ✅ callable | Applied |
| `current_user_permissions()` | 006 | ✅ callable | Applied |
| `is_admin()` | 003 | not REST-exposed | Apply 003 (idempotent) |
| `is_manager()` | 003 | not REST-exposed | Apply 003 |
| `is_staff()` | 003 | not REST-exposed | Apply 003 |
| `has_role(text)` | 003 | not REST-exposed | Apply 003 |
| `log_audit(...)` | 007 | not REST-exposed | Apply 007 |
| `log_activity(...)` | 006 | not REST-exposed | Apply 006 (likely exists) |
| `set_updated_at()` | 001 | trigger function | Apply 001 (likely exists) |

---

## Part 5 — RLS

RLS policies are defined in `003_rls.sql` and extended in module migrations (013, 014, 015, etc.).

| Check | Status |
|-------|--------|
| Admin login works | ✅ |
| `current_user_role()` returns `admin` | ✅ |
| RLS helper functions | ⚠️ Unverified without pg_catalog — apply 003 |
| Module-specific policies (returns, payments, marketing) | ❌ Missing until 015–021 applied |

**Recommendation:** Apply full `APPLY_ALL.sql` to ensure policies match code expectations.

---

## Part 6 — Repair Plan

### Selected method: Supabase SQL Editor (manual)

No new repair migration created. Existing migrations are idempotent.

```bash
# 1. Regenerate combined file (already done)
npm run db:combine

# 2. Open Supabase Dashboard → SQL Editor
# 3. Paste entire contents of: supabase/database/APPLY_ALL.sql
# 4. Run (may take 30–60 seconds)
```

### Alternative: CLI sync (when DATABASE_URL available)

```bash
# Add to .env.local:
# DATABASE_URL=postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/postgres

npm run audit:database
npm run sync:database -- --missing-only
```

### Migrations to apply (minimum for E2E 9/9)

If applying individually instead of APPLY_ALL:

```
003_rls.sql          # RLS helpers (idempotent)
007_products_admin.sql
008_categories_brands_admin.sql
009_media_library.sql
010_homepage_cms.sql
011_inventory_warehouse.sql
012_orders_fulfillment.sql
013_customers_crm.sql   ← fixes customers E2E
014_reviews_moderation.sql
015_returns_rma.sql
016_coupons_promotions.sql
017_shipping_logistics.sql
018_payments_gateway.sql
019_reports_analytics.sql
020_accounting_finance.sql
021_marketing_automation.sql
```

**Never modify** historical migrations already applied. Re-running via `IF NOT EXISTS` / `ON CONFLICT` guards is safe.

---

## Part 7 — Post-Sync Verification

After pasting `APPLY_ALL.sql`:

```bash
npm run audit:database          # expect 23/23 applied
npm run check:admin             # admin bootstrap + RPCs
npm run validate:migrations     # file ordering
```

### Application smoke checks

| Module | Route | Expected after sync |
|--------|-------|---------------------|
| Products | `/admin/products` | Loads without `sale_price` error |
| Customers | `/admin/customers` | Loads without `deleted_at` error |
| Orders | `/admin/orders` | ✅ already passing |
| Homepage CMS | `/admin/homepage` | ✅ already passing |
| Media | `/admin/media` | Full DAM metadata |
| Analytics | `/admin/analytics` | Reports tables available |

---

## Part 8 — E2E Results

### Pre-sync (current)

| Test | Result |
|------|--------|
| Homepage loads | ✅ |
| Admin login page | ✅ |
| Admin redirect | ✅ |
| Health endpoint | ✅ |
| Storefront navigation | ✅ |
| Orders (authenticated) | ✅ |
| Homepage CMS (authenticated) | ✅ |
| **Products (authenticated)** | ❌ `column products.sale_price does not exist` |
| **Customers (authenticated)** | ❌ `column customers.deleted_at does not exist` |

**Score: 7/9**

### Post-sync target

```bash
E2E_ADMIN_EMAIL=admin@beyondbabyco.com E2E_ADMIN_PASSWORD=Admin@123456 npm run test:e2e
```

**Target: 9/9**

---

## Part 9 — Tooling Added (ops scripts, not app code)

| Script | Purpose |
|--------|---------|
| `npm run audit:database` | Probe live schema vs migration sentinels |
| `npm run sync:database -- --missing-only` | Apply missing migrations via `DATABASE_URL` |
| `scripts/.database-audit.json` | Machine-readable audit output |

---

## Validation

| Command | Result |
|---------|--------|
| `npm run validate:migrations` | ✅ 23 files, sequential order |
| `npm run db:combine` | ✅ `APPLY_ALL.sql` regenerated |
| `npm run audit:database` | ⚠️ 7/23 applied, 15 missing |
| `npm run test:e2e` | ⚠️ 7/9 (blocked by schema) |

---

## Remaining Risks

1. **Manual SQL Editor step pending** — E2E cannot reach 9/9 until `APPLY_ALL.sql` is run.
2. **003 RLS unverified** — apply via APPLY_ALL; add `DATABASE_URL` for pg_catalog audit.
3. **Out-of-order history** — full idempotent re-apply recommended over cherry-picking.
4. **PostgREST schema cache** — APPLY_ALL includes `NOTIFY pgrst, 'reload schema'` in sync script; SQL Editor auto-refreshes within ~30s.

---

## Next Steps

1. **Paste** `supabase/database/APPLY_ALL.sql` in Supabase SQL Editor → Run.
2. **Verify:** `npm run audit:database` (expect all ✓).
3. **Re-run E2E:** `E2E_ADMIN_EMAIL=admin@beyondbabyco.com E2E_ADMIN_PASSWORD=Admin@123456 npm run test:e2e`.
4. **Optional:** Add `DATABASE_URL` to `.env.local` for future automated sync.

---

*Audit generated by Phase 10.0A. Live probe output: `scripts/.database-audit.json`*
