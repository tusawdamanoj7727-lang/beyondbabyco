# BeyondBabyCo — Database Architecture

Enterprise ecommerce schema for Supabase / PostgreSQL. This phase is **database design only** — no application code, CRUD, or admin UI.

## Migration files (run in order)

| File | Purpose |
|------|---------|
| `001_initial_schema.sql` | Extensions, enum types, all tables, constraints, defaults, `updated_at` triggers. |
| `002_indexes.sql` | Performance indexes for products, orders, customers, inventory, reviews, etc. |
| `003_rls.sql` | Row Level Security helper functions + policies for admin / manager / support / customer / anonymous. |
| `004_storage.sql` | Storage buckets and object access policies. |
| `005_seed.sql` | Baseline roles, permissions, default categories, settings. |

### How to apply

```bash
# Using the Supabase CLI (recommended)
supabase db reset            # local dev, applies migrations in supabase/
# or pipe each file to psql against your database:
psql "$DATABASE_URL" -f supabase/database/001_initial_schema.sql
psql "$DATABASE_URL" -f supabase/database/002_indexes.sql
psql "$DATABASE_URL" -f supabase/database/003_rls.sql
psql "$DATABASE_URL" -f supabase/database/004_storage.sql
psql "$DATABASE_URL" -f supabase/database/005_seed.sql
```

## Conventions

- **Primary keys:** `uuid` via `gen_random_uuid()` (except `profiles.id` which is the `auth.users` id).
- **Timestamps:** `created_at` on every table; `updated_at` on mutable tables, auto-maintained by the `set_updated_at()` trigger.
- **Money:** `numeric(12,2)` / `numeric(14,2)`, currency stored as ISO `char(3)` (default `INR`).
- **Enums:** `product_status`, `order_status`, `payment_status`, `shipment_status`, `discount_type`, `movement_type`.
- **Integrity:** foreign keys with deliberate `on delete` behavior, `unique` constraints on natural keys (slugs, SKUs, codes, emails), and `check` constraints on ranges (ratings 1–5, non-negative money/quantities).

---

## Tables by domain

### Auth & access control
- **roles** — system roles (admin, manager, support, customer).
- **permissions** — granular capability codes.
- **role_permissions** — many-to-many roles↔permissions.
- **profiles** — 1:1 extension of `auth.users`; links a user to a role.

### Catalog / products
- **brands** — product brands.
- **categories** — top-level (self-referencing `parent_id` for nesting).
- **subcategories** — children of a category.
- **products** — core catalog item (pricing, status, ratings rollup).
- **product_images** — gallery images per product.
- **product_variants** — purchasable SKUs (size/pack) per product.
- **product_tags** / **product_tag_map** — taggable classification.
- **ingredients** / **product_ingredients** — formulation transparency.
- **benefits** / **product_benefits** — marketing benefit chips.

### Inventory & procurement
- **warehouses** — stock locations.
- **suppliers** — vendors.
- **inventory** — quantity per variant per warehouse (unique pair).
- **stock_movements** — audit of every in/out/adjustment/transfer.
- **purchase_orders** / **purchase_order_items** — restocking.

### Customers
- **customers** — buyer record (optionally linked to a `profile`, supports guests).
- **customer_addresses** — saved billing/shipping addresses.
- **wishlist** — saved products.
- **cart** / **cart_items** — one active cart per customer.

### Orders, payments & fulfillment
- **shipping_methods** — available delivery options.
- **orders** — order header with money breakdown + status.
- **order_items** — line items (price/name snapshotted).
- **shipping_addresses** — per-order address snapshot.
- **payments** / **payment_transactions** — payment + gateway attempts.
- **shipments** / **tracking_events** — fulfillment + tracking history.

### Marketing & loyalty
- **coupons** / **coupon_usage** — discounts and redemption tracking.
- **gift_cards** / **gift_card_transactions** — stored value.
- **loyalty_points** — points ledger.
- **referrals** — referral program.

### CMS
- **homepage_settings** / **homepage_sections** — homepage configuration.
- **hero_slides**, **banners** — promotional surfaces.
- **testimonials** — parent testimonials.
- **blogs**, **pages**, **faqs** — editorial content.

### Support
- **contact_queries** — public contact form submissions.
- **support_tickets** / **ticket_messages** — help desk threads.
- **newsletter_subscribers** — email capture.

### Reviews
- **reviews** / **review_images** — product reviews + media.

### Accounting
- **tax_rates** — configurable tax/GST rates.
- **expenses**, **transactions** — bookkeeping.
- **gst_reports** — periodic GST summaries.

### Media
- **media_folders** / **media_library** — DAM mapped to storage buckets.

### System
- **notifications** — per-user notifications.
- **activity_logs** — high-level user actions.
- **audit_logs** — row-level change history (old/new JSON).
- **settings** — global key/value configuration.

---

## Key relationships

- `auth.users` 1—1 `profiles` *N*—1 `roles` *N*—*N* `permissions`.
- `categories` 1—*N* `subcategories` 1—*N* `products` 1—*N* `product_variants`.
- `products` *N*—*N* `tags` / `ingredients` / `benefits` via map tables.
- `product_variants` 1—*N* `inventory` (per `warehouses`) 1—*N* `stock_movements`.
- `customers` 1—*N* `orders` 1—*N* `order_items`; `orders` 1—*N* `payments`/`shipments`.
- `customers` 1—1 `cart` 1—*N* `cart_items`; `customers` 1—*N* `wishlist`/`addresses`/`reviews`.
- `coupons` 1—*N* `coupon_usage`; `gift_cards` 1—*N* `gift_card_transactions`.

## Storage buckets

| Bucket | Visibility | Write access |
|--------|-----------|--------------|
| `products` | public read | manager/admin |
| `homepage` | public read | manager/admin |
| `mascots` | public read | manager/admin |
| `blog` | public read | manager/admin |
| `media` | private (staff read) | manager/admin |
| `documents` | private (staff read) | manager/admin |

## Security model (RLS)

Helper functions: `has_role(text)`, `is_admin()`, `is_manager()`, `is_staff()`, `owns_customer(uuid)` (all `SECURITY DEFINER` to avoid recursive policy checks).

- **Admin** — full access to all tables.
- **Manager** — full access to catalog, inventory, marketing, CMS, accounting, and operational order tables.
- **Support** — read operational data; full control of support tickets, ticket messages, and contact queries.
- **Customer** — access only their own customer record, addresses, cart, wishlist, orders, reviews, notifications, and tickets.
- **Anonymous** — read published catalog & CMS content; may insert newsletter signups and contact queries.

## Future scalability

- **Variant-level everything** — inventory, cart, and order lines reference `product_variants`, enabling multi-pack/size growth without schema change.
- **Multi-warehouse ready** — `inventory` is keyed per warehouse; add locations without migrations.
- **Guest + registered** — `customers` can exist without a `profile`, supporting guest checkout that later links to an account.
- **Pluggable payments/shipping** — `payments`/`payment_transactions` and `shipments`/`tracking_events` are provider-agnostic with `jsonb` raw payloads.
- **Auditability** — `audit_logs`, `activity_logs`, and `stock_movements` provide a full trail for compliance.
- **JSONB config** — `settings`, `homepage_*`, and `*_sections` allow flexible, codeless configuration.
- **Generated types** — replace the placeholder `Database` interface in `src/lib/supabase/types.ts` with `supabase gen types typescript` once these migrations are applied.
