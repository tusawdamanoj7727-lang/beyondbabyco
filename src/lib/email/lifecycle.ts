import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

import { dispatchOrderEmail } from "./dispatch";

const PAID_STATUSES = new Set(["paid", "captured"]);

function logOrderEmail(step: string, extra: Record<string, unknown> = {}): void {
  console.info(JSON.stringify({ scope: "email.order_completion", step, ...extra }));
}

export type OrderCompletionChannel = "cod" | "prepaid";

/**
 * Resolve which confirmation channel applies for this order.
 * COD → confirmation at place-order. Prepaid → only after payment is paid/captured.
 */
export async function resolveOrderCompletionChannel(
  orderId: string,
): Promise<OrderCompletionChannel | null> {
  const supabase = createSupabaseServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.status === "cancelled") {
    logOrderEmail("resolveChannel.early_return", {
      orderId,
      why: !order ? "order_missing" : "order_cancelled",
    });
    return null;
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("status, method, provider")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment) {
    logOrderEmail("resolveChannel.early_return", { orderId, why: "payment_missing" });
    return null;
  }

  const method = (payment.method ?? payment.provider ?? "").toLowerCase();
  if (method === "cod") {
    logOrderEmail("resolveChannel.cod", { orderId });
    return "cod";
  }

  if (PAID_STATUSES.has(payment.status)) {
    logOrderEmail("resolveChannel.prepaid", { orderId, paymentStatus: payment.status });
    return "prepaid";
  }

  logOrderEmail("resolveChannel.early_return", {
    orderId,
    why: "prepaid_not_paid",
    paymentStatus: payment.status,
    method,
  });
  return null;
}

/** Idempotent pending → confirmed for storefront + fulfillment. */
export async function markOrderConfirmed(orderId: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.status === "cancelled") {
    logOrderEmail("markOrderConfirmed.early_return", {
      orderId,
      why: !order ? "order_missing" : "order_cancelled",
    });
    return false;
  }

  if (order.status === "pending") {
    await supabase
      .from("orders")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("status", "pending");
    logOrderEmail("markOrderConfirmed.updated", { orderId, from: "pending", to: "confirmed" });
  } else {
    logOrderEmail("markOrderConfirmed.unchanged", { orderId, orderStatus: order.status });
  }

  return true;
}

/**
 * Shared completion email pipeline for COD and Razorpay.
 * Must be awaited inside the checkout/capture request (Vercel freezes detached work).
 *
 * COD:   cod-confirmation + admin-new-order
 * Prepaid: order-confirmation + invoice + admin-new-order
 *
 * Idempotent via order_email_logs (unique order_id + template_id).
 */
export async function runOrderCompletionEmails(orderId: string): Promise<void> {
  logOrderEmail("runOrderCompletionEmails.entered", { orderId });

  const channel = await resolveOrderCompletionChannel(orderId);
  if (!channel) {
    logOrderEmail("runOrderCompletionEmails.early_return", { orderId, why: "no_channel" });
    return;
  }

  if (!(await markOrderConfirmed(orderId))) {
    logOrderEmail("runOrderCompletionEmails.early_return", {
      orderId,
      why: "mark_confirmed_failed",
    });
    return;
  }

  if (channel === "cod") {
    const confirmation = await dispatchOrderEmail(orderId, "cod-confirmation");
    logOrderEmail("after_customer_confirmation", {
      orderId,
      channel,
      templateId: "cod-confirmation",
      sent: confirmation.sent,
      skipped: confirmation.skipped,
      error: confirmation.error ?? null,
    });
  } else {
    const confirmation = await dispatchOrderEmail(orderId, "order-confirmation");
    logOrderEmail("after_customer_confirmation", {
      orderId,
      channel,
      templateId: "order-confirmation",
      sent: confirmation.sent,
      skipped: confirmation.skipped,
      error: confirmation.error ?? null,
    });

    const invoice = await dispatchOrderEmail(orderId, "invoice");
    logOrderEmail("after_invoice", {
      orderId,
      channel,
      sent: invoice.sent,
      skipped: invoice.skipped,
      error: invoice.error ?? null,
    });
  }

  const admin = await dispatchOrderEmail(orderId, "admin-new-order", { admin: true });
  logOrderEmail("after_admin", {
    orderId,
    channel,
    sent: admin.sent,
    skipped: admin.skipped,
    error: admin.error ?? null,
  });

  logOrderEmail("runOrderCompletionEmails.done", { orderId, channel });
}

/** @deprecated Use runOrderCompletionEmails — kept for temporary call-site compatibility. */
export async function runCodOrderCreatedEmails(orderId: string): Promise<void> {
  await runOrderCompletionEmails(orderId);
}

/** @deprecated Use runOrderCompletionEmails. */
export async function runPrepaidPaymentCapturedEmails(orderId: string): Promise<void> {
  await runOrderCompletionEmails(orderId);
}

/** @deprecated Never use fire-and-forget for completion emails on Vercel. */
export function runCodOrderCreatedEmailsAsync(orderId: string): void {
  console.warn(
    JSON.stringify({
      scope: "email.order_completion",
      step: "runCodOrderCreatedEmailsAsync.detached",
      orderId,
      warning: "fire_and_forget_forbidden_for_completion",
    }),
  );
  void runOrderCompletionEmails(orderId).catch((error) => {
    console.error(`[email] COD completion for order ${orderId} failed:`, error);
  });
}

/** @deprecated Never use fire-and-forget for completion emails on Vercel. */
export function runPrepaidPaymentCapturedEmailsAsync(orderId: string): void {
  console.warn(
    JSON.stringify({
      scope: "email.order_completion",
      step: "runPrepaidPaymentCapturedEmailsAsync.detached",
      orderId,
      warning: "fire_and_forget_forbidden_for_completion",
    }),
  );
  void runOrderCompletionEmails(orderId).catch((error) => {
    console.error(`[email] prepaid completion for order ${orderId} failed:`, error);
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

  if (!shipment?.tracking_number) {
    logOrderEmail("runOrderShippingEmail.early_return", { orderId, why: "no_tracking" });
    return;
  }

  await dispatchOrderEmail(orderId, "shipment-created");
}

export function runOrderShippingEmailAsync(orderId: string): void {
  void runOrderShippingEmail(orderId).catch((error) => {
    console.error(`[email] shipping email for order ${orderId} failed:`, error);
  });
}
