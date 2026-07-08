-- =====================================================================
-- 047_homepage_featured_launch_products.sql
-- Point homepage featured_products CMS at the 8 real launch SKUs.
-- Safe to re-run.
-- =====================================================================

update public.homepage_sections
set
  config = jsonb_set(
    coalesce(config, '{}'::jsonb),
    '{productIds}',
    (
      select coalesce(jsonb_agg(p.id order by p.slug), '[]'::jsonb)
      from public.products p
      where p.deleted_at is null
        and p.status = 'active'
        and p.slug in (
          'baby-wipes',
          'baby-hair-oil-100ml',
          'baby-massage-oil-100ml',
          'baby-body-wash-200ml',
          'baby-lotion-200ml',
          'baby-diaper-rash-cream-50gm',
          'baby-shampoo-200ml',
          'tummy-rollon-40ml'
        )
    ),
    true
  ),
  updated_at = now()
where key = 'featured_products';
