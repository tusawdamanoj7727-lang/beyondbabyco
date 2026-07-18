-- =====================================================================
-- 056_webhook_idempotency_and_payment_rls.sql
-- 1) Unique Razorpay provider_event_id per gateway (dedupe concurrent webhooks)
-- 2) Customer SELECT on payments so account UI shows Paid
-- Safe to re-run.
-- =====================================================================

-- Keep oldest webhook row per (gateway_id, provider_event_id); drop newer duplicates.
with ranked as (
  select
    id,
    row_number() over (
      partition by gateway_id, provider_event_id
      order by created_at asc, id asc
    ) as rn
  from public.payment_webhooks
  where provider_event_id is not null
)
delete from public.payment_webhooks pw
using ranked r
where pw.id = r.id
  and r.rn > 1;

create unique index if not exists uq_payment_webhooks_gateway_provider_event
  on public.payment_webhooks (gateway_id, provider_event_id)
  where provider_event_id is not null;

-- Customers may read payments for their own orders (account Payment: Paid badge).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payments'
      and policyname = 'payments_owner_select'
  ) then
    create policy payments_owner_select on public.payments
      for select to authenticated
      using (
        exists (
          select 1 from public.orders o
          where o.id = payments.order_id
            and public.owns_customer(o.customer_id)
        )
      );
  end if;
end $$;
