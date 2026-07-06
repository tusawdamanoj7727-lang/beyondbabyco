-- =====================================================================
-- 029_launch_product_stock.sql
-- Ensure launch products are purchasable (active + stock > 0).
-- Safe to re-run. Skips variant SKU rename from 026 (use is_active only).
-- =====================================================================

-- Launch: Pure & Gentle Water Baby Wipes (72 + 144 count variants)
update public.products
set
  status = 'active',
  stock = greatest(coalesce(stock, 0), 500),
  published_at = coalesce(published_at, now()),
  updated_at = now()
where slug = 'pure-gentle-water-baby-wipes'
  and deleted_at is null;

-- Launch: Ayurvedic Baby Massage Oil
update public.products
set
  status = 'active',
  stock = greatest(coalesce(stock, 0), 180),
  published_at = coalesce(published_at, now()),
  updated_at = now()
where slug = 'ayurvedic-massage-oil'
  and deleted_at is null;

-- Wipes: only 72-count and 144-count variants active
update public.product_variants pv
set is_active = false, updated_at = now()
from public.products p
where pv.product_id = p.id
  and p.slug = 'pure-gentle-water-baby-wipes'
  and pv.sku not in ('BBC-WIPES-PURE-72', 'BBC-WIPES-PURE-144');

update public.product_variants pv
set is_active = true, updated_at = now()
from public.products p
where pv.product_id = p.id
  and p.slug = 'pure-gentle-water-baby-wipes'
  and pv.sku in ('BBC-WIPES-PURE-72', 'BBC-WIPES-PURE-144');

-- Everything else: coming soon (not purchasable)
update public.products
set
  status = 'coming_soon',
  stock = 0,
  updated_at = now()
where slug not in ('pure-gentle-water-baby-wipes', 'ayurvedic-massage-oil')
  and deleted_at is null
  and status in ('active', 'coming_soon');
