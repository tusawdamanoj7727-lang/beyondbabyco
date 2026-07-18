import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/supabase/database.types";
import { logger } from "@/lib/observability/logger";
import {
  captureRazorpayPayment,
  parseRazorpayWebhookCaptureInfo,
  resolveInternalOrderIdForRazorpayWebhook,
} from "@/lib/checkout/razorpay-capture";
import { fetchRazorpayOrderPayments } from "@/lib/checkout/razorpay-verify";
import { getPaymentGatewayAdapter } from "./gateway-adapters";
import { decodeGatewaySecret, resolveRazorpayWebhookSecret } from "./gateway-adapters/razorpay";
import type { GatewayProvider } from "./payment-types";
import { isRazorpayCaptureEvent, isRazorpayShipmentEvent } from "./razorpay-webhook-idempotency";
import {
  isRazorpayCaptureCompleted,
  logRazorpayWebhookReceived,
  markRazorpayWebhookCaptureComplete,
} from "./razorpay-webhook-processing";

export interface WebhookProcessOptions {
  rawBody?: string;
  eventId?: string | null;
}

async function resolveRazorpayPaymentId(info: {
  razorpayPaymentId: string;
  razorpayOrderId: string;
}): Promise<string | null> {
  if (info.razorpayPaymentId) return info.razorpayPaymentId;

  const fetched = await fetchRazorpayOrderPayments(info.razorpayOrderId);
  if (!fetched.ok || !fetched.payments?.length) return null;

  const paid = fetched.payments.find(
    (p) => p.status === "captured" || p.status === "authorized",
  );
  return paid?.id ?? null;
}

async function processRazorpayCaptureWebhook(
  gatewayId: string,
  webhookId: string,
  payload: Record<string, unknown>,
  eventId: string | null,
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createSupabaseServiceClient();
  const eventType = String(payload.event ?? payload.type ?? "unknown");

  if (!isRazorpayCaptureEvent(eventType)) {
    await supabase
      .from("payment_webhooks")
      .update({ processed: true, processed_at: new Date().toISOString(), error: null })
      .eq("id", webhookId);
    return { ok: true, error: null };
  }

  const captureInfo = parseRazorpayWebhookCaptureInfo(payload);
  if (!captureInfo) {
    await supabase
      .from("payment_webhooks")
      .update({
        processed: false,
        error: "Could not parse Razorpay payment payload.",
      })
      .eq("id", webhookId);
    return { ok: false, error: "Could not parse Razorpay payment payload." };
  }

  const razorpayPaymentId = await resolveRazorpayPaymentId(captureInfo);
  if (!razorpayPaymentId) {
    await supabase
      .from("payment_webhooks")
      .update({
        processed: false,
        error: "No captured Razorpay payment found for webhook event.",
      })
      .eq("id", webhookId);
    return { ok: false, error: "No captured Razorpay payment found for webhook event." };
  }

  const internalOrderId = await resolveInternalOrderIdForRazorpayWebhook(captureInfo);
  if (!internalOrderId) {
    await supabase
      .from("payment_webhooks")
      .update({
        processed: false,
        error: "Internal order not found for Razorpay webhook.",
      })
      .eq("id", webhookId);
    return { ok: false, error: "Internal order not found for Razorpay webhook." };
  }

  const capture = await captureRazorpayPayment({
    orderId: internalOrderId,
    razorpayPaymentId,
    razorpayOrderId: captureInfo.razorpayOrderId,
    source: "webhook",
    createShipment: isRazorpayShipmentEvent(eventType),
  });

  if (!capture.ok) {
    await supabase
      .from("payment_webhooks")
      .update({ processed: false, error: capture.error ?? "Capture failed." })
      .eq("id", webhookId);
    return { ok: false, error: capture.error ?? "Capture failed." };
  }

  await markRazorpayWebhookCaptureComplete({
    gatewayId,
    webhookId,
    eventId,
    orderId: internalOrderId,
    razorpayPaymentId,
  });

  return { ok: true, error: null };
}

