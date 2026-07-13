import "server-only";

import Razorpay from "razorpay";

import { getEnabledRazorpayGateway } from "./gateways";

export interface RazorpayPaymentDetails {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  notes?: Record<string, string>;
}

const CAPTURED_STATUSES = new Set(["captured"]);
const AUTHORIZED_STATUSES = new Set(["authorized"]);

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

function normalizePayment(raw: Record<string, unknown>): RazorpayPaymentDetails {
  const notesRaw = raw.notes;
  const notes =
    notesRaw && typeof notesRaw === "object" && !Array.isArray(notesRaw)
      ? (notesRaw as Record<string, string>)
      : undefined;

  return {
    id: String(raw.id ?? ""),
    order_id: String(raw.order_id ?? ""),
    amount: Number(raw.amount ?? 0),
    currency: String(raw.currency ?? "").toUpperCase(),
    status: String(raw.status ?? "").toLowerCase(),
    notes,
  };
}

export async function fetchRazorpayPayment(paymentId: string): Promise<{
  ok: boolean;
  error: string | null;
  payment?: RazorpayPaymentDetails;
}> {
  const { client } = await getRazorpayClient();
  if (!client) {
    return { ok: false, error: "Payment gateway not configured." };
  }

  try {
    const raw = (await client.payments.fetch(paymentId)) as unknown as Record<string, unknown>;
    const payment = normalizePayment(raw);
    if (!payment.id || !payment.order_id) {
      return { ok: false, error: "Invalid Razorpay payment response." };
    }
    return { ok: true, error: null, payment };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not fetch Razorpay payment.";
    return { ok: false, error: message };
  }
}

export async function fetchRazorpayOrderPayments(razorpayOrderId: string): Promise<{
  ok: boolean;
  error: string | null;
  payments?: RazorpayPaymentDetails[];
}> {
  const { client } = await getRazorpayClient();
  if (!client) {
    return { ok: false, error: "Payment gateway not configured." };
  }

  try {
    const raw = (await client.orders.fetch(razorpayOrderId)) as unknown as Record<string, unknown>;
    const items = raw.payments;
    if (!Array.isArray(items)) {
      return { ok: true, error: null, payments: [] };
    }

    const payments = items
      .map((item) => (item && typeof item === "object" ? normalizePayment(item as Record<string, unknown>) : null))
      .filter((p): p is RazorpayPaymentDetails => Boolean(p?.id));

    return { ok: true, error: null, payments };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not fetch Razorpay order.";
    return { ok: false, error: message };
  }
}

function isPaidStatus(status: string): boolean {
  return CAPTURED_STATUSES.has(status) || AUTHORIZED_STATUSES.has(status);
}

/** Server-side verification against Razorpay API — never trust client-reported amounts. */
export async function verifyRazorpayPaymentAgainstOrder(input: {
  razorpayPaymentId: string;
  expectedRazorpayOrderId: string;
  expectedAmountInr: number;
  expectedCurrency: string;
}): Promise<{ ok: boolean; error: string | null; payment?: RazorpayPaymentDetails }> {
  const fetched = await fetchRazorpayPayment(input.razorpayPaymentId);
  if (!fetched.ok || !fetched.payment) {
    return { ok: false, error: fetched.error ?? "Could not verify payment with Razorpay." };
  }

  const payment = fetched.payment;

  if (payment.id !== input.razorpayPaymentId) {
    return { ok: false, error: "Payment ID mismatch." };
  }

  if (payment.order_id !== input.expectedRazorpayOrderId) {
    return { ok: false, error: "Razorpay order ID mismatch." };
  }

  if (!isPaidStatus(payment.status)) {
    return { ok: false, error: `Payment not captured (status: ${payment.status}).` };
  }

  const expectedPaise = Math.round(input.expectedAmountInr * 100);
  if (!Number.isFinite(expectedPaise) || Math.abs(payment.amount - expectedPaise) > 1) {
    return { ok: false, error: "Payment amount mismatch." };
  }

  const expectedCurrency = input.expectedCurrency.trim().toUpperCase();
  if (payment.currency !== "INR" || payment.currency !== expectedCurrency) {
    return { ok: false, error: "Payment currency mismatch." };
  }

  return { ok: true, error: null, payment };
}
