-- =====================================================================
-- 040_exactly_seven_products.sql
-- Publish exactly 7 storefront products. Archives all others.
-- Schema note: uses products.status (not is_published), products.stock
-- (not stock_quantity), compare_at_price (not original_price).
-- Safe to re-run.
-- =====================================================================

-- Wellness category for Tummy Roll-On
insert into public.categories (name, slug, description, position, is_active)
values ('Wellness', 'wellness', 'Baby wellness essentials.', 15, true)
on conflict (slug) do nothing;

-- STEP 2 — Hide ALL products (storefront only shows active + coming_soon)
update public.products
set
  status = 'archived',
  stock = 0,
  updated_at = now()
where deleted_at is null;

-- STEP 3 — Republish matches by name (may overlap; final step enforces exact 7 slugs)
update public.products p
set
  status = 'active',
  stock = 500,
  published_at = coalesce(p.published_at, now()),
  updated_at = now()
where p.deleted_at is null
  and (
    p.name ilike '%hair oil%'
    or p.name ilike '%massage oil%'
    or p.name ilike '%body wash%'
    or p.name ilike '%baby lotion%'
    or p.name ilike '%diaper rash%'
    or p.name ilike '%shampoo%'
    or p.name ilike '%tummy%'
    or p.name ilike '%roll%on%'
    or p.name ilike '%rollon%'
  );

-- STEP 4 — Upsert the 7 canonical products by slug
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
  sku
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
  v.sku
from (
  values
    (
      'Baby Hair Oil',
      'baby-hair-oil-100ml',
      'Nourishing hair oil for your baby. Made with natural ingredients. Strengthens hair and promotes healthy growth.',
      299::numeric,
      349::numeric,
      'baby-oil',
      12::numeric,
      'BBC-HAIR-100'
    ),
    (
      'Baby Massage Oil',
      'baby-massage-oil-100ml',
      'Ayurvedic blend for soothing baby massage. Improves sleep, strengthens bones, and calms your little one.',
      499,
      549,
      'massage-oil',
      18,
      'BBC-MOIL-100'
    ),
    (
      'Baby Body Wash',
      'baby-body-wash-200ml',
      'Gentle sulfate-free body wash. Cleans without stripping natural moisture. Safe for daily use from day 1.',
      349,
      399,
      'baby-wash',
      12,
      'BBC-WASH-200'
    ),
    (
      'Baby Lotion',
      'baby-lotion-200ml',
      'Deep moisturizing lotion with shea butter. Keeps skin soft and hydrated all day. Dermatologically tested.',
      299,
      349,
      'baby-lotion',
      12,
      'BBC-LOT-200'
    ),
    (
      'Baby Diaper Rash Cream',
      'baby-diaper-rash-cream-50gm',
      'Fast-relief cream for diaper rash. Creates a protective barrier. Heals and soothes irritated skin.',
      249,
      299,
      'diaper-rash-cream',
      12,
      'BBC-DRC-50'
    ),
    (
      'Baby Shampoo',
      'baby-shampoo-200ml',
      'Tear-free, gentle shampoo. Cleans scalp without irritating eyes. pH balanced for baby skin.',
      299,
      349,
      'baby-shampoo',
      12,
      'BBC-SHMP-200'
    ),
    (
      'Tummy Roll-On',
      'tummy-rollon-40ml',
      'Soothing roll-on for baby tummy discomfort. Relieves gas, colic, and bloating. Made with natural essential oils.',
      349,
      399,
      'wellness',
      12,
      'BBC-TUM-40'
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
  updated_at = now();

-- Enforce exactly these 7 active slugs; archive everything else
update public.products
set
  status = 'archived',
  stock = 0,
  updated_at = now()
where deleted_at is null
  and slug not in (
    'baby-hair-oil-100ml',
    'baby-massage-oil-100ml',
    'baby-body-wash-200ml',
    'baby-lotion-200ml',
    'baby-diaper-rash-cream-50gm',
    'baby-shampoo-200ml',
    'tummy-rollon-40ml'
  );

-- STEP 5 — Ensure default variant + inventory for each active product
insert into public.product_variants (product_id, name, sku, price, compare_at_price, is_active, position)
select
  p.id,
  case p.slug
    when 'baby-hair-oil-100ml' then '100 ml'
    when 'baby-massage-oil-100ml' then '100 ml'
    when 'baby-body-wash-200ml' then '200 ml'
    when 'baby-lotion-200ml' then '200 ml'
    when 'baby-diaper-rash-cream-50gm' then '50 gm'
    when 'baby-shampoo-200ml' then '200 ml'
    when 'tummy-rollon-40ml' then '40 ml'
    else 'Default'
  end,
  p.sku || '-V1',
  p.price,
  p.compare_at_price,
  true,
  0
from public.products p
where p.status = 'active'
  and p.deleted_at is null
  and not exists (
    select 1 from public.product_variants pv
    where pv.product_id = p.id and pv.is_active = true
  );

update public.product_variants pv
set
  is_active = true,
  updated_at = now()
from public.products p
where pv.product_id = p.id
  and p.status = 'active'
  and p.deleted_at is null;

-- Deactivate variants on archived products
update public.product_variants pv
set
  is_active = false,
  updated_at = now()
from public.products p
where pv.product_id = p.id
  and p.status = 'archived';

-- Inventory rows for active variants
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
where p.status = 'active'
  and p.deleted_at is null
on conflict (product_variant_id, warehouse_id) do update
set
  quantity = greatest(excluded.quantity, public.inventory.quantity, 200),
  updated_at = now();
