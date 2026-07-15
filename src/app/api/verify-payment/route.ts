import { parseJsonBody } from "@/lib/api/request";
import { verifyPaymentBodySchema } from "@/lib/api/schemas";
import { handleApiError, jsonError, jsonOk } from "@/lib/api/route-helpers";
import { captureRazorpayPayment } from "@/lib/checkout/razorpay-capture";
import { resolveCheckoutCustomerIdForOrder, writeGuestCheckoutSession } from "@/lib/checkout/guest-customer";

export const dynamic = "force-dynamic";

/**
 * Client fast-path after Razorpay checkout success.
 * Supports authenticated customers and signed guest checkout cookies.
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

    const { customerId, via } = await resolveCheckoutCustomerIdForOrder(orderId);
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

    if (via === "guest") {
      await writeGuestCheckoutSession(customerId, orderId);
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
