import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { logger } from "@/lib/observability/logger";

import type { GatewayAdapterResult, PaymentGatewayAdapter, WebhookVerifyParams } from "./index";

export function decodeGatewaySecret(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return value.startsWith("enc:") ? value.slice(4) : value;
}

/** True when a stored “secret” is actually a webhook URL (ops misconfiguration). */
export function isInvalidRazorpayWebhookSecret(value: string | null | undefined): boolean {
  const secret = decodeGatewaySecret(value);
  if (!secret) return true;
  if (/^https?:\/\//i.test(secret)) return true;
  if (secret.includes("/api/webhooks/payments")) return true;
  // Razorpay webhook secrets are opaque tokens, not dashboard URLs.
  if (secret.includes("razorpay.com")) return true;
  return false;
}

export function resolveRazorpayWebhookSecret(dbSecret: string | null | undefined): string | null {
  const fromDb = decodeGatewaySecret(dbSecret);
  if (fromDb && !isInvalidRazorpayWebhookSecret(fromDb)) {
    return fromDb;
  }
  return process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || null;
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

  async refundPayment(params) {
    const { createRazorpayRefund } = await import("@/lib/checkout/razorpay-client");
    const paymentId = params.paymentRef?.trim() || params.gatewayTxnId;
    const result = await createRazorpayRefund({
      razorpayPaymentId: paymentId,
      amountInr: params.amount,
      reason: params.reason,
      notes: params.notes,
    });
    if (!result.ok || !result.refundId) {
      return { success: false, message: result.error ?? "Refund failed." };
    }
    return {
      success: true,
      data: { refundId: result.refundId },
      message: result.status,
    };
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

  async fetchRefund(refundId: string) {
    const { fetchRazorpayRefund } = await import("@/lib/checkout/razorpay-client");
    const result = await fetchRazorpayRefund(refundId);
    if (!result.ok) {
      return { success: false, message: result.error ?? "Could not fetch refund." };
    }
    return {
      success: true,
      data: { status: result.status ?? "unknown", amount: result.amountInr ?? 0 },
    };
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
