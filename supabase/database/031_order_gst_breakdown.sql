-- =====================================================================
-- 031_order_gst_breakdown.sql
-- CGST / SGST / IGST breakdown on orders for Indian GST compliance.
-- Safe to re-run.
-- =====================================================================

alter table public.orders
  add column if not exists cgst_amount numeric(10, 2) default 0,
  add column if not exists sgst_amount numeric(10, 2) default 0,
  add column if not exists igst_amount numeric(10, 2) default 0,
  add column if not exists shipping_state text,
  add column if not exists buyer_gstin text;
