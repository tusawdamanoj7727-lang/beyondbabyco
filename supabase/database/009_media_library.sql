-- =====================================================================
-- 009_media_library.sql
-- Phase 4.7 — Enterprise Media Library
--
-- Extends the existing `media_folders` and `media_library` tables
-- (created in 001_initial_schema.sql) into a full digital-asset manager
-- mapped to Supabase Storage. Adds the `media.manage` permission and seeds
-- the system folders that mirror the storage buckets.
--
-- Additive + idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- media_folders — bucket-aware folder tree (system + custom).
-- ---------------------------------------------------------------------
alter table media_folders
  add column if not exists slug        text,
  add column if not exists bucket      text,
  add column if not exists path_prefix text not null default '',
  add column if not exists icon        text,
  add column if not exists is_system   boolean not null default false,
  add column if not exists position    integer not null default 0;

create unique index if not exists uq_media_folders_slug on media_folders(slug) where slug is not null;

-- ---------------------------------------------------------------------
-- media_library — add image-optimization metadata.
-- ---------------------------------------------------------------------
alter table media_library
  add column if not exists original_name text,
  add column if not exists width         integer check (width  >= 0),
  add column if not exists height        integer check (height >= 0),
  add column if not exists blur_data_url text;

create index if not exists idx_media_library_bucket  on media_library(bucket);
create index if not exists idx_media_library_folder  on media_library(folder_id);
create index if not exists idx_media_library_created on media_library(created_at desc);
create index if not exists idx_media_library_mime    on media_library(mime_type);
create index if not exists idx_media_library_name_trgm on media_library using gin (original_name gin_trgm_ops);

-- ---------------------------------------------------------------------
-- Permission: media.manage  (+ map to admin & manager)
-- ---------------------------------------------------------------------
insert into permissions (code, description) values
  ('media.manage', 'Manage the media library and storage assets.')
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.code = 'media.manage'
where r.name in ('admin', 'manager')
on conflict do nothing;

-- Seed system folders (mirror the storage buckets / known prefixes).
-- Uses WHERE NOT EXISTS — partial unique index on slug is not valid for ON CONFLICT (slug).
insert into media_folders (name, slug, bucket, path_prefix, icon, is_system, position)
select v.name, v.slug, v.bucket, v.path_prefix, v.icon, v.is_system, v.position
from (
  values
    ('Products',   'products',   'products',  '',            'products',   true, 1),
    ('Homepage',   'homepage',   'homepage',  '',            'homepage',   true, 2),
    ('Categories', 'categories', 'media',     'categories/', 'categories', true, 3),
    ('Brands',     'brands',     'media',     'brands/',     'brands',     true, 4),
    ('Mascots',    'mascots',    'mascots',   '',            'sparkles',   true, 5),
    ('Blog',       'blog',       'blog',      '',            'blog',       true, 6),
    ('Documents',  'documents',  'documents', '',            'blog',       true, 7)
) as v(name, slug, bucket, path_prefix, icon, is_system, position)
where not exists (
  select 1 from media_folders mf where mf.slug is not distinct from v.slug
);
