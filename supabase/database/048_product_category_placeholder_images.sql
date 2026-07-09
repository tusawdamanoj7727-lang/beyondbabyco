-- =====================================================================
-- 048_product_category_placeholder_images.sql
-- Replace Unsplash stock photos with self-hosted category placeholders.
-- Safe to re-run.
-- =====================================================================

update public.product_images pi
set url = v.url
from public.products p
join (
  values
    ('baby-hair-oil-100ml', '/images/placeholders/products/baby-oil.svg'),
    ('baby-massage-oil-100ml', '/images/placeholders/products/baby-oil.svg'),
    ('baby-body-wash-200ml', '/images/placeholders/products/baby-wash.svg'),
    ('baby-lotion-200ml', '/images/placeholders/products/baby-lotion.svg'),
    ('baby-diaper-rash-cream-50gm', '/images/placeholders/products/baby-lotion.svg'),
    ('baby-shampoo-200ml', '/images/placeholders/products/baby-wash.svg'),
    ('tummy-rollon-40ml', '/images/placeholders/products/baby-oil.svg')
) as v(slug, url) on true
where pi.product_id = p.id
  and p.slug = v.slug
  and pi.is_primary = true
  and p.deleted_at is null;
