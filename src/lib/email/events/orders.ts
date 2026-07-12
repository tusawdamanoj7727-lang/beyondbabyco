import "server-only";

import { absoluteUrl } from "@/lib/seo/site";
import type { OrderStatus } from "@/lib/supabase/database.types";

import { getSmtpConfig } from "../config";
import { resolveCustomerEmailData, resolveOrderEmailData } from "../data-resolvers";
import { sendTemplateEmailAsync } from "../send-template";

const STATUS_TEMPLATE_MAP: Partial<Record<OrderStatus, string>> = {
  confirmed: "order-confirmation",
  processing: "order-packed",
  packed: "order-packed",
  shipped: "shipment-created",
  delivered: "order-delivered",
  cancelled: "order-cancelled",
  refunded: "refund-completed",
};

async function customerEmailForOrder(orderId: string): Promise<{
  email: string;
  data: Record<string, string>;
} | null> {
  const data = await resolveOrderEmailData(orderId);
  if (!data?.customer_email) return null;
  return { email: data.customer_email, data };
}

function notifyAdmin(templateId: string, data: Record<string, string>): void {
  const adminEmail = getSmtpConfig()?.adminAlertEmail;
  if (!adminEmail) return;
  sendTemplateEmailAsync(templateId, adminEmail, {
    admin_order_url: absoluteUrl(`/admin/orders/${data.order_id ?? ""}`),
    admin_customers_url: absoluteUrl("/admin/customers"),
    admin_support_url: absoluteUrl("/admin/support"),
    admin_inventory_url: absoluteUrl("/admin/inventory"),
    ...data,
  });
}

/** Order created — COD gets confirmation immediately; prepaid waits for payment. */
export function onOrderCreated(orderId: string, paymentMethod: string): void {
  void (async () => {
    const resolved = await customerEmailForOrder(orderId);
    if (!resolved) return;

    const { email, data } = resolved;
    data.order_id = orderId;

    if (paymentMethod === "cod") {
      sendTemplateEmailAsync("cod-confirmation", email, data);
    } else {
      sendTemplateEmailAsync("order-confirmation", email, data);
    }

    notifyAdmin("admin-new-order", data);
  })().catch((e) => console.error("[email] onOrderCreated failed:", e));
}

export function onPaymentSuccess(orderId: string): void {
  void (async () => {
    const resolved = await customerEmailForOrder(orderId);
    if (!resolved) return;
    const { email, data } = resolved;
    sendTemplateEmailAsync("payment-received", email, data);
    sendTemplateEmailAsync("order-confirmation", email, data);
  })().catch((e) => console.error("[email] onPaymentSuccess failed:", e));
}

export function onPaymentFailed(orderId: string): void {
  void (async () => {
    const resolved = await customerEmailForOrder(orderId);
    if (!resolved) return;
    const { email, data } = resolved;
    sendTemplateEmailAsync("payment-failed", email, data);
    notifyAdmin("admin-payment-failure", { ...data, order_id: orderId });
  })().catch((e) => console.error("[email] onPaymentFailed failed:", e));
}

export function onOrderStatusChanged(orderId: string, status: OrderStatus): void {
  const templateId = STATUS_TEMPLATE_MAP[status];
  if (!templateId) return;

  void (async () => {
    const resolved = await customerEmailForOrder(orderId);
    if (!resolved) return;
    sendTemplateEmailAsync(templateId, resolved.email, resolved.data);
  })().catch((e) => console.error("[email] onOrderStatusChanged failed:", e));
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

  void (async () => {
    const resolved = await customerEmailForOrder(orderId);
    if (!resolved) return;
    sendTemplateEmailAsync(templateId, resolved.email, resolved.data);
  })().catch((e) => console.error("[email] onShipmentStatusChanged failed:", e));
}

export function onRefundInitiated(orderId: string, amount?: string): void {
  void (async () => {
    const resolved = await customerEmailForOrder(orderId);
    if (!resolved) return;
    if (amount) resolved.data.refund_amount = amount;
    sendTemplateEmailAsync("refund-initiated", resolved.email, resolved.data);
  })().catch((e) => console.error("[email] onRefundInitiated failed:", e));
}

export function onRefundCompleted(orderId: string, amount?: string): void {
  void (async () => {
    const resolved = await customerEmailForOrder(orderId);
    if (!resolved) return;
    if (amount) resolved.data.refund_amount = amount;
    sendTemplateEmailAsync("refund-completed", resolved.email, resolved.data);
  })().catch((e) => console.error("[email] onRefundCompleted failed:", e));
}

export function onOrderCancelled(orderId: string): void {
  onOrderStatusChanged(orderId, "cancelled");
}
