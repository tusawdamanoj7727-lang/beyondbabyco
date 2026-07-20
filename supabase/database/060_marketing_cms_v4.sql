-- =====================================================================
-- 060_marketing_cms_v4.sql
-- Growth / marketing CMS: promotions + trust sections, hero schedule &
-- responsive assets, richer banners for multi-device campaigns.
-- Additive + idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Homepage sections — promotions & trust social proof
-- ---------------------------------------------------------------------
insert into homepage_sections (key, title, position, is_enabled, config) values
  (
    'promotions',
    'Promotional Cards',
    3,
    true,
    jsonb_build_object(
      'heading', 'Shop by occasion',
      'cards', jsonb_build_array(
        jsonb_build_object('title', 'New Arrival', 'description', 'Fresh formulas just launched', 'href', '/products?sort=newest', 'emoji', '✨'),
        jsonb_build_object('title', 'Best Seller', 'description', 'Parents repurchase these most', 'href', '/products?sort=best_selling', 'emoji', '⭐'),
        jsonb_build_object('title', 'Limited Offer', 'description', 'Seasonal bundles & gifts', 'href', '/products', 'emoji', '🎁'),
        jsonb_build_object('title', 'Doctor Recommended', 'description', 'Formulas parents trust', 'href', '/research', 'emoji', '🩺')
      )
    )
  ),
  (
    'trust_stats',
    'Trust & Social Proof',
    5,
    true,
    jsonb_build_object(
      'heading', '',
      'stats', jsonb_build_array(
        jsonb_build_object('value', '2021', 'label', 'Research Started'),
        jsonb_build_object('value', '5+', 'label', 'Years of R&D'),
        jsonb_build_object('value', '100%', 'label', 'Natural Ingredients'),
        jsonb_build_object('value', '0', 'label', 'Harmful Chemicals'),
        jsonb_build_object('value', '2026', 'label', 'First Launch')
      )
    )
  )
on conflict (key) do nothing;

-- Keep featured products after promotions when both are newly seeded
update homepage_sections set position = 4 where key = 'featured_products' and position < 4;

-- ---------------------------------------------------------------------
-- Hero slides — campaign scheduling + mobile asset
-- ---------------------------------------------------------------------
alter table hero_slides
  add column if not exists mobile_image_url text,
  add column if not exists video_url text,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;

create index if not exists idx_hero_slides_schedule
  on hero_slides (starts_at, ends_at)
  where is_active = true;

-- ---------------------------------------------------------------------
-- Banners — multi-device creatives (table already has schedule fields)
-- ---------------------------------------------------------------------
alter table banners
  add column if not exists mobile_image_url text,
  add column if not exists tablet_image_url text,
  add column if not exists subtitle text,
  add column if not exists cta_label text;

create index if not exists idx_banners_placement_active
  on banners (placement, position)
  where is_active = true;
