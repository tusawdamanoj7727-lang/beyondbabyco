-- =====================================================================
-- 026_product_availability_waitlist.sql
-- Launch product stock/status + waitlist_emails for Notify Me signups.
-- =====================================================================

create table if not exists public.waitlist_emails (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (email, product_id)
);

create index if not exists idx_waitlist_emails_product on public.waitlist_emails(product_id);
create index if not exists idx_waitlist_emails_created on public.waitlist_emails(created_at desc);

alter table public.waitlist_emails enable row level security;

drop policy if exists public_insert_waitlist_emails on public.waitlist_emails;
create policy public_insert_waitlist_emails on public.waitlist_emails
  for insert
  to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------
-- Launch products: active with stock
-- ---------------------------------------------------------------------
update public.products
set
  status = 'active',
  stock = 500,
  published_at = coalesce(published_at, now())
where slug = 'pure-gentle-water-baby-wipes'
  and deleted_at is null;

update public.products
set
  status = 'active',
  stock = 180,
  published_at = coalesce(published_at, now())
where slug = 'ayurvedic-massage-oil'
  and deleted_at is null;

-- Wipes: keep only 72-count and 144-count variants active
update public.product_variants pv
set name = '144 Wipes', sku = 'BBC-WIPES-PURE-144'
from public.products p
where pv.product_id = p.id
  and p.slug = 'pure-gentle-water-baby-wipes'
  and pv.sku = 'BBC-WIPES-PURE-120';

update public.product_variants pv
set is_active = false
from public.products p
where pv.product_id = p.id
  and p.slug = 'pure-gentle-water-baby-wipes'
  and pv.sku not in ('BBC-WIPES-PURE-72', 'BBC-WIPES-PURE-144');

update public.product_variants pv
set is_active = true
from public.products p
where pv.product_id = p.id
  and p.slug = 'pure-gentle-water-baby-wipes'
  and pv.sku in ('BBC-WIPES-PURE-72', 'BBC-WIPES-PURE-144');

-- ---------------------------------------------------------------------
-- All other storefront products: coming soon (no purchasable stock)
-- ---------------------------------------------------------------------
update public.products
set
  status = 'coming_soon',
  stock = 0,
  published_at = null
where slug not in ('pure-gentle-water-baby-wipes', 'ayurvedic-massage-oil')
  and deleted_at is null
  and status in ('active', 'coming_soon');
