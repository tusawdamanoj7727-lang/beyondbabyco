-- =====================================================================
-- 012_orders_fulfillment.sql
-- Phase 4.10 — Enterprise Orders & Fulfillment
-- Additive + idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- order_status — add lifecycle states used by the admin UI
-- ---------------------------------------------------------------------
alter type order_status add value if not exists 'draft';
alter type order_status add value if not exists 'packed';
alter type order_status add value if not exists 'completed';

-- ---------------------------------------------------------------------
-- orders — warehouse, notes, cancellation metadata
-- ---------------------------------------------------------------------
alter table orders
  add column if not exists warehouse_id   uuid references warehouses(id) on delete set null,
  add column if not exists notes          text,
  add column if not exists internal_notes text,
  add column if not exists cancelled_at   timestamptz,
  add column if not exists cancel_reason  text;

create index if not exists idx_orders_status      on orders(status);
create index if not exists idx_orders_customer    on orders(customer_id);
create index if not exists idx_orders_warehouse   on orders(warehouse_id);
create index if not exists idx_orders_created     on orders(created_at desc);
create index if not exists idx_orders_placed      on orders(placed_at desc);

-- ---------------------------------------------------------------------
-- shipments — warehouse, package details, ETA
-- ---------------------------------------------------------------------
alter table shipments
  add column if not exists warehouse_id         uuid references warehouses(id) on delete set null,
  add column if not exists weight_grams         integer check (weight_grams >= 0),
  add column if not exists dimensions           jsonb not null default '{}'::jsonb,
  add column if not exists estimated_delivery   timestamptz;

create index if not exists idx_shipments_order    on shipments(order_id);
create index if not exists idx_shipments_status   on shipments(status);
create index if not exists idx_shipments_tracking on shipments(tracking_number);

-- ---------------------------------------------------------------------
-- order_events — unified timeline for status, notes, refunds, docs
-- ---------------------------------------------------------------------
create table if not exists order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  type       text not null,
  message    text not null,
  metadata   jsonb not null default '{}'::jsonb,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_events_order on order_events(order_id, created_at desc);

-- ---------------------------------------------------------------------
-- order_refunds
-- ---------------------------------------------------------------------
create table if not exists order_refunds (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  payment_id uuid references payments(id) on delete set null,
  amount     numeric(14,2) not null check (amount >= 0),
  reason     text,
  notes      text,
  status     payment_status not null default 'refunded',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_refunds_order on order_refunds(order_id);

-- RLS: managers already have access via manager_all policy on orders table group.
-- Seed order_events + order_refunds into manager tables if not already covered.
do $$
begin
  execute 'drop policy if exists manager_all on public.order_events';
  execute 'create policy manager_all on public.order_events for all to authenticated using (public.is_manager()) with check (public.is_manager())';
  execute 'drop policy if exists manager_all on public.order_refunds';
  execute 'create policy manager_all on public.order_refunds for all to authenticated using (public.is_manager()) with check (public.is_manager())';
exception when others then null;
end $$;
