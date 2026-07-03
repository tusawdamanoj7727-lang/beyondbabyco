-- =====================================================================
-- 011_inventory_warehouse.sql
-- Phase 4.9 — Enterprise Inventory & Warehouse
--
-- Extends warehouses, suppliers, purchase orders and stock movements for
-- the inventory admin module. Additive + idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- movement_type — richer movement categories for the admin UI
-- ---------------------------------------------------------------------
alter type movement_type add value if not exists 'purchase';
alter type movement_type add value if not exists 'sale';
alter type movement_type add value if not exists 'return';

-- ---------------------------------------------------------------------
-- warehouses
-- ---------------------------------------------------------------------
alter table warehouses
  add column if not exists contact_person text,
  add column if not exists phone          text,
  add column if not exists email          text,
  add column if not exists is_default     boolean not null default false;

create unique index if not exists idx_warehouses_single_default
  on warehouses (is_default) where is_default = true;

-- ---------------------------------------------------------------------
-- suppliers
-- ---------------------------------------------------------------------
alter table suppliers
  add column if not exists contact_name text,
  add column if not exists country      text default 'India',
  add column if not exists website      text,
  add column if not exists notes        text;

-- ---------------------------------------------------------------------
-- purchase_orders — sent/received lifecycle
-- ---------------------------------------------------------------------
alter table purchase_orders
  add column if not exists received_at timestamptz,
  add column if not exists notes       text;

alter table purchase_orders drop constraint if exists purchase_orders_status_check;
update purchase_orders set status = 'sent' where status = 'ordered';
alter table purchase_orders add constraint purchase_orders_status_check
  check (status in ('draft','sent','received','cancelled'));

-- ---------------------------------------------------------------------
-- purchase_order_items — partial receiving
-- ---------------------------------------------------------------------
alter table purchase_order_items
  add column if not exists quantity_received integer not null default 0
    check (quantity_received >= 0);

-- ---------------------------------------------------------------------
-- stock_movements — adjustment reason
-- ---------------------------------------------------------------------
alter table stock_movements
  add column if not exists reason text;

create index if not exists idx_stock_moves_created on stock_movements(created_at desc);
create index if not exists idx_po_status           on purchase_orders(status);
create index if not exists idx_po_expected         on purchase_orders(expected_at);
