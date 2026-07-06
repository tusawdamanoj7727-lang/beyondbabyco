-- =====================================================================
-- 027_waitlist.sql
-- Category launch waitlist for Notify Me signups (Men Care, Women Care, etc.)
-- =====================================================================

create table if not exists public.waitlist (
  id               uuid primary key default gen_random_uuid(),
  email            text not null,
  product_category text not null,
  created_at       timestamptz not null default now(),
  unique (email, product_category)
);

create index if not exists idx_waitlist_category on public.waitlist(product_category);
create index if not exists idx_waitlist_created on public.waitlist(created_at desc);

alter table public.waitlist enable row level security;

drop policy if exists public_insert_waitlist on public.waitlist;
create policy public_insert_waitlist on public.waitlist
  for insert
  to anon, authenticated
  with check (true);
