-- =====================================================================
-- 010_homepage_cms.sql
-- Phase 4.8 — Enterprise Homepage CMS
--
-- Adds the `cms.manage` permission, extends `hero_slides` with the extra
-- fields the hero editor needs, and seeds the default homepage sections +
-- global settings rows. Uses the existing CMS tables created in
-- 001_initial_schema.sql (homepage_settings, homepage_sections, hero_slides,
-- testimonials, banners) — all already covered by RLS in 003_rls.sql.
--
-- Additive + idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Permission: cms.manage  (+ map to admin & manager)
-- ---------------------------------------------------------------------
insert into permissions (code, description) values
  ('cms.manage', 'Manage the homepage CMS, hero slides and testimonials.')
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.code = 'cms.manage'
where r.name in ('admin', 'manager')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- hero_slides — richer hero content.
-- ---------------------------------------------------------------------
alter table hero_slides
  add column if not exists description           text,
  add column if not exists secondary_cta_label  text,
  add column if not exists secondary_cta_url     text,
  add column if not exists background_url        text,
  add column if not exists overlay               integer not null default 0 check (overlay between 0 and 100);

create index if not exists idx_hero_slides_position on hero_slides(position);
create index if not exists idx_testimonials_position on testimonials(position);

-- ---------------------------------------------------------------------
-- Seed homepage sections (toggle + ordering + config jsonb).
-- ---------------------------------------------------------------------
insert into homepage_sections (key, title, position, is_enabled, config) values
  ('announcement',        'Announcement Bar',    1,  true,  '{}'::jsonb),
  ('hero',                'Hero',                2,  true,  '{}'::jsonb),
  ('featured_categories', 'Featured Categories', 3,  true,  '{"limit":6,"categoryIds":[]}'::jsonb),
  ('featured_products',   'Featured Products',   4,  true,  '{"limit":8,"productIds":[]}'::jsonb),
  ('brand_promise',       'Brand Promise',       5,  true,  '{"cards":[]}'::jsonb),
  ('science',             'Science Section',     6,  true,  '{"features":[]}'::jsonb),
  ('lifestyle',           'Lifestyle',           7,  true,  '{"cards":[]}'::jsonb),
  ('mascots',             'Mascots',             8,  true,  '{"items":[]}'::jsonb),
  ('research_timeline',   'Research Timeline',   9,  true,  '{"entries":[]}'::jsonb),
  ('testimonials',        'Testimonials',        10, true,  '{}'::jsonb),
  ('newsletter',          'Newsletter',          11, true,  '{}'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- Seed global settings rows (no toggle).
-- ---------------------------------------------------------------------
insert into homepage_settings (key, value) values
  ('general',  '{}'::jsonb),
  ('seo',      '{}'::jsonb),
  ('footer',   '{}'::jsonb),
  ('publish',  '{"status":"draft"}'::jsonb)
on conflict (key) do nothing;
