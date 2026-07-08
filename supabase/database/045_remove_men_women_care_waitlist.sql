-- =====================================================================
-- 045_remove_men_women_care_waitlist.sql
-- Remove Men Care / Women Care launch waitlist signups (product retired).
-- Safe to re-run.
-- =====================================================================

delete from public.waitlist
where product_category ilike '%men care%'
   or product_category ilike '%women care%';
