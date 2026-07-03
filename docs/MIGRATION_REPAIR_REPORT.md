# Migration Repair Report — Phase 10.0B

**Generated:** 2026-07-01T11:10:07.261Z  
**Project:** https://dawywibxularpygspogp.supabase.co

## Root cause

`APPLY_ALL.sql` failed with **SQLSTATE 42P10** — `ON CONFLICT` target had no matching UNIQUE constraint.

| Migration | Issue | Fix |
|-----------|-------|-----|
| `009_media_library.sql` | `ON CONFLICT (slug)` on `media_folders` — only a **partial** unique index exists | Rewritten to `WHERE NOT EXISTS` (no functionality change) |

## Applied vs missing (007–021)

| Migration | Status |
|-----------|--------|
| 007_products_admin.sql | ❌ missing |
| 008_categories_brands_admin.sql | ❌ missing |
| 009_media_library.sql | ❌ missing |
| 010_homepage_cms.sql | ❌ missing |
| 011_inventory_warehouse.sql | ❌ missing |
| 012_orders_fulfillment.sql | ❌ missing |
| 013_customers_crm.sql | ❌ missing |
| 014_reviews_moderation.sql | ❌ missing |
| 015_returns_rma.sql | ❌ missing |
| 016_coupons_promotions.sql | ❌ missing |
| 017_shipping_logistics.sql | ❌ missing |
| 018_payments_gateway.sql | ❌ missing |
| 019_reports_analytics.sql | ❌ missing |
| 020_accounting_finance.sql | ❌ missing |
| 021_marketing_automation.sql | ❌ missing |

## ON CONFLICT audit (007–021)

| Migration | Table | Columns | Risk |
|-----------|-------|---------|------|
| 009_media_library.sql | role_permissions | PRIMARY KEY | verify_unique_constraint |
| 010_homepage_cms.sql | role_permissions | PRIMARY KEY | verify_unique_constraint |
| 013_customers_crm.sql | role_permissions | PRIMARY KEY | verify_unique_constraint |
| 014_reviews_moderation.sql | role_permissions | PRIMARY KEY | verify_unique_constraint |
| 015_returns_rma.sql | role_permissions | PRIMARY KEY | verify_unique_constraint |
| 017_shipping_logistics.sql | role_permissions | PRIMARY KEY | verify_unique_constraint |
| 018_payments_gateway.sql | role_permissions | PRIMARY KEY | verify_unique_constraint |
| 019_reports_analytics.sql | role_permissions | PRIMARY KEY | verify_unique_constraint |
| 020_accounting_finance.sql | role_permissions | PRIMARY KEY | verify_unique_constraint |
| 021_marketing_automation.sql | role_permissions | PRIMARY KEY | verify_unique_constraint |

## Grouped by migration

### 007_products_admin.sql — missing

- **Sentinel:** `products.sale_price`

### 008_categories_brands_admin.sql — missing

- **Sentinel:** `categories.deleted_at`

### 009_media_library.sql — missing

- **Sentinel:** `media_library.original_name`
- **ON CONFLICT statements:** 1
  - `role_permissions` (PRIMARY KEY) — verify_unique_constraint

### 010_homepage_cms.sql — missing

- **Sentinel:** `hero_slides.description`
- **ON CONFLICT statements:** 1
  - `role_permissions` (PRIMARY KEY) — verify_unique_constraint

### 011_inventory_warehouse.sql — missing

- **Sentinel:** `warehouses.is_default`

### 012_orders_fulfillment.sql — missing

- **Sentinel:** `orders.internal_notes`

### 013_customers_crm.sql — missing

- **Sentinel:** `customers.deleted_at`
- **ON CONFLICT statements:** 1
  - `role_permissions` (PRIMARY KEY) — verify_unique_constraint

### 014_reviews_moderation.sql — missing

- **Sentinel:** `reviews.deleted_at`
- **ON CONFLICT statements:** 1
  - `role_permissions` (PRIMARY KEY) — verify_unique_constraint

### 015_returns_rma.sql — missing

- **Sentinel:** `returns.id`
- **ON CONFLICT statements:** 1
  - `role_permissions` (PRIMARY KEY) — verify_unique_constraint

### 016_coupons_promotions.sql — missing

- **Sentinel:** `coupons.deleted_at`

### 017_shipping_logistics.sql — missing

- **Sentinel:** `shipping_zones.deleted_at`
- **ON CONFLICT statements:** 1
  - `role_permissions` (PRIMARY KEY) — verify_unique_constraint

### 018_payments_gateway.sql — missing

- **Sentinel:** `payment_gateways.id`
- **ON CONFLICT statements:** 1
  - `role_permissions` (PRIMARY KEY) — verify_unique_constraint

### 019_reports_analytics.sql — missing

- **Sentinel:** `saved_reports.id`
- **ON CONFLICT statements:** 1
  - `role_permissions` (PRIMARY KEY) — verify_unique_constraint

### 020_accounting_finance.sql — missing

- **Sentinel:** `journal_entries.id`
- **ON CONFLICT statements:** 1
  - `role_permissions` (PRIMARY KEY) — verify_unique_constraint

### 021_marketing_automation.sql — missing

- **Sentinel:** `marketing_campaigns.id`
- **ON CONFLICT statements:** 1
  - `role_permissions` (PRIMARY KEY) — verify_unique_constraint

## Missing schema objects (from audit)

### Tables
- `marketing_campaigns`
- `marketing_segments`
- `email_queue`
- `saved_reports`
- `analytics_snapshots`
- `customer_events`
- `payment_gateways`
- `payment_logs`

### Functions (REST/pg)
- `is_admin()`
- `is_manager()`
- `is_staff()`
- `has_role()`
- `log_audit()`
- `log_activity()`
- `set_updated_at()`

## Repair artifacts

- `scripts/database-repair.sql` — additive constraints/indexes only
- `009_media_library.sql` — seed insert uses `WHERE NOT EXISTS`
- `npm run sync:database -- --from=007` — statement-level sync with 42P10 skip

## Next steps

1. `npm run db:combine` — regenerate APPLY_ALL.sql with 009 fix
2. Paste **APPLY_ALL.sql** in Supabase SQL Editor **OR** `npm run sync:database -- --from=007` with `DATABASE_URL`
3. `npm run audit:database` — expect 23/23
4. `npm run test:e2e` — target 9/9
