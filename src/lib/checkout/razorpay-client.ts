import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { getEnabledRazorpayGateway } from "./gateways";

export async function createRazorpayOrder(input: {
  amountInr: number;
  orderId: string;
  orderNumber: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
}): Promise<{ ok: boolean; error: string | null; razorpayOrderId?: string }> {
  const gateway = await getEnabledRazorpayGateway();
  if (!gateway?.keyId || !gateway.keySecret) {
    return { ok: false, error: "Online payments are not configured." };
  }

  const amountPaise = Math.round(input.amountInr * 100);
  const auth = Buffer.from(`${gateway.keyId}:${gateway.keySecret}`).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: input.orderNumber,
      notes: {
        order_id: input.orderId,
      },
    }),
    cache: "no-store",
  });

  const data = (await res.json()) as { id?: string; error?: { description?: string } };
  if (!res.ok || !data.id) {
    return { ok: false, error: data.error?.description ?? "Could not create Razorpay order." };
  }

  return { ok: true, error: null, razorpayOrderId: data.id };
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
