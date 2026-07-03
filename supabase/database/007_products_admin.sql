-- =====================================================================
-- BeyondBabyCo — 007_products_admin.sql
-- Columns + RPC needed by the Product Management module (Phase 4.5).
-- Additive and idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extend products with merchandising, pricing, logistics, SEO and
-- soft-delete fields used by the admin product form.
-- (Stock is denormalized here for the admin module; the normalized
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

-- Active (non-deleted) products are the common query path.
create index if not exists idx_products_not_deleted
  on products(deleted_at) where deleted_at is null;

-- ---------------------------------------------------------------------
-- Audit helper — writes to audit_logs as the signed-in user.
-- SECURITY DEFINER so managers (who lack direct insert on audit_logs)
-- can still record changes.
-- ---------------------------------------------------------------------
create or replace function public.log_audit(
  p_table  text,
  p_record uuid,
  p_action text,
  p_old    jsonb default null,
  p_new    jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
  values (p_table, p_record, p_action, p_old, p_new, auth.uid());
end;
$$;

grant execute on function public.log_audit(text, uuid, text, jsonb, jsonb) to authenticated;
