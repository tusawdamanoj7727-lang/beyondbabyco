-- =====================================================================
-- 059_payment_shipping_rls_enable.sql
-- Enable RLS on payment/shipping secret tables created after 003_rls.sql.
-- Tighten gateway/carrier policies to manager/admin only (not all staff).
-- Safe to re-run.
-- =====================================================================

-- Ensure RLS is on (policies alone do nothing if RLS is disabled).
alter table if exists public.payment_gateways enable row level security;
alter table if exists public.payment_webhooks enable row level security;
alter table if exists public.payment_logs enable row level security;
alter table if exists public.settlements enable row level security;
alter table if exists public.shipping_carriers enable row level security;
alter table if exists public.shipping_zones enable row level security;
alter table if exists public.shipping_rates enable row level security;

-- payment_gateways: managers only (secrets live here)
do $$
begin
  execute 'drop policy if exists manager_all on public.payment_gateways';
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment_gateways' and policyname = 'payment_gateways_manager_all'
  ) then
    create policy payment_gateways_manager_all on public.payment_gateways
      for all to authenticated
      using (public.is_manager())
      with check (public.is_manager());
  end if;
end $$;

-- payment_webhooks: managers only
do $$
begin
  execute 'drop policy if exists manager_all on public.payment_webhooks';
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment_webhooks' and policyname = 'payment_webhooks_manager_all'
  ) then
    create policy payment_webhooks_manager_all on public.payment_webhooks
      for all to authenticated
      using (public.is_manager())
      with check (public.is_manager());
  end if;
end $$;

-- payment_logs: managers only
do $$
begin
  execute 'drop policy if exists manager_all on public.payment_logs';
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payment_logs' and policyname = 'payment_logs_manager_all'
  ) then
    create policy payment_logs_manager_all on public.payment_logs
      for all to authenticated
      using (public.is_manager())
      with check (public.is_manager());
  end if;
end $$;

-- settlements: managers only
do $$
begin
  execute 'drop policy if exists manager_all on public.settlements';
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'settlements' and policyname = 'settlements_manager_all'
  ) then
    create policy settlements_manager_all on public.settlements
      for all to authenticated
      using (public.is_manager())
      with check (public.is_manager());
  end if;
end $$;

-- shipping_carriers: managers only (API keys)
do $$
begin
  execute 'drop policy if exists manager_all on public.shipping_carriers';
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'shipping_carriers' and policyname = 'shipping_carriers_manager_all'
  ) then
    create policy shipping_carriers_manager_all on public.shipping_carriers
      for all to authenticated
      using (public.is_manager())
      with check (public.is_manager());
  end if;
end $$;
