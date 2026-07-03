import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { logger } from "@/lib/observability/logger";
import { getPaymentGatewayAdapter } from "./gateway-adapters";
import { decodeGatewaySecret } from "./gateway-adapters/razorpay";
import type { GatewayProvider } from "./payment-types";
import { runReconciliationForPayment } from "./payments";

export interface WebhookProcessOptions {
  rawBody?: string;
  eventId?: string | null;
}

async function isDuplicateRazorpayEvent(gatewayId: string, eventId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("payment_logs")
    .select("id", { count: "exact", head: true })
    .eq("gateway_id", gatewayId)
    .eq("message", "Webhook event processed")
    .contains("metadata", { razorpay_event_id: eventId });

  if (error) return false;
  return (count ?? 0) > 0;
}

export async function processWebhookPayload(
  gatewayId: string,
  payload: Record<string, unknown>,
  signature: string | null,
  opts?: WebhookProcessOptions,
): Promise<{ ok: boolean; error: string | null; webhookId?: string; duplicate?: boolean }> {
  const supabase = await createSupabaseServerClient();

  const { data: gateway } = await supabase
    .from("payment_gateways")
    .select("provider, webhook_secret_encrypted")
    .eq("id", gatewayId)
    .maybeSingle();

  if (!gateway) return { ok: false, error: "Gateway not found." };

  const provider = gateway.provider as GatewayProvider;
  const webhookSecret = decodeGatewaySecret(gateway.webhook_secret_encrypted);

  if (opts?.eventId && provider === "razorpay") {
    const duplicate = await isDuplicateRazorpayEvent(gatewayId, opts.eventId);
    if (duplicate) {
      logger.info("razorpay.webhook.duplicate", { gatewayId, eventId: opts.eventId });
      return { ok: true, error: null, duplicate: true };
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
      metadata: { event_id: opts?.eventId ?? null } as Json,
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
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  await supabase.from("payment_logs").insert({
    gateway_id: gatewayId,
    level: "info",
    message: "Webhook event processed",
    metadata: {
      webhook_id: webhook.id,
      razorpay_event_id: opts?.eventId ?? null,
      event_type: eventType,
    } as Json,
  });

  logger.info("payment.webhook.received", {
    gatewayId,
    provider,
    webhookId: webhook.id,
    eventType,
    eventId: opts?.eventId,
  });

  return { ok: true, error: null, webhookId: webhook.id };
}

export async function replayWebhook(webhookId: string): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createSupabaseServerClient();

  const { data: webhook } = await supabase.from("payment_webhooks").select("*").eq("id", webhookId).maybeSingle();
  if (!webhook) return { ok: false, error: "Webhook not found." };

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
    secret: decodeGatewaySecret(gateway.webhook_secret_encrypted),
    rawBody: JSON.stringify(payload),
  });

  if (!verify.success) {
    await supabase
      .from("payment_webhooks")
      .update({ error: verify.message ?? "Replay failed", processed: false })
      .eq("id", webhookId);
    return { ok: false, error: verify.message ?? "Verification failed" };
  }

  const paymentId = (payload.payment_id as string) ?? webhook.payment_id;
  const orderId = (payload.order_id as string) ?? (payload.notes as Record<string, string> | undefined)?.order_id;

  if (paymentId) {
    await runReconciliationForPayment(paymentId);
  }

  if (orderId) {
    const { fulfillOrderWithDelhivery } = await import("@/lib/checkout/fulfillment");
    await fulfillOrderWithDelhivery(orderId).catch(() => undefined);
  } else if (paymentId) {
    const { data: payment } = await supabase
      .from("payments")
      .select("order_id, status")
      .eq("id", paymentId)
      .maybeSingle();
    if (payment?.order_id && ["paid", "captured"].includes(payment.status)) {
      const { fulfillOrderWithDelhivery } = await import("@/lib/checkout/fulfillment");
      await fulfillOrderWithDelhivery(payment.order_id).catch(() => undefined);
    }
  }

  await supabase
    .from("payment_webhooks")
    .update({ processed: true, processed_at: new Date().toISOString(), error: null })
    .eq("id", webhookId);

  await supabase.rpc("log_audit", {
    p_table: "payment_webhooks",
    p_record: webhookId,
    p_action: "replay",
  });

  return { ok: true, error: null };
}
