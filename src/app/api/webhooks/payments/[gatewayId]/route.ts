import { NextResponse } from "next/server";

import { processWebhookPayload } from "@/lib/admin/payment-engine";
import { resolveRazorpayWebhookGatewayId } from "@/lib/checkout/gateways";
import { logger } from "@/lib/observability/logger";
import { captureOperationalFailure } from "@/lib/observability/operational-errors";

/**
 * Public webhook receiver — validates provider signature before storage.
 * Razorpay: X-Razorpay-Signature HMAC SHA256 on raw body.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ gatewayId: string }> },
) {
  const { gatewayId: gatewayIdParam } = await context.params;

  const rawBody = await request.text();
  if (!rawBody.trim()) {
    return NextResponse.json({ ok: false, error: "Empty payload." }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const signature =
    request.headers.get("x-razorpay-signature") ??
    request.headers.get("x-cashfree-signature") ??
    request.headers.get("x-phonepe-signature") ??
    request.headers.get("x-payu-signature") ??
    request.headers.get("stripe-signature") ??
    request.headers.get("paypal-transmission-sig") ??
    request.headers.get("x-signature");

  const eventId = request.headers.get("x-razorpay-event-id");

  const gatewayId =
    (await resolveRazorpayWebhookGatewayId(gatewayIdParam)) ?? gatewayIdParam;

  const result = await processWebhookPayload(gatewayId, payload, signature, {
    rawBody,
    eventId,
  });

  if (!result.ok) {
    const status =
      result.error === "Gateway not found."
        ? 404
        : result.error?.includes("signature") || result.error?.includes("Verification")
          ? 401
          : 500;

    logger.warn("payment.webhook.http_rejected", { gatewayId, status, error: result.error });
    captureOperationalFailure("webhook", `Payment webhook rejected: ${result.error ?? "unknown"}`, {
      operation: "payment.webhook",
      tags: { gatewayId, httpStatus: String(status) },
      extra: { gatewayId, status, error: result.error },
    });
    const error =
      status === 404
        ? "Gateway not found."
        : status === 401
          ? "Unauthorized"
          : "Request failed";
    return NextResponse.json({ ok: false, error }, { status });
  }

  return NextResponse.json({
    ok: true,
    data: {
      received: true,
      webhookId: result.webhookId,
      duplicate: result.duplicate ?? false,
    },
  });
}
