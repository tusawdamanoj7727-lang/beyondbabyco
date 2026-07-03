-- =====================================================================
-- 015_returns_rma.sql
-- Phase 4.13 — Enterprise Returns & RMA
-- Additive + idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- returns
-- ---------------------------------------------------------------------
create table if not exists returns (
  id              uuid primary key default gen_random_uuid(),
  rma_number      text not null unique,
  order_id        uuid not null references orders(id) on delete restrict,
  customer_id     uuid references customers(id) on delete set null,
  warehouse_id    uuid references warehouses(id) on delete set null,
  status          text not null default 'requested'
                  check (status in (
                    'requested','approved','rejected','pickup_scheduled',
                    'received','inspection','refund_approved','refunded','closed'
                  )),
  reason          text not null default 'other'
                  check (reason in (
                    'damaged','wrong_item','missing_item','quality_issue',
                    'expired','customer_changed_mind','other'
                  )),
  refund_status   text not null default 'pending'
                  check (refund_status in (
                    'pending','partial','full','store_credit','gift_card','refunded','none'
                  )),
  refund_type     text
                  check (refund_type is null or refund_type in (
                    'partial','full','store_credit','gift_card'
                  )),
  refund_amount   numeric(14,2) not null default 0 check (refund_amount >= 0),
  inspection_notes text,
  inspector_id    uuid references profiles(id) on delete set null,
  internal_notes  text,
  restock_completed boolean not null default false,
  closed_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_returns_status     on returns(status);
create index if not exists idx_returns_order      on returns(order_id);
create index if not exists idx_returns_customer   on returns(customer_id);
create index if not exists idx_returns_warehouse  on returns(warehouse_id);
create index if not exists idx_returns_refund     on returns(refund_status);
create index if not exists idx_returns_created    on returns(created_at desc);

-- ---------------------------------------------------------------------
-- return_items
-- ---------------------------------------------------------------------
create table if not exists return_items (
  id                  uuid primary key default gen_random_uuid(),
  return_id           uuid not null references returns(id) on delete cascade,
  order_item_id       uuid references order_items(id) on delete set null,
  product_id          uuid references products(id) on delete set null,
  product_variant_id  uuid references product_variants(id) on delete set null,
  name                text not null,
  sku                 text,
  quantity            integer not null check (quantity > 0),
  unit_price          numeric(12,2) not null default 0 check (unit_price >= 0),
  condition           text,
  restock_decision    text
                      check (restock_decision is null or restock_decision in (
                        'good','damaged','destroy','vendor_return'
                      )),
  damage_level        text
                      check (damage_level is null or damage_level in (
                        'none','minor','major','total'
                      )),
  inspection_photos   jsonb not null default '[]'::jsonb,
  inspector_notes     text,
  restocked           boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_return_items_return on return_items(return_id);

-- ---------------------------------------------------------------------
-- return_events — timeline
-- ---------------------------------------------------------------------
create table if not exists return_events (
  id         uuid primary key default gen_random_uuid(),
  return_id  uuid not null references returns(id) on delete cascade,
  type       text not null,
  message    text not null,
  metadata   jsonb not null default '{}'::jsonb,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_return_events_return on return_events(return_id, created_at desc);

-- ---------------------------------------------------------------------
-- Permission: returns.manage
-- ---------------------------------------------------------------------
insert into permissions (code, description) values
  ('returns.manage', 'Manage returns, RMA workflow, inspections and refunds.')
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.code = 'returns.manage'
where r.name in ('admin', 'manager', 'support')
on conflict do nothing;

-- RLS
do $$
begin
  execute 'drop policy if exists manager_all on public.returns';
  execute 'create policy manager_all on public.returns for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.return_items';
  execute 'create policy manager_all on public.return_items for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.return_events';
  execute 'create policy manager_all on public.return_events for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
exception when others then null;
end $$;
