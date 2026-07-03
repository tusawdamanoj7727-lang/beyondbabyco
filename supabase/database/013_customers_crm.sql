-- =====================================================================
-- 013_customers_crm.sql
-- Phase 4.11 — Enterprise Customers & CRM
-- Additive + idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- customers — CRM profile fields
-- ---------------------------------------------------------------------
alter table customers
  add column if not exists status         text not null default 'active'
    check (status in ('active','inactive','deleted')),
  add column if not exists avatar_url     text,
  add column if not exists notes          text,
  add column if not exists internal_notes text,
  add column if not exists tags           jsonb not null default '[]'::jsonb,
  add column if not exists is_vip         boolean not null default false,
  add column if not exists deleted_at     timestamptz;

create index if not exists idx_customers_status    on customers(status);
create index if not exists idx_customers_vip       on customers(is_vip) where is_vip = true;
create index if not exists idx_customers_created   on customers(created_at desc);
create index if not exists idx_customers_deleted   on customers(deleted_at) where deleted_at is not null;

-- ---------------------------------------------------------------------
-- customer_events — activity timeline
-- ---------------------------------------------------------------------
create table if not exists customer_events (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  type        text not null,
  message     text not null,
  metadata    jsonb not null default '{}'::jsonb,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_customer_events_customer on customer_events(customer_id, created_at desc);

-- ---------------------------------------------------------------------
-- Permission: customers.manage
-- ---------------------------------------------------------------------
insert into permissions (code, description) values
  ('customers.manage', 'Create, edit, merge and manage customer records.')
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.code = 'customers.manage'
where r.name in ('admin', 'manager')
on conflict do nothing;

-- RLS for customer_events
do $$
begin
  execute 'drop policy if exists manager_all on public.customer_events';
  execute 'create policy manager_all on public.customer_events for all to authenticated using (public.is_manager()) with check (public.is_manager())';
exception when others then null;
end $$;
