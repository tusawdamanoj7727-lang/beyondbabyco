-- =====================================================================
-- 043_newsletter_notify_me_confirm.sql
-- Confirms storefront newsletter + waitlist tables (see also 039).
-- Safe to re-run.
-- =====================================================================

create table if not exists public.newsletter_subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  source        text default 'website',
  subscribed_at timestamptz default now()
);

alter table public.newsletter_subscribers
  add column if not exists source text default 'website',
  add column if not exists subscribed_at timestamptz default now();

create table if not exists public.waitlist (
  id               uuid primary key default gen_random_uuid(),
  email            text not null,
  product_category text,
  created_at       timestamptz default now()
);

alter table public.waitlist
  add column if not exists product_category text,
  add column if not exists created_at timestamptz default now();

alter table public.newsletter_subscribers enable row level security;
alter table public.waitlist enable row level security;

drop policy if exists public_insert_newsletter on public.newsletter_subscribers;
create policy public_insert_newsletter on public.newsletter_subscribers
  for insert to anon, authenticated with check (true);

drop policy if exists public_insert_waitlist on public.waitlist;
create policy public_insert_waitlist on public.waitlist
  for insert to anon, authenticated with check (true);
