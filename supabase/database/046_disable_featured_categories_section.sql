-- =====================================================================
-- 046_disable_featured_categories_section.sql
-- Remove orphaned homepage "Shop by Category" CMS section.
-- Safe to re-run.
-- =====================================================================

update public.homepage_sections
set is_enabled = false, updated_at = now()
where key = 'featured_categories';
