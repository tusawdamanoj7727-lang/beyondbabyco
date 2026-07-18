-- Phase 2.5B — Operational reliability
-- Shared rate limits, refund gateway IDs, shipment scan dedupe

-- ── Rate limit buckets (shared across Vercel instances via Postgres) ──────────
create table if not exists public.rate_limit_buckets (
  bucket_key text primary key,
  hit_count integer not null default 0,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists rate_limit_buckets_reset_at_idx
  on public.rate_limit_buckets (reset_at);

alter table public.rate_limit_buckets enable row level security;

-- Service role only (no anon/authenticated policies)

create or replace function public.check_rate_limit(
  p_key text,
  p_max integer,
  p_window_ms integer
)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_reset timestamptz;
  v_count integer;
  v_window interval := make_interval(secs => greatest(1, ceil(p_window_ms::numeric / 1000.0)::int));
begin
  if p_key is null or length(trim(p_key)) = 0 then
    return query select true, p_max, 0;
    return;
  end if;

  insert into public.rate_limit_buckets (bucket_key, hit_count, reset_at, updated_at)
  values (p_key, 1, v_now + v_window, v_now)
  on conflict (bucket_key) do update
    set
      hit_count = case
        when public.rate_limit_buckets.reset_at <= v_now then 1
        else public.rate_limit_buckets.hit_count + 1
      end,
      reset_at = case
        when public.rate_limit_buckets.reset_at <= v_now then v_now + v_window
        else public.rate_limit_buckets.reset_at
      end,
      updated_at = v_now
  returning rate_limit_buckets.hit_count, rate_limit_buckets.reset_at
  into v_count, v_reset;

  if v_count > p_max then
    return query select
      false,
      0,
      greatest(1, ceil(extract(epoch from (v_reset - v_now)))::int);
  else
    return query select
      true,
      greatest(0, p_max - v_count),
      greatest(0, ceil(extract(epoch from (v_reset - v_now)))::int);
  end if;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

-- ── Refund gateway correlation ───────────────────────────────────────────────
alter table public.order_refunds
  add column if not exists gateway_refund_id text,
  add column if not exists provider_payload jsonb;

create unique index if not exists order_refunds_gateway_refund_id_uidx
  on public.order_refunds (gateway_refund_id)
  where gateway_refund_id is not null;

-- ── Shipment tracking scan dedupe ────────────────────────────────────────────
create unique index if not exists shipment_tracking_dedupe_uidx
  on public.shipment_tracking (shipment_id, status, event_time);

create unique index if not exists tracking_events_dedupe_uidx
  on public.tracking_events (shipment_id, status, occurred_at)
  where occurred_at is not null;
