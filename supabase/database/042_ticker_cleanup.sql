-- =====================================================================
-- 042_ticker_cleanup.sql
-- Remove legacy test ticker text and reset canonical brand items.
-- =====================================================================

-- Clear legacy CMS announcement text (no announcements table in schema).
update homepage_sections
set config = jsonb_set(config, '{text}', '""'::jsonb, true)
where key = 'announcement'
  and coalesce(config->>'text', '') ilike '%i am god%';

insert into site_settings (key, value) values (
  'ticker_items',
  '[
    "Dermatologically Tested ✓",
    "Made in India 🇮🇳",
    "5 Years of R&D",
    "Free Shipping on ₹999+",
    "Paraben Free",
    "Hypoallergenic",
    "Cruelty Free",
    "Safe for Newborns",
    "No Harmful Chemicals",
    "Pediatrician Recommended"
  ]'::jsonb
)
on conflict (key) do update set
  value = excluded.value,
  updated_at = now();
