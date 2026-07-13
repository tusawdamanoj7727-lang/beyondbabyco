import { parseJsonBody } from "@/lib/api/request";
import { verifyPaymentBodySchema } from "@/lib/api/schemas";
import { handleApiError, jsonError, jsonOk } from "@/lib/api/route-helpers";
import { getCurrentUser } from "@/lib/auth/session";
import { captureRazorpayPayment } from "@/lib/checkout/razorpay-capture";
import { getCustomerIdForUser } from "@/lib/orders/customer-auth";

export const dynamic = "force-dynamic";

/**
 * Client fast-path after Razorpay checkout success.
 * Webhook (payment.captured) is the authoritative capture path; this route uses
 * the same idempotent captureRazorpayPayment with API verification for UX.
 */
export async function POST(req: Request) {
  try {
    const parsed = await parseJsonBody(req, { schema: verifyPaymentBodySchema });
    if (!parsed.ok) {
      return jsonError("Missing payment verification fields.", 400);
    }

    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = parsed.data;

    const user = await getCurrentUser();
    const customerId = user ? await getCustomerIdForUser(user.id) : null;
    if (!customerId) {
      return jsonError("Not signed in.", 401);
    }

    const result = await captureRazorpayPayment({
      orderId,
      customerId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      source: "client",
    });

    if (!result.ok) {
      return jsonError(result.error ?? "Payment verification failed.", 400);
    }

    return jsonOk({
      verified: true,
      alreadyCaptured: result.alreadyCaptured ?? false,
      awb: result.awb ?? null,
    });
  } catch (error) {
    return handleApiError(error, "verify-payment");
  }
}
