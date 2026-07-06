-- =====================================================================
-- 028_coupon_validation_seed.sql
-- Seed / refresh storefront coupon codes for POST /api/coupons/validate
--
-- NOTE: The project already has public.coupons from 001 + 016 + 024.
-- API column mapping (see 024_storefront_coupons.sql):
--   discount_type  -> type          ('percent' | 'fixed'; flat = fixed)
--   discount_value -> value
--   min_order_value -> min_order
--   usage_limit    -> max_uses
--   valid_from     -> starts_at
--   valid_until    -> expires_at
--   max_discount_amount -> max_discount
-- =====================================================================

drop policy if exists storefront_read_active_coupons on public.coupons;
create policy storefront_read_active_coupons on public.coupons
  for select
  to anon, authenticated
  using (
    is_active = true
    and deleted_at is null
    and lifecycle_status = 'active'
  );

insert into public.coupons (
  code,
  description,
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
  ('WELCOME10', 'Welcome discount 10%', 'percent', 10, 0, 100, 0, true, 'active', 'percentage', 'Welcome 10% Off', now()),
  ('BABY15', '15% off on ₹499+', 'percent', 15, 499, 100, 0, true, 'active', 'percentage', 'Baby 15% Off', now()),
  ('FLAT100', 'Flat ₹100 off on ₹599+', 'fixed', 100, 599, 100, 0, true, 'active', 'fixed_amount', 'Flat ₹100 Off', now()),
  ('NEWMOM20', 'New mom special 20% off', 'percent', 20, 799, 100, 0, true, 'active', 'percentage', 'New Mom 20% Off', now()),
  ('LAUNCH25', 'Launch offer 25% off', 'percent', 25, 999, 100, 0, true, 'active', 'percentage', 'Launch 25% Off', now())
on conflict (code) do update set
  description = excluded.description,
  type = excluded.type,
  value = excluded.value,
  min_order = excluded.min_order,
  max_uses = excluded.max_uses,
  is_active = excluded.is_active,
  lifecycle_status = excluded.lifecycle_status,
  promo_type = excluded.promo_type,
  name = excluded.name,
  updated_at = now();
