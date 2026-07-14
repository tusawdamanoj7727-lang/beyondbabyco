import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { fulfillOrderWithDelhivery } from "@/lib/checkout/fulfillment";
import { commitOrderStockReservations } from "@/lib/inventory/order-reservations";
import { verifyRazorpaySignature } from "@/lib/checkout/razorpay-client";
import { verifyRazorpayPaymentAgainstOrder } from "@/lib/checkout/razorpay-verify";
import { onPaymentSuccess } from "@/lib/email/events/orders";
import { runOrderShippingEmail } from "@/lib/email/lifecycle";

export type RazorpayCaptureSource = "webhook" | "client";

export interface CaptureRazorpayPaymentInput {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  source: RazorpayCaptureSource;
  customerId?: string;
}

export interface CaptureRazorpayPaymentResult {
  ok: boolean;
  error: string | null;
  awb?: string;
  alreadyCaptured?: boolean;
}

const PAID_STATUSES = new Set(["paid", "captured"]);

async function ensureFulfillment(
  orderId: string,
): Promise<{ ok: true; awb?: string } | { ok: false; error: string }> {
  const commitResult = await commitOrderStockReservations(orderId);
  if (!commitResult.ok) {
    return { ok: false, error: commitResult.error };
  }

  const fulfillment = await fulfillOrderWithDelhivery(orderId);
  return { ok: true, awb: fulfillment.awb };
}

/**
 * Idempotent Razorpay capture used by webhook (source of truth) and client fast-path.
 * Webhook path skips client signature; client path verifies HMAC then confirms via API.
 */