export async function processWebhookPayload(
  gatewayId: string,
  payload: Record<string, unknown>,
  signature: string | null,
  opts?: WebhookProcessOptions,
): Promise<{ ok: boolean; error: string | null; webhookId?: string; duplicate?: boolean }> {
  const supabase = createSupabaseServiceClient();

  const { data: gateway } = await supabase
    .from("payment_gateways")
    .select("provider, webhook_secret_encrypted")
    .eq("id", gatewayId)
    .maybeSingle();

  if (!gateway) return { ok: false, error: "Gateway not found." };

  const provider = gateway.provider as GatewayProvider;
  const webhookSecret =
    provider === "razorpay"
      ? resolveRazorpayWebhookSecret(gateway.webhook_secret_encrypted)
      : decodeGatewaySecret(gateway.webhook_secret_encrypted);
  const eventId = opts?.eventId?.trim() || null;

  // Idempotency: only short-circuit when already successfully processed.
  // Unprocessed rows must be retried so Razorpay keeps driving capture after transient failures.
  if (eventId) {
    const { data: existing } = await supabase
      .from("payment_webhooks")
      .select("id, processed, payload, event_type")
      .eq("gateway_id", gatewayId)
      .eq("provider_event_id", eventId)
      .maybeSingle();

    if (existing?.processed) {
      logger.info("razorpay.webhook.duplicate", {
        gatewayId,
        eventId,
        webhookId: existing.id,
        processed: true,
      });
      return { ok: true, error: null, webhookId: existing.id, duplicate: true };
    }

    if (existing && !existing.processed) {
      logger.info("razorpay.webhook.reprocess_unprocessed", {
        gatewayId,
        eventId,
        webhookId: existing.id,
      });

      if (provider === "razorpay" && isRazorpayCaptureEvent(String(existing.event_type ?? payload.event ?? ""))) {
        const captureResult = await processRazorpayCaptureWebhook(
          gatewayId,
          existing.id,
          (existing.payload as Record<string, unknown>) ?? payload,
          eventId,
        );
        if (!captureResult.ok) {
          return { ok: false, error: captureResult.error, webhookId: existing.id };
        }
        return { ok: true, error: null, webhookId: existing.id, duplicate: true };
      }

      await supabase
        .from("payment_webhooks")
        .update({ processed: true, processed_at: new Date().toISOString(), error: null })
        .eq("id", existing.id);
      return { ok: true, error: null, webhookId: existing.id, duplicate: true };
    }

    if (provider === "razorpay") {
      const alreadyComplete = await isRazorpayCaptureCompleted(gatewayId, eventId);
      if (alreadyComplete) {
        logger.info("razorpay.webhook.duplicate", { gatewayId, eventId, via: "capture_log" });
        return { ok: true, error: null, duplicate: true };
      }
    }
  }

  const adapter = getPaymentGatewayAdapter(provider);
  const verify = await adapter.verifyWebhook({
    payload,
    signature,
    secret: webhookSecret,
    rawBody: opts?.rawBody,
  });

  if (!verify.success) {
    logger.warn("payment.webhook.rejected", {
      gatewayId,
      provider,
      reason: verify.message,
    });

    await supabase.from("payment_logs").insert({
      gateway_id: gatewayId,
      level: "error",
      message: `Webhook rejected: ${verify.message ?? "Verification failed"}`,
      metadata: { event_id: eventId } as Json,
    });

    return { ok: false, error: verify.message ?? "Webhook verification failed" };
  }

  const eventType = String(payload.event ?? payload.type ?? "unknown");

  const { data: webhook, error } = await supabase
    .from("payment_webhooks")
    .insert({
      gateway_id: gatewayId,
      event_type: eventType,
      payload: payload as Json,
      signature,
      processed: false,
      error: null,
      provider_event_id: eventId,
    })
    .select("id")
    .single();

  // Concurrent delivery lost the race on unique (gateway_id, provider_event_id).
  if (error) {
    const isUniqueViolation =
      error.code === "23505" || /duplicate key|unique constraint/i.test(error.message);
    if (isUniqueViolation && eventId) {
      const { data: raced } = await supabase
        .from("payment_webhooks")
        .select("id, processed, payload, event_type")
        .eq("gateway_id", gatewayId)
        .eq("provider_event_id", eventId)
        .maybeSingle();

      if (raced?.processed) {
        logger.info("razorpay.webhook.duplicate", {
          gatewayId,
          eventId,
          webhookId: raced.id,
          via: "unique_constraint",
        });
        return { ok: true, error: null, webhookId: raced.id, duplicate: true };
      }

      if (raced && !raced.processed && provider === "razorpay") {
        logger.info("razorpay.webhook.reprocess_after_race", {
          gatewayId,
          eventId,
          webhookId: raced.id,
        });
        if (isRazorpayCaptureEvent(String(raced.event_type ?? eventType))) {
          const captureResult = await processRazorpayCaptureWebhook(
            gatewayId,
            raced.id,
            (raced.payload as Record<string, unknown>) ?? payload,
            eventId,
          );
          if (!captureResult.ok) {
            return { ok: false, error: captureResult.error, webhookId: raced.id };
          }
        } else {
          await supabase
            .from("payment_webhooks")
            .update({ processed: true, processed_at: new Date().toISOString(), error: null })
            .eq("id", raced.id);
        }
        return { ok: true, error: null, webhookId: raced.id, duplicate: true };
      }

      return { ok: true, error: null, webhookId: raced?.id, duplicate: true };
    }
    return { ok: false, error: error.message };
  }

  await logRazorpayWebhookReceived({
    gatewayId,
    webhookId: webhook.id,
    eventId,
    eventType,
  });

  logger.info("payment.webhook.received", {
    gatewayId,
    provider,
    webhookId: webhook.id,
    eventType,
    eventId,
  });

  if (provider === "razorpay") {
    if (isRazorpayCaptureEvent(eventType)) {
      const captureResult = await processRazorpayCaptureWebhook(
        gatewayId,
        webhook.id,
        payload,
        eventId,
      );
      if (!captureResult.ok) {
        return { ok: false, error: captureResult.error, webhookId: webhook.id };
      }
    } else {
      await supabase
        .from("payment_webhooks")
        .update({ processed: true, processed_at: new Date().toISOString(), error: null })
        .eq("id", webhook.id);
    }
  }

  return { ok: true, error: null, webhookId: webhook.id };
}

