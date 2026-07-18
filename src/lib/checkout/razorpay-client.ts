import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";

import {
  getEnabledRazorpayGateway,
  logRazorpayCheckout,
  PAYMENT_GATEWAY_NOT_CONFIGURED_MESSAGE,
} from "./gateways";

export const MIN_RAZORPAY_AMOUNT_PAISE = 100;

async function getRazorpayClient() {
  logRazorpayCheckout("getRazorpayClient.entered");
  const gateway = await getEnabledRazorpayGateway();
  const keyIdExists = Boolean(gateway?.keyId);
  const keySecretExists = Boolean(gateway?.keySecret);

  logRazorpayCheckout("getRazorpayClient.gateway", {
    gatewaySelected: gateway?.provider ?? null,
    gatewayUuid: gateway?.id ?? null,
    gatewayEnabled: Boolean(gateway),
    paymentMode: gateway?.sandbox ? "sandbox" : gateway ? "live" : null,
    keyIdExists,
    keySecretExists,
  });

  if (!gateway?.keyId || !gateway.keySecret) {
    logRazorpayCheckout("getRazorpayClient.early_return", {
      why: "missing_key_id_or_key_secret",
      keyIdExists,
      keySecretExists,
    });
    return { gateway: null, client: null };
  }

  const client = new Razorpay({
    key_id: gateway.keyId,
    key_secret: gateway.keySecret,
  });

  logRazorpayCheckout("getRazorpayClient.sdk_instantiated", {
    gatewayUuid: gateway.id,
    keyIdExists: true,
    keySecretExists: true,
  });

  return { gateway, client };
}

export async function createRazorpayOrder(input: {
  amountInr: number;
  orderId: string;
  orderNumber: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
}): Promise<{ ok: boolean; error: string | null; razorpayOrderId?: string }> {
  logRazorpayCheckout("createRazorpayOrder.entered", {
    orderId: input.orderId,
    amount: input.amountInr,
    currency: "INR",
  });

  const { client, gateway } = await getRazorpayClient();
  if (!client || !gateway) {
    logRazorpayCheckout("createRazorpayOrder.early_return", {
      why: "razorpay_client_null",
      orderId: input.orderId,
      amount: input.amountInr,
      currency: "INR",
      keyIdExists: false,
      keySecretExists: false,
    });
    return { ok: false, error: PAYMENT_GATEWAY_NOT_CONFIGURED_MESSAGE };
  }

  const amountPaise = Math.round(input.amountInr * 100);
  if (!Number.isFinite(amountPaise) || amountPaise < MIN_RAZORPAY_AMOUNT_PAISE) {
    logRazorpayCheckout("createRazorpayOrder.early_return", {
      why: "amount_below_minimum",
      orderId: input.orderId,
      amount: input.amountInr,
      amountPaise,
      currency: "INR",
      gatewayUuid: gateway.id,
      keyIdExists: true,
      keySecretExists: true,
    });
    return { ok: false, error: "Minimum payment amount is ₹1.00." };
  }

  logRazorpayCheckout("createRazorpayOrder.before_orders_create", {
    orderId: input.orderId,
    amount: input.amountInr,
    amountPaise,
    currency: "INR",
    gatewayUuid: gateway.id,
    gatewayEnabled: true,
    paymentMode: gateway.sandbox ? "sandbox" : "live",
    keyIdExists: true,
    keySecretExists: true,
  });

  try {
    const order = await client.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: input.orderNumber,
      notes: {
        order_id: input.orderId,
        customer_email: input.customerEmail ?? "",
        customer_phone: input.customerPhone ?? "",
      },
    });

    if (!order.id) {
      const error = new Error("Could not create Razorpay order.");
      console.error(
        JSON.stringify({
          scope: "checkout.razorpay",
          step: "createRazorpayOrder.missing_order_id",
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
          orderId: input.orderId,
          gatewayUuid: gateway.id,
        }),
      );
      return { ok: false, error: error.message };
    }

    logRazorpayCheckout("createRazorpayOrder.success", {
      orderId: input.orderId,
      razorpayOrderId: order.id,
      amount: input.amountInr,
      currency: "INR",
      gatewayUuid: gateway.id,
      keyIdExists: true,
      keySecretExists: true,
    });

    return { ok: true, error: null, razorpayOrderId: order.id };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(
      JSON.stringify({
        scope: "checkout.razorpay",
        step: "createRazorpayOrder.exception",
        errorName: err.name,
        errorMessage: err.message,
        errorStack: err.stack,
        orderId: input.orderId,
        amount: input.amountInr,
        currency: "INR",
        gatewayUuid: gateway.id,
        keyIdExists: true,
        keySecretExists: true,
      }),
    );
    return { ok: false, error: err.message || "Could not create Razorpay order." };
  }
}

