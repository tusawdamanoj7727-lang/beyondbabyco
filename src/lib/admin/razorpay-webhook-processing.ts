import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/supabase/database.types";

import {
  RAZORPAY_CAPTURE_COMPLETED_LOG,
  RAZORPAY_WEBHOOK_RECEIVED_LOG,
} from "./razorpay-webhook-idempotency";

/** True when a prior delivery fully captured payment for this Razorpay event id. */
export async function isRazorpayCaptureCompleted(
  gatewayId: string,
  eventId: string,
): Promise<boolean> {
  const supabase = createSupabaseServiceClient();

  const { count: logCount, error: logError } = await supabase
    .from("payment_logs")
    .select("id", { count: "exact", head: true })
    .eq("gateway_id", gatewayId)
    .eq("message", RAZORPAY_CAPTURE_COMPLETED_LOG)
    .contains("metadata", { razorpay_event_id: eventId });

  if (!logError && (logCount ?? 0) > 0) {
    return true;
  }

  const { count: webhookCount, error: webhookError } = await supabase
    .from("payment_webhooks")
    .select("id", { count: "exact", head: true })
    .eq("gateway_id", gatewayId)
    .eq("provider_event_id", eventId)
    .eq("processed", true);

  if (webhookError) return false;
  return (webhookCount ?? 0) > 0;
}

export async function logRazorpayWebhookReceived(input: {
  gatewayId: string;
  webhookId: string;
  eventId: string | null;
  eventType: string;
}): Promise<void> {
  const supabase = createSupabaseServiceClient();
  await supabase.from("payment_logs").insert({
    gateway_id: input.gatewayId,
    level: "info",
    message: RAZORPAY_WEBHOOK_RECEIVED_LOG,
    metadata: {
      webhook_id: input.webhookId,
      razorpay_event_id: input.eventId,
      event_type: input.eventType,
    } as Json,
  });
}

export async function markRazorpayWebhookCaptureComplete(input: {
  gatewayId: string;
  webhookId: string;
  eventId: string | null;
  orderId: string;
  razorpayPaymentId: string;
}): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const now = new Date().toISOString();

  await supabase
    .from("payment_webhooks")
    .update({
      processed: true,
      processed_at: now,
      error: null,
    })
    .eq("id", input.webhookId);

  if (!input.eventId) return;

  await supabase.from("payment_logs").insert({
    gateway_id: input.gatewayId,
    level: "info",
    message: RAZORPAY_CAPTURE_COMPLETED_LOG,
    metadata: {
      webhook_id: input.webhookId,
      razorpay_event_id: input.eventId,
      order_id: input.orderId,
      razorpay_payment_id: input.razorpayPaymentId,
    } as Json,
  });
}