export async function replayWebhook(webhookId: string): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createSupabaseServiceClient();

  const { data: webhook } = await supabase.from("payment_webhooks").select("*").eq("id", webhookId).maybeSingle();
  if (!webhook) return { ok: false, error: "Webhook not found." };

  if (webhook.processed) {
    return { ok: true, error: null };
  }

  const payload = webhook.payload as Record<string, unknown>;
  const gatewayId = webhook.gateway_id;
  if (!gatewayId) return { ok: false, error: "No gateway linked." };

  const { data: gateway } = await supabase
    .from("payment_gateways")
    .select("provider, webhook_secret_encrypted")
    .eq("id", gatewayId)
    .maybeSingle();
  if (!gateway) return { ok: false, error: "Gateway not found." };

  const adapter = getPaymentGatewayAdapter(gateway.provider as GatewayProvider);
  const verify = await adapter.verifyWebhook({
    payload,
    signature: webhook.signature,
    secret:
      gateway.provider === "razorpay"
        ? resolveRazorpayWebhookSecret(gateway.webhook_secret_encrypted)
        : decodeGatewaySecret(gateway.webhook_secret_encrypted),
    rawBody: JSON.stringify(payload),
  });

  if (!verify.success) {
    await supabase
      .from("payment_webhooks")
      .update({ error: verify.message ?? "Replay failed", processed: false })
      .eq("id", webhookId);
    return { ok: false, error: verify.message ?? "Verification failed" };
  }

  if (gateway.provider === "razorpay") {
    const captureResult = await processRazorpayCaptureWebhook(
      gatewayId,
      webhookId,
      payload,
      webhook.provider_event_id,
    );
    if (!captureResult.ok) {
      return captureResult;
    }
  } else {
    await supabase
      .from("payment_webhooks")
      .update({ processed: true, processed_at: new Date().toISOString(), error: null })
      .eq("id", webhookId);
  }

  await supabase.rpc("log_audit", {
    p_table: "payment_webhooks",
    p_record: webhookId,
    p_action: "replay",
  });

  return { ok: true, error: null };
}