export async function verifyRazorpaySignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<boolean> {
  const gateway = await getEnabledRazorpayGateway();
  if (!gateway?.keySecret) return false;

  const body = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
  const expected = createHmac("sha256", gateway.keySecret).update(body).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(input.razorpaySignature));
  } catch {
    return false;
  }
}

/** Create a Razorpay refund against a captured payment (amount in INR). */
export async function createRazorpayRefund(input: {
  razorpayPaymentId: string;
  amountInr: number;
  reason?: string | null;
  notes?: Record<string, string>;
}): Promise<{
  ok: boolean;
  error: string | null;
  refundId?: string;
  amountInr?: number;
  status?: string;
  raw?: Record<string, unknown>;
}> {
  const { client, gateway } = await getRazorpayClient();
  if (!client || !gateway) {
    return { ok: false, error: PAYMENT_GATEWAY_NOT_CONFIGURED_MESSAGE };
  }

  const paymentId = input.razorpayPaymentId?.trim();
  if (!paymentId?.startsWith("pay_")) {
    return { ok: false, error: "Missing Razorpay payment id for refund." };
  }

  const amountPaise = Math.round(input.amountInr * 100);
  if (!Number.isFinite(amountPaise) || amountPaise < MIN_RAZORPAY_AMOUNT_PAISE) {
    return { ok: false, error: "Minimum refund amount is ₹1.00." };
  }

  try {
    const refund = await client.payments.refund(paymentId, {
      amount: amountPaise,
      speed: "normal",
      notes: {
        reason: (input.reason ?? "Admin refund").slice(0, 250),
        ...(input.notes ?? {}),
      },
    });

    const refundId = String(refund.id ?? "");
    if (!refundId) {
      return { ok: false, error: "Razorpay refund returned no id." };
    }

    return {
      ok: true,
      error: null,
      refundId,
      amountInr: Number(refund.amount ?? amountPaise) / 100,
      status: String(refund.status ?? "processed"),
      raw: refund as unknown as Record<string, unknown>,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error && "error" in error
          ? String((error as { error?: { description?: string } }).error?.description ?? "Refund failed")
          : "Refund failed";
    loggerError("createRazorpayRefund.failed", { paymentId, amountPaise, message });
    return { ok: false, error: message };
  }
}

function loggerError(step: string, meta: Record<string, unknown>) {
  console.error(JSON.stringify({ scope: "razorpay.refund", step, ...meta }));
}

export async function fetchRazorpayRefund(refundId: string): Promise<{
  ok: boolean;
  error: string | null;
  status?: string;
  amountInr?: number;
}> {
  const { client } = await getRazorpayClient();
  if (!client) return { ok: false, error: PAYMENT_GATEWAY_NOT_CONFIGURED_MESSAGE };

  try {
    const refund = await client.refunds.fetch(refundId);
    return {
      ok: true,
      error: null,
      status: String(refund.status ?? ""),
      amountInr: Number(refund.amount ?? 0) / 100,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not fetch refund.",
    };
  }
}
