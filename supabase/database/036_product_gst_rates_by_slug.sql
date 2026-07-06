-- =====================================================================
-- 036_product_gst_rates_by_slug.sql
-- Explicit GST % per launch product (12% baby care, 18% massage oil).
-- Idempotent — safe to re-run.
-- =====================================================================

update public.products
set gst_rate = 12, updated_at = now()
where slug = 'pure-gentle-water-baby-wipes'
  and deleted_at is null;

update public.products
set gst_rate = 18, updated_at = now()
where slug = 'ayurvedic-massage-oil'
  and deleted_at is null;

-- Baby wash, lotion, gift sets via category when present
update public.products p
set gst_rate = 12, updated_at = now()
from public.categories c
where p.category_id = c.id
  and c.slug in ('baby-wipes', 'baby-wash', 'baby-lotion', 'gift-sets')
  and p.deleted_at is null;

update public.products p
set gst_rate = 18, updated_at = now()
from public.categories c
where p.category_id = c.id
  and c.slug in ('baby-oil', 'massage-oil')
  and p.deleted_at is null;
