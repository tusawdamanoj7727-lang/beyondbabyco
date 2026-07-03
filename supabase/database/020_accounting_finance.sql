-- =====================================================================
-- 020_accounting_finance.sql
-- Phase 4.18 — Enterprise Accounting & Finance
-- Additive + idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- finance_vendors
-- ---------------------------------------------------------------------
create table if not exists finance_vendors (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  gst_number          text,
  pan                 text,
  bank_details        jsonb not null default '{}'::jsonb,
  contact_person      text,
  email               text,
  phone               text,
  payment_terms       text,
  outstanding_balance numeric(14,2) not null default 0,
  is_active           boolean not null default true,
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_finance_vendors_name on finance_vendors(name);

-- ---------------------------------------------------------------------
-- expenses — extended fields
-- ---------------------------------------------------------------------
alter table expenses
  add column if not exists vendor_id       uuid references finance_vendors(id) on delete set null,
  add column if not exists gst_amount      numeric(14,2) not null default 0 check (gst_amount >= 0),
  add column if not exists invoice_number  text,
  add column if not exists invoice_date    date,
  add column if not exists payment_status  text not null default 'unpaid'
                                         check (payment_status in ('unpaid','partial','paid','scheduled')),
  add column if not exists attachments     jsonb not null default '[]'::jsonb,
  add column if not exists notes           text,
  add column if not exists deleted_at      timestamptz;

create index if not exists idx_expenses_vendor on expenses(vendor_id);
create index if not exists idx_expenses_payment_status on expenses(payment_status);
create index if not exists idx_expenses_spent_at on expenses(spent_at desc);

-- ---------------------------------------------------------------------
-- journal_entries
-- ---------------------------------------------------------------------
create table if not exists journal_entries (
  id                    uuid primary key default gen_random_uuid(),
  reference             text not null,
  narration             text,
  status                text not null default 'draft'
                        check (status in ('draft','pending','approved','reversed')),
  entry_date            date not null default current_date,
  total_debit           numeric(14,2) not null default 0 check (total_debit >= 0),
  total_credit          numeric(14,2) not null default 0 check (total_credit >= 0),
  reversed_by_entry_id  uuid references journal_entries(id) on delete set null,
  approved_by           uuid references auth.users(id) on delete set null,
  approved_at           timestamptz,
  created_by            uuid references auth.users(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_journal_entries_date on journal_entries(entry_date desc);
create index if not exists idx_journal_entries_status on journal_entries(status);

-- ---------------------------------------------------------------------
-- ledger_entries
-- ---------------------------------------------------------------------
create table if not exists ledger_entries (
  id                uuid primary key default gen_random_uuid(),
  ledger_type       text not null
                    check (ledger_type in ('general','sales','purchase','gst','customer','vendor')),
  account_code      text,
  reference         text,
  narration         text,
  debit             numeric(14,2) not null default 0 check (debit >= 0),
  credit            numeric(14,2) not null default 0 check (credit >= 0),
  currency          char(3) not null default 'INR',
  entry_date        date not null default current_date,
  journal_entry_id  uuid references journal_entries(id) on delete set null,
  vendor_id         uuid references finance_vendors(id) on delete set null,
  customer_id       uuid references customers(id) on delete set null,
  order_id          uuid references orders(id) on delete set null,
  expense_id        uuid references expenses(id) on delete set null,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index if not exists idx_ledger_entries_type on ledger_entries(ledger_type, entry_date desc);
create index if not exists idx_ledger_entries_journal on ledger_entries(journal_entry_id);

-- ---------------------------------------------------------------------
-- bank_accounts
-- ---------------------------------------------------------------------
create table if not exists bank_accounts (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  bank_name      text not null,
  account_number text not null,
  ifsc           text,
  balance        numeric(14,2) not null default 0,
  currency       char(3) not null default 'INR',
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- bank_transactions
-- ---------------------------------------------------------------------
create table if not exists bank_transactions (
  id                 uuid primary key default gen_random_uuid(),
  bank_account_id    uuid not null references bank_accounts(id) on delete cascade,
  type               text not null check (type in ('credit','debit')),
  amount             numeric(14,2) not null check (amount >= 0),
  reference          text,
  description        text,
  transaction_date   date not null default current_date,
  matched            boolean not null default false,
  reconciliation_id  uuid,
  payment_id         uuid references payments(id) on delete set null,
  settlement_id      uuid references settlements(id) on delete set null,
  created_at         timestamptz not null default now()
);

create index if not exists idx_bank_transactions_account on bank_transactions(bank_account_id, transaction_date desc);

-- ---------------------------------------------------------------------
-- bank_reconciliation
-- ---------------------------------------------------------------------
create table if not exists bank_reconciliation (
  id               uuid primary key default gen_random_uuid(),
  bank_account_id  uuid not null references bank_accounts(id) on delete cascade,
  statement_date   date not null,
  opening_balance  numeric(14,2) not null default 0,
  closing_balance  numeric(14,2) not null default 0,
  matched_count    integer not null default 0,
  unmatched_count  integer not null default 0,
  status           text not null default 'pending'
                   check (status in ('pending','partial','reconciled')),
  notes            text,
  reconciled_at    timestamptz,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- link bank_transactions.reconciliation_id
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bank_transactions_reconciliation_id_fkey'
  ) then
    alter table bank_transactions
      add constraint bank_transactions_reconciliation_id_fkey
      foreign key (reconciliation_id) references bank_reconciliation(id) on delete set null;
  end if;
exception when others then null;
end $$;

-- ---------------------------------------------------------------------
-- vendor_payments
-- ---------------------------------------------------------------------
create table if not exists vendor_payments (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references finance_vendors(id) on delete restrict,
  expense_id      uuid references expenses(id) on delete set null,
  amount          numeric(14,2) not null check (amount > 0),
  payment_status  text not null default 'scheduled'
                  check (payment_status in ('scheduled','paid','partial','cancelled')),
  scheduled_date  date,
  paid_at         timestamptz,
  reference       text,
  notes           text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_vendor_payments_vendor on vendor_payments(vendor_id, created_at desc);

-- ---------------------------------------------------------------------
-- gst_reports — extended metadata
-- ---------------------------------------------------------------------
alter table gst_reports
  add column if not exists report_type   text not null default 'monthly'
                                         check (report_type in ('monthly','quarterly','yearly','summary')),
  add column if not exists input_credit  numeric(14,2) not null default 0,
  add column if not exists output_tax    numeric(14,2) not null default 0,
  add column if not exists gst_payable   numeric(14,2) not null default 0,
  add column if not exists exported_at   timestamptz;

-- ---------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------
insert into permissions (code, description) values
  ('finance.view', 'View accounting dashboard, ledger and GST reports.'),
  ('finance.manage', 'Manage expenses, vendors, journal entries and reconciliation.'),
  ('finance.export', 'Export financial reports and GST data.')
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.code in ('finance.view', 'finance.manage', 'finance.export')
where r.name in ('admin', 'manager')
on conflict do nothing;

-- RLS
do $$
begin
  execute 'drop policy if exists manager_all on public.finance_vendors';
  execute 'create policy manager_all on public.finance_vendors for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.journal_entries';
  execute 'create policy manager_all on public.journal_entries for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.ledger_entries';
  execute 'create policy manager_all on public.ledger_entries for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.bank_accounts';
  execute 'create policy manager_all on public.bank_accounts for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.bank_transactions';
  execute 'create policy manager_all on public.bank_transactions for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.bank_reconciliation';
  execute 'create policy manager_all on public.bank_reconciliation for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
  execute 'drop policy if exists manager_all on public.vendor_payments';
  execute 'create policy manager_all on public.vendor_payments for all to authenticated using (public.is_manager() or public.is_staff()) with check (public.is_manager() or public.is_staff())';
exception when others then null;
end $$;
