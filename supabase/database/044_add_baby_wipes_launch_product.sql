-- =====================================================================
-- 044_add_baby_wipes_launch_product.sql
-- Add Baby Wipes to the real storefront launch catalog (8th product).
-- Safe to re-run.
-- =====================================================================

insert into public.products (
  name,
  slug,
  description,
  short_description,
  price,
  compare_at_price,
  category_id,
  status,
  stock,
  gst_rate,
  currency,
  published_at,
  sku,
  is_featured,
  is_best_seller,
  is_trending,
  weight_grams
)
select
  v.name,
  v.slug,
  v.description,
  left(v.description, 160),
  v.price,
  v.compare_at_price,
  c.id,
  'active'::product_status,
  500,
  v.gst_rate,
  'INR',
  now(),
  v.sku,
  true,
  true,
  true,
  420
from (
  values
    (
      'Baby Wipes',
      'baby-wipes',
      'Ultra-soft baby wipes with 99% purified water, aloe vera and vitamin E. Paraben-free, hypoallergenic and dermatologically tested for sensitive skin from day one.',
      299::numeric,
      349::numeric,
      'baby-wipes',
      12::numeric,
      'BBC-WIPES-72'
    )
) as v(name, slug, description, price, compare_at_price, category_slug, gst_rate, sku)
left join public.categories c on c.slug = v.category_slug
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  short_description = excluded.short_description,
  price = excluded.price,
  compare_at_price = excluded.compare_at_price,
  category_id = coalesce(excluded.category_id, products.category_id),
  status = 'active',
  stock = 500,
  gst_rate = excluded.gst_rate,
  published_at = coalesce(products.published_at, now()),
  deleted_at = null,
  is_featured = true,
  is_best_seller = true,
  is_trending = true,
  weight_grams = 420,
  updated_at = now();

insert into public.product_variants (product_id, name, sku, price, compare_at_price, is_active, position, weight_grams)
select
  p.id,
  '72 Wipes',
  p.sku || '-V1',
  p.price,
  p.compare_at_price,
  true,
  0,
  420
from public.products p
where p.slug = 'baby-wipes'
  and p.deleted_at is null
  and not exists (
    select 1 from public.product_variants pv
    where pv.product_id = p.id and pv.is_active = true
  );

update public.product_variants pv
set
  name = '72 Wipes',
  price = p.price,
  compare_at_price = p.compare_at_price,
  is_active = true,
  updated_at = now()
from public.products p
where pv.product_id = p.id
  and p.slug = 'baby-wipes'
  and p.deleted_at is null;

insert into public.inventory (product_variant_id, warehouse_id, quantity, reserved)
select
  pv.id,
  wh.id,
  200,
  0
from public.products p
join public.product_variants pv on pv.product_id = p.id and pv.is_active = true
cross join lateral (
  select id
  from public.warehouses
  where is_active = true
  order by is_default desc nulls last, created_at asc
  limit 1
) wh
where p.slug = 'baby-wipes'
  and p.status = 'active'
  and p.deleted_at is null
on conflict (product_variant_id, warehouse_id) do update
set
  quantity = greatest(excluded.quantity, public.inventory.quantity, 200),
  updated_at = now();

delete from public.product_images pi
using public.products p
where pi.product_id = p.id
  and p.slug = 'baby-wipes';

insert into public.product_images (product_id, url, alt, position, is_primary)
select
  p.id,
  '/images/generated/products/baby-wipes/front.webp',
  p.name,
  0,
  true
from public.products p
where p.slug = 'baby-wipes'
  and p.deleted_at is null;
