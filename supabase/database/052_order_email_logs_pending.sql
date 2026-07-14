-- =====================================================================
-- 052_order_email_logs_pending.sql
-- Allow pending status so dispatch claims a log row before SMTP send.
-- =====================================================================

alter table order_email_logs
  drop constraint if exists order_email_logs_status_check;

alter table order_email_logs
  add constraint order_email_logs_status_check
  check (status in ('pending', 'sent', 'failed'));
