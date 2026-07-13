import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

import { dispatchOrderEmail, dispatchOrderEmailAsync } from "./dispatch";

const PAID_STATUSES = new Set(["paid", "captured"]);

/**
 * COD lifecycle: order created → customer confirmation (+ admin alert).
 * No invoice or shipping here — shipping fires after AWB creation.
 */
export async function runCodOrderCreatedEmails(orderId: string): Promise<void> {
  await dispatchOrderEmail(orderId, "cod-confirmation");
  await dispatchOrderEmail(orderId, "admin-new-order", { admin: true });
}

export function runCodOrderCreatedEmailsAsync(orderId: string): void {
  void runCodOrderCreatedEmails(orderId).catch((error) => {
    console.error(`[email] COD lifecycle for order ${orderId} failed:`, error);
  });
}

async function markPrepaidOrderConfirmed(orderId: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.status === "cancelled") return false;

  if (order.status === "pending") {
    await supabase
      .from("orders")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("status", "pending");
  }

  return true;
}

async function isPrepaidPaymentCaptured(orderId: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("status, method, provider")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment) return false;
  if (payment.method === "cod" || payment.provider === "cod") return false;

  return PAID_STATUSES.has(payment.status);
}

/**
 * Prepaid lifecycle after verified capture:
 * update order → confirmation → invoice (+ admin alert).
 */
export async function runPrepaidPaymentCapturedEmails(orderId: string): Promise<void> {
  if (!(await isPrepaidPaymentCaptured(orderId))) return;
  if (!(await markPrepaidOrderConfirmed(orderId))) return;

  await dispatchOrderEmail(orderId, "order-confirmation");
  await dispatchOrderEmail(orderId, "invoice");
  await dispatchOrderEmail(orderId, "admin-new-order", { admin: true });
}

export function runPrepaidPaymentCapturedEmailsAsync(orderId: string): void {
  void runPrepaidPaymentCapturedEmails(orderId).catch((error) => {
    console.error(`[email] prepaid lifecycle for order ${orderId} failed:`, error);
  });
}

/** Shipping email after AWB / label is created. Idempotent via order_email_logs. */
export async function runOrderShippingEmail(orderId: string): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const { data: shipment } = await supabase
    .from("shipments")
    .select("tracking_number")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!shipment?.tracking_number) return;

  await dispatchOrderEmail(orderId, "shipment-created");
}

export function runOrderShippingEmailAsync(orderId: string): void {
  void runOrderShippingEmail(orderId).catch((error) => {
    console.error(`[email] shipping email for order ${orderId} failed:`, error);
  });
}
