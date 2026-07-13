-- =====================================================================
-- 054_payment_webhook_event_id.sql
-- Store Razorpay x-razorpay-event-id on webhook rows for idempotent retries.
-- Safe to re-run.
-- =====================================================================

alter table public.payment_webhooks
  add column if not exists provider_event_id text;

create index if not exists idx_payment_webhooks_provider_event
  on public.payment_webhooks(gateway_id, provider_event_id)
  where provider_event_id is not null;

create index if not exists idx_payment_webhooks_capture_complete
  on public.payment_webhooks(gateway_id, provider_event_id, processed)
  where provider_event_id is not null and processed = true;
