-- =====================================================================
-- 050_razorpay_payment_id_unique.sql
-- Prevent Razorpay payment ID reuse across orders (replay protection).
-- gateway_txn_id stores Razorpay order id; payment_ref stores payment id after capture.
-- =====================================================================

create unique index if not exists idx_payments_razorpay_payment_ref_unique
  on payments (payment_ref)
  where payment_ref is not null
    and provider = 'razorpay';
