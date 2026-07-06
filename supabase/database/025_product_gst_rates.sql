-- =====================================================================
-- 025_product_gst_rates.sql
-- Align product GST rates: 12% baby care, 18% hair/ayurvedic oils.
-- Idempotent — safe to re-run.
-- =====================================================================

update public.products p
set gst_rate = 18, updated_at = now()
from public.categories c
where p.category_id = c.id
  and c.slug in ('baby-oil', 'massage-oil');

update public.products p
set gst_rate = 12, updated_at = now()
from public.categories c
where p.category_id = c.id
  and c.slug in (
    'baby-wipes',
    'baby-wash',
    'baby-lotion',
    'baby-shampoo',
    'baby-cream',
    'baby-powder',
    'baby-soap',
    'diaper-rash-cream',
    'gift-sets',
    'travel-kits',
    'accessories',
    'mother-care'
  );

-- Default any remaining zero/null baby catalog products to 12%
update public.products
set gst_rate = 12, updated_at = now()
where (gst_rate is null or gst_rate = 0)
  and deleted_at is null;
