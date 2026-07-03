-- =====================================================================
-- 008_categories_brands_admin.sql
-- Phase 4.6 — Enterprise Categories & Brands
--
-- Additive migration that extends the existing `categories` and `brands`
-- tables (created in 001_initial_schema.sql) with the merchandising, media,
-- SEO, publishing and soft-delete fields the admin modules need.
--
-- Safe to run multiple times (idempotent: add column if not exists, etc.).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------
alter table categories
  add column if not exists banner_url       text,
  add column if not exists icon_url         text,
  add column if not exists seo_title        text,
  add column if not exists seo_description  text,
  add column if not exists meta_keywords    text,
  add column if not exists canonical_url    text,
  add column if not exists is_featured      boolean not null default false,
  add column if not exists status           text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  add column if not exists deleted_at       timestamptz;

-- ---------------------------------------------------------------------
-- Brands
-- ---------------------------------------------------------------------
alter table brands
  add column if not exists website_url       text,
  add column if not exists country_of_origin text,
  add column if not exists banner_url        text,
  add column if not exists seo_title         text,
  add column if not exists seo_description   text,
  add column if not exists meta_keywords     text,
  add column if not exists canonical_url     text,
  add column if not exists is_featured       boolean not null default false,
  add column if not exists position          integer not null default 0,
  add column if not exists status            text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  add column if not exists deleted_at        timestamptz;

-- ---------------------------------------------------------------------
-- Backfill: keep the new `status` column aligned with the legacy
-- `is_active` flag for rows that pre-date this migration.
-- ---------------------------------------------------------------------
update categories set status = 'active' where is_active = true  and status = 'draft';
update brands     set status = 'active' where is_active = true  and status = 'draft';

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
create index if not exists idx_categories_not_deleted on categories(deleted_at) where deleted_at is null;
create index if not exists idx_categories_parent_pos  on categories(parent_id, position);
create index if not exists idx_categories_status      on categories(status);
create index if not exists idx_brands_not_deleted     on brands(deleted_at) where deleted_at is null;
create index if not exists idx_brands_status          on brands(status);
create index if not exists idx_brands_position        on brands(position);

-- ---------------------------------------------------------------------
-- Storage: category & brand assets live in the (private) `media` bucket
-- under the `categories/` and `brands/` prefixes. These prefixes hold
-- public-facing imagery (logos, banners), so allow public read on them
-- while the rest of the media bucket stays staff-only.
-- ---------------------------------------------------------------------
drop policy if exists "public_read_media_catalog" on storage.objects;
create policy "public_read_media_catalog" on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'media'
    and (name like 'categories/%' or name like 'brands/%')
  );
