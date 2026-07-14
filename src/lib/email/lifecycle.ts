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

function logPrepaidEmail(step: string, extra: Record<string, unknown> = {}): void {
  console.info(JSON.stringify({ scope: "email.prepaid", step, ...extra }));
}

async function markPrepaidOrderConfirmed(orderId: string): Promise<boolean> {
  logPrepaidEmail("markPrepaidOrderConfirmed.entered", { orderId });
  const supabase = createSupabaseServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.status === "cancelled") {
    logPrepaidEmail("markPrepaidOrderConfirmed.early_return", {
      orderId,
      why: !order ? "order_missing" : "order_cancelled",
      orderStatus: order?.status ?? null,
    });
    return false;
  }

  if (order.status === "pending") {
    await supabase
      .from("orders")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("status", "pending");
    logPrepaidEmail("markPrepaidOrderConfirmed.updated", { orderId, from: "pending", to: "confirmed" });
  } else {
    logPrepaidEmail("markPrepaidOrderConfirmed.unchanged", { orderId, orderStatus: order.status });
  }

  return true;
}

async function isPrepaidPaymentCaptured(orderId: string): Promise<boolean> {
  logPrepaidEmail("isPrepaidPaymentCaptured.entered", { orderId });
  const supabase = createSupabaseServiceClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("status, method, provider")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment) {
    logPrepaidEmail("isPrepaidPaymentCaptured.early_return", { orderId, why: "payment_missing" });
    return false;
  }
  if (payment.method === "cod" || payment.provider === "cod") {
    logPrepaidEmail("isPrepaidPaymentCaptured.early_return", {
      orderId,
      why: "cod_payment",
      method: payment.method,
      provider: payment.provider,
    });
    return false;
  }

  const captured = PAID_STATUSES.has(payment.status);
  logPrepaidEmail("isPrepaidPaymentCaptured.result", {
    orderId,
    paymentStatus: payment.status,
    captured,
  });
  return captured;
}

/**
 * Prepaid lifecycle after verified capture:
 * update order → confirmation → invoice (+ admin alert).
 * Must be awaited from the payment capture request (Vercel freezes detached work).
 */
export async function runPrepaidPaymentCapturedEmails(orderId: string): Promise<void> {
  logPrepaidEmail("runPrepaidPaymentCapturedEmails.entered", { orderId });

  if (!(await isPrepaidPaymentCaptured(orderId))) {
    logPrepaidEmail("runPrepaidPaymentCapturedEmails.early_return", {
      orderId,
      why: "payment_not_captured",
    });
    return;
  }
  if (!(await markPrepaidOrderConfirmed(orderId))) {
    logPrepaidEmail("runPrepaidPaymentCapturedEmails.early_return", {
      orderId,
      why: "mark_confirmed_failed",
    });
    return;
  }

  const confirmation = await dispatchOrderEmail(orderId, "order-confirmation");
  logPrepaidEmail("runPrepaidPaymentCapturedEmails.after_confirmation", {
    orderId,
    sent: confirmation.sent,
    skipped: confirmation.skipped,
    error: confirmation.error ?? null,
  });

  const invoice = await dispatchOrderEmail(orderId, "invoice");
  logPrepaidEmail("runPrepaidPaymentCapturedEmails.after_invoice", {
    orderId,
    sent: invoice.sent,
    skipped: invoice.skipped,
    error: invoice.error ?? null,
  });

  const admin = await dispatchOrderEmail(orderId, "admin-new-order", { admin: true });
  logPrepaidEmail("runPrepaidPaymentCapturedEmails.after_admin", {
    orderId,
    sent: admin.sent,
    skipped: admin.skipped,
    error: admin.error ?? null,
  });

  logPrepaidEmail("runPrepaidPaymentCapturedEmails.done", { orderId });
}

/** @deprecated Prefer awaiting runPrepaidPaymentCapturedEmails from capture paths. */
export function runPrepaidPaymentCapturedEmailsAsync(orderId: string): void {
  logPrepaidEmail("runPrepaidPaymentCapturedEmailsAsync.detached", {
    orderId,
    warning: "fire_and_forget_may_be_frozen_on_vercel",
  });
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
