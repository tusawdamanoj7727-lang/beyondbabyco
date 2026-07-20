import "server-only";

import type { OrderStatus } from "@/lib/supabase/database.types";
import { trackServerRefund } from "@/lib/analytics/measurement-protocol";

import { dispatchOrderEmail } from "../dispatch";
import { runOrderCompletionEmails } from "../lifecycle";

const STATUS_TEMPLATE_MAP: Partial<Record<OrderStatus, string>> = {
  processing: "order-packed",
  packed: "order-packed",
  shipped: "shipment-created",
  delivered: "order-delivered",
  cancelled: "order-cancelled",
  refunded: "refund-completed",
};

/**
 * @deprecated Prefer awaiting onCodOrderConfirmed / onPaymentSuccess.
 * Kept as a no-op for prepaid; COD must use awaited onCodOrderConfirmed.
 */
export function onOrderCreated(orderId: string, paymentMethod: string): void {
  void orderId;
  if (paymentMethod === "cod") {
    console.warn(
      JSON.stringify({
        scope: "email.order_completion",
        step: "onOrderCreated.ignored_cod",
        warning: "call_awaited_onCodOrderConfirmed_instead",
      }),
    );
  }
}

/** COD place-order completion — must be awaited. */
export async function onCodOrderConfirmed(orderId: string): Promise<void> {
  console.info(
    JSON.stringify({ scope: "email.order_completion", step: "onCodOrderConfirmed.entered", orderId }),
  );
  await runOrderCompletionEmails(orderId);
  console.info(
    JSON.stringify({ scope: "email.order_completion", step: "onCodOrderConfirmed.done", orderId }),
  );
}

/** Razorpay capture completion — must be awaited. */
export async function onPaymentSuccess(orderId: string): Promise<void> {
  console.info(
    JSON.stringify({ scope: "email.order_completion", step: "onPaymentSuccess.entered", orderId }),
  );
  await runOrderCompletionEmails(orderId);
  console.info(
    JSON.stringify({ scope: "email.order_completion", step: "onPaymentSuccess.done", orderId }),
  );
}

export async function onPaymentFailed(orderId: string): Promise<void> {
  await dispatchOrderEmail(orderId, "payment-failed");
  await dispatchOrderEmail(orderId, "admin-payment-failure", { admin: true });
}

export async function onOrderStatusChanged(orderId: string, status: OrderStatus): Promise<void> {
  const templateId = STATUS_TEMPLATE_MAP[status];
  if (!templateId) return;
  await dispatchOrderEmail(orderId, templateId);
  if (status === "refunded") {
    trackServerRefund({ transactionId: orderId });
  }
}

export async function onShipmentStatusChanged(
  orderId: string,
  shipmentStatus: string,
): Promise<void> {
  const map: Record<string, string> = {
    label_created: "shipment-created",
    in_transit: "in-transit",
    out_for_delivery: "delivery-out-for-delivery",
    delivered: "delivery-delivered",
  };
  const templateId = map[shipmentStatus];
  if (!templateId) return;
  await dispatchOrderEmail(orderId, templateId);
}

export async function onRefundInitiated(orderId: string, amount?: string): Promise<void> {
  void amount;
  await dispatchOrderEmail(orderId, "refund-initiated");
}

export async function onRefundCompleted(orderId: string, amount?: string): Promise<void> {
  const value = amount ? Number(amount) : undefined;
  await dispatchOrderEmail(orderId, "refund-completed");
  trackServerRefund({
    transactionId: orderId,
    value: Number.isFinite(value) ? value : undefined,
  });
}

export async function onOrderCancelled(orderId: string): Promise<void> {
  await onOrderStatusChanged(orderId, "cancelled");
}
