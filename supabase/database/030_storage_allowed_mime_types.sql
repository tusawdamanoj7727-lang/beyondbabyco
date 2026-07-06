-- =====================================================================
-- 030_storage_allowed_mime_types.sql
-- Restrict storage buckets to raster images only (no SVG uploads).
-- documents bucket keeps PDF for compliance uploads.
-- Safe to re-run.
-- =====================================================================

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('products', 'homepage', 'mascots', 'blog', 'media');

update storage.buckets
set allowed_mime_types = array['application/pdf']
where id = 'documents';
