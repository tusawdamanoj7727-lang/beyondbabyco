-- =====================================================================
-- 038_wipes_in_stock.sql
-- Ensure Pure & Gentle Water Baby Wipes are purchasable.
-- (Schema uses products.status + inventory, not is_available.)
-- Safe to re-run.
-- =====================================================================

update public.products
set
  status = 'active',
  stock = greatest(coalesce(stock, 0), 500),
  published_at = coalesce(published_at, now()),
  updated_at = now()
where slug = 'pure-gentle-water-baby-wipes'
  and deleted_at is null;

update public.product_variants pv
set
  is_active = true,
  updated_at = now()
from public.products p
where pv.product_id = p.id
  and p.slug = 'pure-gentle-water-baby-wipes'
  and (
    pv.sku like 'BBC-WIPES%'
    or pv.sku in ('BBC-WIPES-PURE-72', 'BBC-WIPES-PURE-144')
  );

insert into public.inventory (product_variant_id, warehouse_id, quantity, reserved)
select
  pv.id,
  wh.id,
  greatest(500, 250),
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
where p.slug = 'pure-gentle-water-baby-wipes'
  and p.deleted_at is null
  and (pv.sku like 'BBC-WIPES%' or pv.sku in ('BBC-WIPES-PURE-72', 'BBC-WIPES-PURE-144'))
on conflict (product_variant_id, warehouse_id) do update
set
  quantity = greatest(excluded.quantity, public.inventory.quantity, 500),
  updated_at = now();
