import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { getCustomerIdForUser } from "@/lib/orders/customer-auth";
import { completeRazorpayOrder } from "@/lib/checkout/place-order";
import { verifyRazorpaySignature } from "@/lib/checkout/razorpay-client";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  orderId: z.string().trim().optional(),
  razorpay_order_id: z.string().trim().min(1),
  razorpay_payment_id: z.string().trim().min(1),
  razorpay_signature: z.string().trim().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Missing payment verification fields." }, { status: 400 });
    }

    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = parsed.data;

    const valid = await verifyRazorpaySignature({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (!valid) {
      return NextResponse.json({ ok: false, error: "Payment signature mismatch." }, { status: 400 });
    }

    if (orderId) {
      const user = await getCurrentUser();
      const customerId = user ? await getCustomerIdForUser(user.id) : null;
      if (!customerId) {
        return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
      }

      const result = await completeRazorpayOrder({
        orderId,
        customerId,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      });

      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error ?? "Payment verification failed." }, { status: 400 });
      }

      return NextResponse.json({ ok: true, verified: true, awb: result.awb ?? null });
    }

    return NextResponse.json({ ok: true, verified: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error while verifying payment." }, { status: 500 });
  }
}
