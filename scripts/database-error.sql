-- Failed migration: 007_products_admin.sql (#7)
-- SQLSTATE: 42601
-- Reason: syntax error at or near "the"

the normalized
--  inventory tables remain the source of truth once Inventory ships.)
-- ---------------------------------------------------------------------
alter table products
  add column if not exists sale_price          numeric(12,2) check (sale_price >= 0),
  add column if not exists gst_rate            numeric(5,2)  not null default 0 check (gst_rate >= 0),
  add column if not exists tax_class           text,
  add column if not exists barcode             text,
  add column if not exists stock               integer not null default 0 check (stock >= 0),
  add column if not exists low_stock_threshold integer not null default 0 check (low_stock_threshold >= 0),
  add column if not exists weight_grams        integer check (weight_grams >= 0),
  add column if not exists length_cm           numeric(8,2) check (length_cm >= 0),
  add column if not exists width_cm            numeric(8,2) check (width_cm >= 0),
  add column if not exists height_cm           numeric(8,2) check (height_cm >= 0),
  add column if not exists is_best_seller      boolean not null default false,
  add column if not exists is_new_arrival      boolean not null default false,
  add column if not exists is_trending         boolean not null default false,
  add column if not exists launch_date         timestamptz,
  add column if not exists seo_title           text,
  add column if not exists seo_description     text,
  add column if not exists meta_keywords       text,
  add column if not exists canonical_url       text,
  add column if not exists deleted_at          timestamptz;
