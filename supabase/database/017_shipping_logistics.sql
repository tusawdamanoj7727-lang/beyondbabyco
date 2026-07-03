-- =====================================================================
-- 017_shipping_logistics.sql
-- Phase 4.15 — Enterprise Shipping & Logistics
-- Additive + idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- shipping_carriers
-- ---------------------------------------------------------------------
create table if not exists shipping_carriers (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  provider            text not null
                      check (provider in (
                        'delhivery','shiprocket','blue_dart','xpressbees',
                        'india_post','dtdc','ekart','amazon_shipping','custom'
                      )),
  api_key_encrypted   text,
  api_secret_encrypted text,
  sandbox             boolean not null default true,
  is_active           boolean not null default true,
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_shipping_carriers_provider on shipping_carriers(provider);
create index if not exists idx_shipping_carriers_active   on shipping_carriers(is_active);

-- ---------------------------------------------------------------------
-- shipping_zones
-- ---------------------------------------------------------------------
create table if not exists shipping_zones (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  country      text not null default 'India',
  state        text,
  city         text,
  postal_from  text,
  postal_to    text,
  priority     integer not null default 0,
  is_active    boolean not null default true,
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_shipping_zones_priority on shipping_zones(priority desc);
create index if not exists idx_shipping_zones_country  on shipping_zones(country);

-- ---------------------------------------------------------------------
-- shipping_rates
-- ---------------------------------------------------------------------
create table if not exists shipping_rates (
  id                      uuid primary key default gen_random_uuid(),
  zone_id                 uuid not null references shipping_zones(id) on delete cascade,
  name                    text not null,
  weight_min_grams        integer not null default 0 check (weight_min_grams >= 0),
  weight_max_grams        integer check (weight_max_grams is null or weight_max_grams >= 0),
  price                   numeric(12,2) not null default 0 check (price >= 0),
  free_shipping_threshold numeric(12,2) check (free_shipping_threshold is null or free_shipping_threshold >= 0),
  cod_charge              numeric(12,2) not null default 0 check (cod_charge >= 0),
  is_active               boolean not null default true,
  deleted_at              timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_shipping_rates_zone on shipping_rates(zone_id);

-- ---------------------------------------------------------------------
-- pickup_requests
-- ---------------------------------------------------------------------
create table if not exists pickup_requests (
  id           uuid primary key default gen_random_uuid(),
  carrier_id   uuid references shipping_carriers(id) on delete set null,
  warehouse_id uuid references warehouses(id) on delete set null,
  pickup_date  date not null,
  status       text not null default 'pending'
               check (status in ('pending','scheduled','picked_up','failed','cancelled')),
  reference    text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_pickup_requests_date   on pickup_requests(pickup_date);
create index if not exists idx_pickup_requests_status on pickup_requests(status);

-- ---------------------------------------------------------------------
-- ndr_events — non-delivery reports
-- ---------------------------------------------------------------------
create table if not exists ndr_events (
  id           uuid primary key default gen_random_uuid(),
  shipment_id  uuid not null references shipments(id) on delete cascade,
  reason       text not null
               check (reason in (
                 'customer_unavailable','wrong_address','refused','reschedule','rto'
               )),
  status       text not null default 'open'
               check (status in ('open','resolved','rto')),
  notes        text,
  scheduled_at timestamptz,
  resolved_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_ndr_events_shipment on ndr_events(shipment_id);
create index if not exists idx_ndr_events_status   on ndr_events(status);

-- ---------------------------------------------------------------------
-- shipments — logistics extensions
-- ---------------------------------------------------------------------
alter table shipments
  add column if not exists carrier_id   uuid references shipping_carriers(id) on delete set null,
  add column if not exists label_url    text,
  add column if not exists awb_number   text,
  add column if not exists cancelled_at timestamptz;

-- ---------------------------------------------------------------------
-- tracking_events — webhook-ready
-- ---------------------------------------------------------------------
alter table tracking_events
  add column if not exists event_type text not null default 'status'
    check (event_type in ('status','delivered','failed','returned','ndr','webhook')),
  add column if not exists raw        jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------
-- Permission: shipping.manage
-- ---------------------------------------------------------------------
insert into permissions (code, description) values
  ('shipping.manage', 'Manage carriers, zones, rates, shipments, pickups and NDR.')
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.code = 'shipping.manage'
where r.name in ('admin', 'manager')
on conflict do nothing;

-- RLS
do $$
begin
  execute 'drop policy if exists manager_all on public.shipping_carriers';
  execute 'create policy manager_all on public.shipping_carriers for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.shipping_zones';
  execute 'create policy manager_all on public.shipping_zones for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.shipping_rates';
  execute 'create policy manager_all on public.shipping_rates for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.pickup_requests';
  execute 'create policy manager_all on public.pickup_requests for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.ndr_events';
  execute 'create policy manager_all on public.ndr_events for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
exception when others then null;
end $$;
