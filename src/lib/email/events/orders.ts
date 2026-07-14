import "server-only";

import type { OrderStatus } from "@/lib/supabase/database.types";

import { dispatchOrderEmailAsync } from "../dispatch";
import {
  runCodOrderCreatedEmailsAsync,
  runPrepaidPaymentCapturedEmails,
} from "../lifecycle";

const STATUS_TEMPLATE_MAP: Partial<Record<OrderStatus, string>> = {
  processing: "order-packed",
  packed: "order-packed",
  shipped: "shipment-created",
  delivered: "order-delivered",
  cancelled: "order-cancelled",
  refunded: "refund-completed",
};

/** COD: confirmation at create. Prepaid: no customer email until payment capture. */
export function onOrderCreated(orderId: string, paymentMethod: string): void {
  if (paymentMethod === "cod") {
    runCodOrderCreatedEmailsAsync(orderId);
  }
  // Prepaid: admin + customer emails deferred to runPrepaidPaymentCapturedEmails.
}

/**
 * Prepaid only — after verified payment capture. Sends confirmation + invoice.
 * Must be awaited so Vercel does not freeze the isolate before dispatchOrderEmail runs.
 */
export async function onPaymentSuccess(orderId: string): Promise<void> {
  console.info(JSON.stringify({ scope: "email.prepaid", step: "onPaymentSuccess.entered", orderId }));
  await runPrepaidPaymentCapturedEmails(orderId);
  console.info(JSON.stringify({ scope: "email.prepaid", step: "onPaymentSuccess.done", orderId }));
}

export function onPaymentFailed(orderId: string): void {
  dispatchOrderEmailAsync(orderId, "payment-failed");
  dispatchOrderEmailAsync(orderId, "admin-payment-failure", { admin: true });
}

export function onOrderStatusChanged(orderId: string, status: OrderStatus): void {
  const templateId = STATUS_TEMPLATE_MAP[status];
  if (!templateId) return;
  dispatchOrderEmailAsync(orderId, templateId);
}

export function onShipmentStatusChanged(
  orderId: string,
  shipmentStatus: string,
): void {
  const map: Record<string, string> = {
    label_created: "shipment-created",
    in_transit: "in-transit",
    out_for_delivery: "delivery-out-for-delivery",
    delivered: "delivery-delivered",
  };
  const templateId = map[shipmentStatus];
  if (!templateId) return;
  dispatchOrderEmailAsync(orderId, templateId);
}

export function onRefundInitiated(orderId: string, amount?: string): void {
  void amount;
  dispatchOrderEmailAsync(orderId, "refund-initiated");
}

export function onRefundCompleted(orderId: string, amount?: string): void {
  void amount;
  dispatchOrderEmailAsync(orderId, "refund-completed");
}

export function onOrderCancelled(orderId: string): void {
  onOrderStatusChanged(orderId, "cancelled");
}
