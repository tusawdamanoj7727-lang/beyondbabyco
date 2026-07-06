-- =====================================================================
-- 024_storefront_coupons.sql
-- Storefront coupon seed + public read policy for cart validation API.
--
-- The coupons table is defined in 001_initial_schema.sql. Column mapping
-- for the storefront API:
--   discount_type  -> type          (enum: percent | fixed; "flat" = fixed)
--   discount_value -> value
--   min_order_value -> min_order
--   usage_limit    -> max_uses
--   valid_from     -> starts_at
--   valid_until    -> expires_at
--   max_discount   -> max_discount  (added in 016)
-- =====================================================================

-- Allow anonymous/authenticated clients to read active coupons for validation.
drop policy if exists storefront_read_active_coupons on public.coupons;
create policy storefront_read_active_coupons on public.coupons
  for select
  to anon, authenticated
  using (
    is_active = true
    and deleted_at is null
    and lifecycle_status = 'active'
  );

-- ---------------------------------------------------------------------
-- Seed storefront coupon codes (idempotent upsert)
-- ---------------------------------------------------------------------
insert into public.coupons (
  code,
  type,
  value,
  min_order,
  max_uses,
  used_count,
  is_active,
  lifecycle_status,
  promo_type,
  name,
  starts_at
)
values
  ('WELCOME10', 'percent', 10, 0, 100, 0, true, 'active', 'percentage', 'Welcome 10% Off', now()),
  ('BABY15', 'percent', 15, 499, 100, 0, true, 'active', 'percentage', 'Baby 15% Off', now()),
  ('FLAT100', 'fixed', 100, 599, 100, 0, true, 'active', 'fixed_amount', 'Flat ₹100 Off', now()),
  ('FIRSTORDER', 'percent', 20, 0, 100, 0, true, 'active', 'percentage', 'First Order 20% Off', now())
on conflict (code) do update set
  type = excluded.type,
  value = excluded.value,
  min_order = excluded.min_order,
  max_uses = excluded.max_uses,
  is_active = excluded.is_active,
  lifecycle_status = excluded.lifecycle_status,
  promo_type = excluded.promo_type,
  name = excluded.name,
  updated_at = now();
