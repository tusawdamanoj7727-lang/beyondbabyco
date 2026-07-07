-- =====================================================================
-- 039_newsletter_waitlist_connect.sql
-- Storefront newsletter + notify-me form backends (newsletter_subscribers, waitlist).
-- Safe to re-run.
-- =====================================================================

create table if not exists public.newsletter_subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text,
  source        text default 'website',
  is_active     boolean not null default true,
  subscribed_at timestamptz default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.newsletter_subscribers
  add column if not exists name text,
  add column if not exists subscribed_at timestamptz,
  add column if not exists unsubscribed_at timestamptz;

alter table public.newsletter_subscribers
  alter column source set default 'website';

update public.newsletter_subscribers
set subscribed_at = coalesce(subscribed_at, created_at, now())
where subscribed_at is null;

create table if not exists public.waitlist (
  id               uuid primary key default gen_random_uuid(),
  email            text not null,
  product_category text,
  product_id       text,
  source           text,
  created_at       timestamptz not null default now()
);

alter table public.waitlist
  add column if not exists product_id text,
  add column if not exists source text;

-- Relax NOT NULL on product_category for product-only signups (legacy rows keep values)
alter table public.waitlist
  alter column product_category drop not null;

create index if not exists idx_waitlist_product on public.waitlist(product_id)
  where product_id is not null;

create index if not exists idx_waitlist_category on public.waitlist(product_category);
create index if not exists idx_waitlist_created on public.waitlist(created_at desc);

alter table public.newsletter_subscribers enable row level security;
alter table public.waitlist enable row level security;

drop policy if exists public_insert_newsletter on public.newsletter_subscribers;
create policy public_insert_newsletter on public.newsletter_subscribers
  for insert to anon, authenticated with check (true);

drop policy if exists public_insert_waitlist on public.waitlist;
create policy public_insert_waitlist on public.waitlist
  for insert to anon, authenticated with check (true);
