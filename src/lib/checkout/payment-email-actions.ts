"use server";

import { releaseOrderStockReservations } from "@/lib/inventory/order-reservations";
import { releaseCouponForOrder } from "@/lib/coupons/redemption";
import { getCurrentUser } from "@/lib/auth/session";
import { getCustomerIdForUser } from "@/lib/orders/customer-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { onPaymentFailed } from "@/lib/email/events/orders";

/** Release inventory reservation when Razorpay is dismissed or fails. Idempotent. */
export async function abandonCheckoutPaymentAction(orderId: string): Promise<void> {
  const trimmed = orderId?.trim();
  if (!trimmed) return;

  const user = await getCurrentUser();
  const customerId = user ? await getCustomerIdForUser(user.id) : null;
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

  await releaseOrderStockReservations(trimmed);
  await releaseCouponForOrder(trimmed);

  await supabase
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", trimmed)
    .eq("status", "pending");

  await supabase.from("order_events").insert({
    order_id: trimmed,
    type: "payment",
    message: "Payment abandoned — stock reservation released.",
    metadata: { reason: "payment_abandoned" },
  });

  await onPaymentFailed(trimmed);
}

/** Fire-and-forget payment failure notification — does not block checkout UI. */
export async function notifyPaymentFailedAction(orderId: string): Promise<void> {
  await abandonCheckoutPaymentAction(orderId);
}
