import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { logger } from "@/lib/observability/logger";

import type { GatewayAdapterResult, PaymentGatewayAdapter, WebhookVerifyParams } from "./index";

export function decodeGatewaySecret(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return value.startsWith("enc:") ? value.slice(4) : value;
}

export function resolveRazorpayWebhookSecret(dbSecret: string | null | undefined): string | null {
  return decodeGatewaySecret(dbSecret) ?? process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? null;
}

/** HMAC SHA256 verification per Razorpay webhook docs (raw body + webhook secret). */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string | null,
): boolean {
  if (!signature?.trim() || !secret?.trim() || !rawBody) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    const expectedBuf = Buffer.from(expected, "utf8");
    const receivedBuf = Buffer.from(signature.trim(), "utf8");
    if (expectedBuf.length !== receivedBuf.length) return false;
    return timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

function extractEventType(payload: Record<string, unknown>): string {
  return String(payload.event ?? payload.type ?? "unknown");
}

export const razorpayGatewayAdapter: PaymentGatewayAdapter = {
  provider: "razorpay",

  async createOrder() {
    return { success: false, message: "Use checkout Razorpay client for order creation." };
  },

  async capturePayment() {
    return { success: false, message: "Razorpay auto-captures on payment." };
  },

  async refundPayment() {
    return { success: false, message: "Use admin payment actions for refunds." };
  },

  async verifyWebhook(params: WebhookVerifyParams): Promise<GatewayAdapterResult<{ valid: boolean; eventType?: string }>> {
    const secret = resolveRazorpayWebhookSecret(params.secret);
    if (!secret) {
      return { success: false, message: "Razorpay webhook secret not configured" };
    }

    const rawBody =
      typeof params.payload === "string"
        ? params.payload
        : params.rawBody ?? JSON.stringify(params.payload);

    const valid = verifyRazorpayWebhookSignature(rawBody, params.signature, secret);

    if (!valid) {
      logger.warn("razorpay.webhook.invalid_signature", {
        event: typeof params.payload === "object" ? extractEventType(params.payload) : "unknown",
      });
      return { success: false, message: "Invalid Razorpay webhook signature" };
    }

    const eventType =
      typeof params.payload === "object" && params.payload !== null
        ? extractEventType(params.payload as Record<string, unknown>)
        : undefined;

    return { success: true, data: { valid: true, eventType } };
  },

  async verifySignature(params: WebhookVerifyParams) {
    return this.verifyWebhook(params);
  },

  async fetchPayment(params) {
    const { fetchRazorpayPayment } = await import("@/lib/checkout/razorpay-verify");
    const result = await fetchRazorpayPayment(params.gatewayTxnId);
    if (!result.ok || !result.payment) {
      return { success: false, message: result.error ?? "Could not fetch payment." };
    }
    return {
      success: true,
      data: { status: result.payment.status, amount: result.payment.amount / 100 },
    };
  },

  async fetchRefund() {
    return { success: false, message: "Use admin payments module." };
  },

  async syncSettlement() {
    return { success: false, message: "Use admin finance module." };
  },

  async healthCheck() {
    const hasKeys = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    return {
      success: hasKeys,
      data: { ok: hasKeys },
      message: hasKeys ? undefined : "Razorpay credentials not configured",
    };
  },
};
