-- =====================================================================
-- BeyondBabyCo — 023_delhivery_integration.sql
-- Delhivery courier integration: tracking history, API logs, shipment fields.
-- Compatible with existing shipments schema (tracking_number, carrier).
-- Idempotent — safe to re-run.
-- =====================================================================

-- Only add columns that do not exist on the current shipments table.
alter table public.shipments
  add column if not exists pickup_status text,
  add column if not exists manifest_url  text,
  add column if not exists label_url     text;

create index if not exists idx_shipments_tracking on public.shipments(tracking_number);
create index if not exists idx_shipments_carrier  on public.shipments(carrier);

-- Detailed courier scan timeline (complements tracking_events)
create table if not exists public.shipment_tracking (
  id              uuid primary key default gen_random_uuid(),
  shipment_id     uuid not null references public.shipments(id) on delete cascade,
  order_id        uuid not null references public.orders(id) on delete cascade,
  tracking_number text,
  status          text not null,
  status_code     text,
  message         text,
  location        text,
  event_time      timestamptz not null default now(),
  raw             jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_shipment_tracking_shipment  on public.shipment_tracking(shipment_id);
create index if not exists idx_shipment_tracking_order     on public.shipment_tracking(order_id);
create index if not exists idx_shipment_tracking_tracking  on public.shipment_tracking(tracking_number);

-- Delhivery / courier API request logs
create table if not exists public.courier_logs (
  id            uuid primary key default gen_random_uuid(),
  shipment_id   uuid references public.shipments(id) on delete set null,
  order_id      uuid references public.orders(id) on delete set null,
  courier_name  text not null default 'delhivery',
  action        text not null,
  request_url   text,
  request_body  jsonb,
  response_body jsonb,
  status_code   integer,
  success       boolean not null default false,
  error_message text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_courier_logs_shipment on public.courier_logs(shipment_id);
create index if not exists idx_courier_logs_order    on public.courier_logs(order_id);
create index if not exists idx_courier_logs_action   on public.courier_logs(action);

alter table public.shipment_tracking enable row level security;
alter table public.courier_logs enable row level security;

-- ---------------------------------------------------------------------
-- RLS — uses current_user_role() / current_user_permissions() from
-- 006_auth_functions.sql (same approach as the Next.js app guards).
-- Does NOT depend on is_staff() / is_manager() from 003_rls.sql.
-- ---------------------------------------------------------------------

-- Staff with shipping.manage or orders.manage: full access to tracking rows
drop policy if exists staff_all_shipment_tracking on public.shipment_tracking;
drop policy if exists shipping_manage_all on public.shipment_tracking;
create policy shipping_manage_all on public.shipment_tracking
  for all to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.current_user_permissions() as perm
      where perm in ('shipping.manage', 'orders.manage')
    )
  )
  with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.current_user_permissions() as perm
      where perm in ('shipping.manage', 'orders.manage')
    )
  );

-- Support staff with orders.view: read-only tracking timeline
drop policy if exists orders_view_read on public.shipment_tracking;
create policy orders_view_read on public.shipment_tracking
  for select to authenticated
  using (
    exists (
      select 1 from public.current_user_permissions() as perm
      where perm = 'orders.view'
    )
  );

-- Customers: read tracking for their own orders
drop policy if exists customer_read_shipment_tracking on public.shipment_tracking;
create policy customer_read_shipment_tracking on public.shipment_tracking
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      join public.customers c on c.id = o.customer_id
      where o.id = shipment_tracking.order_id
        and c.profile_id = auth.uid()
    )
  );

-- Courier API logs: staff with shipping/orders manage permissions only
drop policy if exists staff_all_courier_logs on public.courier_logs;
drop policy if exists shipping_manage_all on public.courier_logs;
create policy shipping_manage_all on public.courier_logs
  for all to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.current_user_permissions() as perm
      where perm in ('shipping.manage', 'orders.manage')
    )
  )
  with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.current_user_permissions() as perm
      where perm in ('shipping.manage', 'orders.manage')
    )
  );