export async function captureRazorpayPayment(
  input: CaptureRazorpayPaymentInput,
): Promise<CaptureRazorpayPaymentResult> {
  const supabase = createSupabaseServiceClient();

  if (input.source === "client") {
    if (!input.customerId) {
      return { ok: false, error: "Not signed in." };
    }
    if (!input.razorpayOrderId || !input.razorpaySignature) {
      return { ok: false, error: "Missing payment verification fields." };
    }

    const valid = await verifyRazorpaySignature({
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySignature: input.razorpaySignature,
    });
    if (!valid) {
      return { ok: false, error: "Payment verification failed." };
    }
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id, status, grand_total")
    .eq("id", input.orderId)
    .maybeSingle();

  if (!order) {
    return { ok: false, error: "Order not found." };
  }

  if (input.source === "client" && order.customer_id !== input.customerId) {
    return { ok: false, error: "Order not found." };
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id, status, gateway_txn_id, payment_ref, amount, currency, provider")
    .eq("order_id", input.orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment) {
    return { ok: false, error: "Payment record not found." };
  }

  if (payment.provider !== "razorpay") {
    return { ok: false, error: "Payment is not a Razorpay payment." };
  }

  const expectedRazorpayOrderId = input.razorpayOrderId ?? payment.gateway_txn_id ?? undefined;
  if (!expectedRazorpayOrderId) {
    return { ok: false, error: "Razorpay order ID not linked to this payment." };
  }

  if (payment.gateway_txn_id && payment.gateway_txn_id !== expectedRazorpayOrderId) {
    return { ok: false, error: "Payment does not match this order." };
  }

  const { data: replayRow } = await supabase
    .from("payments")
    .select("id, order_id")
    .eq("payment_ref", input.razorpayPaymentId)
    .neq("order_id", input.orderId)
    .maybeSingle();

  if (replayRow) {
    return { ok: false, error: "Payment already used for another order." };
  }

  if (PAID_STATUSES.has(payment.status)) {
    if (payment.payment_ref && payment.payment_ref !== input.razorpayPaymentId) {
      console.info(
        JSON.stringify({
          scope: "email.prepaid",
          step: "captureRazorpayPayment.early_return",
          why: "already_paid_different_payment_ref",
          orderId: input.orderId,
        }),
      );
      return { ok: false, error: "Order already paid with a different payment." };
    }

    console.info(
      JSON.stringify({
        scope: "email.prepaid",
        step: "captureRazorpayPayment.already_captured",
        orderId: input.orderId,
        source: input.source,
      }),
    );
    // Idempotent: recover emails if a prior fire-and-forget was frozen on Vercel.
    await onPaymentSuccess(input.orderId);

    const fulfillment = await ensureFulfillment(input.orderId);
    if (!fulfillment.ok) {
      return { ok: false, error: fulfillment.error };
    }
    return { ok: true, error: null, awb: fulfillment.awb, alreadyCaptured: true };
  }

  if (payment.status !== "pending" && payment.status !== "authorized") {
    return { ok: false, error: `Payment cannot be captured (status: ${payment.status}).` };
  }

  const verified = await verifyRazorpayPaymentAgainstOrder({
    razorpayPaymentId: input.razorpayPaymentId,
    expectedRazorpayOrderId,
    expectedAmountInr: Number(order.grand_total),
    expectedCurrency: payment.currency ?? "INR",
  });

  if (!verified.ok) {
    return { ok: false, error: verified.error ?? "Payment verification failed." };
  }

  const now = new Date().toISOString();
  const { data: updated } = await supabase
    .from("payments")
    .update({
      status: "paid",
      method: "razorpay",
      provider: "razorpay",
      gateway_txn_id: expectedRazorpayOrderId,
      payment_ref: input.razorpayPaymentId,
      captured_at: now,
      updated_at: now,
    })
    .eq("id", payment.id)
    .in("status", ["pending", "authorized"])
    .select("id")
    .maybeSingle();

  if (!updated) {
    const { data: current } = await supabase
      .from("payments")
      .select("status, payment_ref")
      .eq("id", payment.id)
      .maybeSingle();

    if (
      current &&
      PAID_STATUSES.has(current.status) &&
      (!current.payment_ref || current.payment_ref === input.razorpayPaymentId)
    ) {
      console.info(
        JSON.stringify({
          scope: "email.prepaid",
          step: "captureRazorpayPayment.race_already_paid",
          orderId: input.orderId,
          source: input.source,
        }),
      );
      await onPaymentSuccess(input.orderId);
      const fulfillment = await ensureFulfillment(input.orderId);
      if (!fulfillment.ok) {
        return { ok: false, error: fulfillment.error };
      }
      return { ok: true, error: null, awb: fulfillment.awb, alreadyCaptured: true };
    }

    return { ok: false, error: "Payment capture race — could not update payment." };
  }

  await supabase.from("order_events").insert({
    order_id: input.orderId,
    type: "payment",
    message: "Razorpay payment captured.",
    metadata: {
      razorpay_payment_id: input.razorpayPaymentId,
      razorpay_order_id: expectedRazorpayOrderId,
      source: input.source,
    } as Json,
  });

  // Await emails inside this request — fire-and-forget is frozen by Vercel after response.
  console.info(
    JSON.stringify({
      scope: "email.prepaid",
      step: "captureRazorpayPayment.before_onPaymentSuccess",
      orderId: input.orderId,
      source: input.source,
    }),
  );
  await onPaymentSuccess(input.orderId);
  console.info(
    JSON.stringify({
      scope: "email.prepaid",
      step: "captureRazorpayPayment.after_onPaymentSuccess",
      orderId: input.orderId,
      source: input.source,
    }),
  );

  const fulfillment = await ensureFulfillment(input.orderId);
  if (!fulfillment.ok) {
    return { ok: false, error: fulfillment.error };
  }

  if (fulfillment.awb) {
    await runOrderShippingEmail(input.orderId);
  }
  return { ok: true, error: null, awb: fulfillment.awb };
}

export interface RazorpayWebhookCaptureInfo {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  internalOrderId?: string;
}

/** Parse Razorpay webhook payload for payment.captured / order.paid events. */
export function parseRazorpayWebhookCaptureInfo(
  payload: Record<string, unknown>,
): RazorpayWebhookCaptureInfo | null {
  const nested = payload.payload as Record<string, unknown> | undefined;
  const paymentEntity = (nested?.payment as Record<string, unknown> | undefined)?.entity as
    | Record<string, unknown>
    | undefined;

  if (paymentEntity?.id && paymentEntity?.order_id) {
    const notes = paymentEntity.notes as Record<string, string> | undefined;
    return {
      razorpayPaymentId: String(paymentEntity.id),
      razorpayOrderId: String(paymentEntity.order_id),
      internalOrderId: notes?.order_id?.trim() || undefined,
    };
  }

  const orderEntity = (nested?.order as Record<string, unknown> | undefined)?.entity as
    | Record<string, unknown>
    | undefined;

  if (orderEntity?.id) {
    const notes = orderEntity.notes as Record<string, string> | undefined;
    return {
      razorpayPaymentId: "",
      razorpayOrderId: String(orderEntity.id),
      internalOrderId: notes?.order_id?.trim() || undefined,
    };
  }

  return null;
}

export async function resolveInternalOrderIdForRazorpayWebhook(
  info: RazorpayWebhookCaptureInfo,
): Promise<string | null> {
  if (info.internalOrderId) return info.internalOrderId;

  const supabase = createSupabaseServiceClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("order_id")
    .eq("gateway_txn_id", info.razorpayOrderId)
    .eq("provider", "razorpay")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return payment?.order_id ?? null;
}
