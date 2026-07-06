-- =====================================================================
-- 034_site_settings_ticker.sql
-- Admin-controlled ticker items (site_settings.ticker_items)
-- Additive + idempotent.
-- =====================================================================

create table if not exists site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table site_settings enable row level security;

drop policy if exists public_read_site_settings on site_settings;
create policy public_read_site_settings on site_settings
  for select to anon, authenticated using (true);

drop policy if exists manager_all_site_settings on site_settings;
create policy manager_all_site_settings on site_settings
  for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

insert into site_settings (key, value) values (
  'ticker_items',
  '["Dermatologically Tested ✓", "Made in India 🇮🇳", "5 Years of R&D", "Free Shipping on ₹999+", "Paraben Free", "Hypoallergenic", "Cruelty Free", "Safe for Newborns", "Pediatrician Recommended"]'::jsonb
)
on conflict (key) do update set
  value = excluded.value,
  updated_at = now();
