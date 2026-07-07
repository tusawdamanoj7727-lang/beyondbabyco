import { NextResponse } from "next/server";
import { z } from "zod";

import { createRazorpayOrder, MIN_RAZORPAY_AMOUNT_PAISE } from "@/lib/checkout/razorpay-client";
import { getEnabledRazorpayGateway } from "@/lib/checkout/gateways";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  amount: z.number().int().min(MIN_RAZORPAY_AMOUNT_PAISE),
  currency: z.string().trim().default("INR"),
  receipt: z.string().trim().min(1).max(64),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: `Amount must be at least ${MIN_RAZORPAY_AMOUNT_PAISE} paise.` },
        { status: 400 },
      );
    }

    const { amount, currency, receipt } = parsed.data;
    if (currency !== "INR") {
      return NextResponse.json({ ok: false, error: "Only INR is supported." }, { status: 400 });
    }

    const gateway = await getEnabledRazorpayGateway();
    if (!gateway?.keyId || !gateway.keySecret) {
      return NextResponse.json({ ok: false, error: "Razorpay is not configured." }, { status: 401 });
    }

    const result = await createRazorpayOrder({
      amountInr: amount / 100,
      orderId: receipt,
      orderNumber: receipt,
    });

    if (!result.ok || !result.razorpayOrderId) {
      const message = result.error ?? "Could not create Razorpay order.";
      const status = /auth|key|credential|unauthorized/i.test(message) ? 401 : 500;
      return NextResponse.json({ ok: false, error: message }, { status });
    }

    return NextResponse.json({
      ok: true,
      order_id: result.razorpayOrderId,
      amount,
      currency,
      key_id: gateway.keyId,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error while creating order." }, { status: 500 });
  }
}
