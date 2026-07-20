"use server";

import { releaseOrderStockReservations } from "@/lib/inventory/order-reservations";
import { releaseCouponForOrder } from "@/lib/coupons/redemption";
import { resolveCheckoutCustomerIdForOrder } from "@/lib/checkout/guest-customer";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { onPaymentFailed } from "@/lib/email/events/orders";

/**
 * Soft-abandon: release stock/coupon but do NOT cancel the order.
 * Cancelling on dismiss races with a successful Razorpay capture
 * (money taken + cancelled order). Capture path can still confirm.
 */
export async function abandonCheckoutPaymentAction(orderId: string): Promise<void> {
  const trimmed = orderId?.trim();
  if (!trimmed) return;

  const { customerId } = await resolveCheckoutCustomerIdForOrder(trimmed);
  if (!customerId) return;

  const supabase = createSupabaseServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id, status")
    .eq("id", trimmed)
    .maybeSingle();

  if (!order || order.customer_id !== customerId || order.status !== "pending") {
    return;
  }

  // If payment already captured, never abandon.
  const { data: payment } = await supabase
    .from("payments")
    .select("id, status")
    .eq("order_id", trimmed)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (payment?.status === "paid") {
    return;
  }

  await releaseOrderStockReservations(trimmed);
  await releaseCouponForOrder(trimmed);

  await supabase.from("order_events").insert({
    order_id: trimmed,
    type: "payment",
    message: "Payment dismissed — stock reservation released; order left pending for capture/TTL.",
    metadata: { reason: "payment_abandoned_soft" },
  });
}

/** Notify failure email without cancelling (avoids capture race). */
export async function notifyPaymentFailedAction(orderId: string): Promise<void> {
  const trimmed = orderId?.trim();
  if (!trimmed) return;
  await abandonCheckoutPaymentAction(trimmed);
  await onPaymentFailed(trimmed);
}
