import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";

import { getEnabledRazorpayGateway } from "./gateways";

export const MIN_RAZORPAY_AMOUNT_PAISE = 100;

async function getRazorpayClient() {
  const gateway = await getEnabledRazorpayGateway();
  if (!gateway?.keyId || !gateway.keySecret) {
    return { gateway: null, client: null };
  }

  return {
    gateway,
    client: new Razorpay({
      key_id: gateway.keyId,
      key_secret: gateway.keySecret,
    }),
  };
}

export async function createRazorpayOrder(input: {
  amountInr: number;
  orderId: string;
  orderNumber: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
}): Promise<{ ok: boolean; error: string | null; razorpayOrderId?: string }> {
  const { client } = await getRazorpayClient();
  if (!client) {
    return { ok: false, error: "Online payments are not configured." };
  }

  const amountPaise = Math.round(input.amountInr * 100);
  if (!Number.isFinite(amountPaise) || amountPaise < MIN_RAZORPAY_AMOUNT_PAISE) {
    return { ok: false, error: "Minimum payment amount is ₹1.00." };
  }

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
      return { ok: false, error: "Could not create Razorpay order." };
    }

    return { ok: true, error: null, razorpayOrderId: order.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create Razorpay order.";
    return { ok: false, error: message };
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
