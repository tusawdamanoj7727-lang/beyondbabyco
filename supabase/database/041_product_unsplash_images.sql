-- =====================================================================
-- 041_product_unsplash_images.sql
-- Primary product images for the 7-product launch catalog.
-- Safe to re-run.
-- =====================================================================

delete from public.product_images pi
using public.products p
where pi.product_id = p.id
  and p.slug in (
    'baby-hair-oil-100ml',
    'baby-massage-oil-100ml',
    'baby-body-wash-200ml',
    'baby-lotion-200ml',
    'baby-diaper-rash-cream-50gm',
    'baby-shampoo-200ml',
    'tummy-rollon-40ml'
  );

insert into public.product_images (product_id, url, alt, position, is_primary)
select p.id, v.url, p.name, 0, true
from public.products p
join (
  values
    ('baby-hair-oil-100ml', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=85'),
    ('baby-massage-oil-100ml', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=85'),
    ('baby-body-wash-200ml', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=85'),
    ('baby-lotion-200ml', 'https://images.unsplash.com/photo-1556228578-626d52e9793d?w=600&q=85'),
    ('baby-diaper-rash-cream-50gm', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=85'),
    ('baby-shampoo-200ml', 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=85'),
    ('tummy-rollon-40ml', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=85')
) as v(slug, url) on v.slug = p.slug
where p.deleted_at is null;
