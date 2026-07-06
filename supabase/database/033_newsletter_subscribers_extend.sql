-- =====================================================================
-- 033_newsletter_subscribers_extend.sql
-- Extend newsletter_subscribers for name + subscribe/unsubscribe timestamps.
-- Safe to re-run.
-- =====================================================================

alter table public.newsletter_subscribers
  add column if not exists name text,
  add column if not exists subscribed_at timestamptz,
  add column if not exists unsubscribed_at timestamptz;

alter table public.newsletter_subscribers
  alter column source set default 'website';

update public.newsletter_subscribers
set subscribed_at = coalesce(subscribed_at, created_at, now())
where subscribed_at is null;

comment on column public.newsletter_subscribers.subscribed_at is 'When the subscriber opted in';
comment on column public.newsletter_subscribers.unsubscribed_at is 'When the subscriber opted out (null if active)';
