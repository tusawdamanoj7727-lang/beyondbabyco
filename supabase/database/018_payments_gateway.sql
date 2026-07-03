-- =====================================================================
-- 018_payments_gateway.sql
-- Phase 4.16 — Enterprise Payment Gateway Architecture
-- Additive + idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- payment_status — extended lifecycle
-- ---------------------------------------------------------------------
alter type payment_status add value if not exists 'captured';
alter type payment_status add value if not exists 'cancelled';
alter type payment_status add value if not exists 'voided';

-- ---------------------------------------------------------------------
-- payment_gateways
-- ---------------------------------------------------------------------
create table if not exists payment_gateways (
  id                      uuid primary key default gen_random_uuid(),
  display_name            text not null,
  provider                text not null
                          check (provider in (
                            'razorpay','cashfree','phonepe','payu','stripe','paypal','custom'
                          )),
  sandbox                 boolean not null default true,
  api_key_encrypted       text,
  api_secret_encrypted    text,
  webhook_secret_encrypted text,
  webhook_url             text,
  currency                char(3) not null default 'INR',
  is_enabled              boolean not null default false,
  priority                integer not null default 0,
  lifecycle_status        text not null default 'active'
                          check (lifecycle_status in ('active','archived')),
  deleted_at              timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_payment_gateways_provider on payment_gateways(provider);
create index if not exists idx_payment_gateways_enabled  on payment_gateways(is_enabled);

-- ---------------------------------------------------------------------
-- payments — gateway extensions
-- ---------------------------------------------------------------------
alter table payments
  add column if not exists gateway_id       uuid references payment_gateways(id) on delete set null,
  add column if not exists customer_id      uuid references customers(id) on delete set null,
  add column if not exists payment_ref      text,
  add column if not exists gateway_txn_id   text,
  add column if not exists fees             numeric(14,2) not null default 0 check (fees >= 0),
  add column if not exists tax              numeric(14,2) not null default 0 check (tax >= 0),
  add column if not exists captured_at      timestamptz,
  add column if not exists failed_reason    text;

create index if not exists idx_payments_gateway   on payments(gateway_id);
create index if not exists idx_payments_customer  on payments(customer_id);
create index if not exists idx_payments_status      on payments(status);
create index if not exists idx_payments_gateway_txn on payments(gateway_txn_id);

-- ---------------------------------------------------------------------
-- payment_transactions — extended fields
-- ---------------------------------------------------------------------
alter table payment_transactions
  add column if not exists reference        text,
  add column if not exists gateway_txn_id   text,
  add column if not exists fees             numeric(14,2) not null default 0 check (fees >= 0),
  add column if not exists tax              numeric(14,2) not null default 0 check (tax >= 0);

-- ---------------------------------------------------------------------
-- payment_webhooks
-- ---------------------------------------------------------------------
create table if not exists payment_webhooks (
  id           uuid primary key default gen_random_uuid(),
  gateway_id   uuid references payment_gateways(id) on delete set null,
  payment_id   uuid references payments(id) on delete set null,
  event_type   text not null,
  payload      jsonb not null default '{}'::jsonb,
  signature    text,
  processed    boolean not null default false,
  processed_at timestamptz,
  error        text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_payment_webhooks_gateway on payment_webhooks(gateway_id, created_at desc);
create index if not exists idx_payment_webhooks_processed on payment_webhooks(processed) where processed = false;

-- ---------------------------------------------------------------------
-- settlements
-- ---------------------------------------------------------------------
create table if not exists settlements (
  id               uuid primary key default gen_random_uuid(),
  gateway_id       uuid references payment_gateways(id) on delete set null,
  settlement_date  date not null,
  expected_amount  numeric(14,2) not null default 0 check (expected_amount >= 0),
  received_amount  numeric(14,2) not null default 0 check (received_amount >= 0),
  difference       numeric(14,2) not null default 0,
  status           text not null default 'pending'
                   check (status in ('pending','matched','mismatch','synced')),
  bank_reference   text,
  synced_at        timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_settlements_date on settlements(settlement_date desc);

-- ---------------------------------------------------------------------
-- payment_reconciliation
-- ---------------------------------------------------------------------
create table if not exists payment_reconciliation (
  id                uuid primary key default gen_random_uuid(),
  reconciliation_date date not null default current_date,
  payment_id        uuid references payments(id) on delete set null,
  order_id          uuid references orders(id) on delete set null,
  settlement_id     uuid references settlements(id) on delete set null,
  expected_amount   numeric(14,2) not null default 0,
  actual_amount     numeric(14,2) not null default 0,
  status            text not null default 'pending'
                    check (status in ('pending','matched','mismatch')),
  notes             text,
  created_at        timestamptz not null default now()
);

create index if not exists idx_payment_reconciliation_status on payment_reconciliation(status);

-- ---------------------------------------------------------------------
-- payment_logs
-- ---------------------------------------------------------------------
create table if not exists payment_logs (
  id         uuid primary key default gen_random_uuid(),
  payment_id uuid references payments(id) on delete cascade,
  gateway_id uuid references payment_gateways(id) on delete set null,
  level      text not null default 'info'
             check (level in ('debug','info','warn','error')),
  message    text not null,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_logs_payment on payment_logs(payment_id, created_at desc);

-- ---------------------------------------------------------------------
-- Permission: payments.manage
-- ---------------------------------------------------------------------
insert into permissions (code, description) values
  ('payments.manage', 'Manage payment gateways, transactions, settlements and reconciliation.')
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.code = 'payments.manage'
where r.name in ('admin', 'manager')
on conflict do nothing;

-- RLS
do $$
begin
  execute 'drop policy if exists manager_all on public.payment_gateways';
  execute 'create policy manager_all on public.payment_gateways for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.payment_webhooks';
  execute 'create policy manager_all on public.payment_webhooks for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.settlements';
  execute 'create policy manager_all on public.settlements for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.payment_reconciliation';
  execute 'create policy manager_all on public.payment_reconciliation for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.payment_logs';
  execute 'create policy manager_all on public.payment_logs for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
exception when others then null;
end $$;
