-- =====================================================================
-- 051_order_email_logs.sql
-- Idempotent transactional order emails — one send per (order, template).
-- Failed sends remain retryable; successful sends are deduplicated.
-- =====================================================================

create table if not exists order_email_logs (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  template_id   text not null,
  recipient     text not null,
  status        text not null default 'sent'
                check (status in ('sent', 'failed')),
  error_message text,
  sent_at       timestamptz not null default now(),
  unique (order_id, template_id)
);

create index if not exists idx_order_email_logs_order
  on order_email_logs (order_id, sent_at desc);
