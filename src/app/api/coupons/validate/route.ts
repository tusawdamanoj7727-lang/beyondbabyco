import { parseJsonBody } from "@/lib/api/request";
import { couponApplyBodySchema } from "@/lib/api/schemas";
import { jsonError, jsonOk } from "@/lib/api/route-helpers";
import { validateApplyCoupon } from "@/lib/storefront/apply-coupon-validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const parsed = await parseJsonBody(req, { schema: couponApplyBodySchema });
    if (!parsed.ok) {
      return jsonError("Request failed", 400);
    }

    const { code, cartTotal } = parsed.data;
    if (!code.trim() || cartTotal <= 0) {
      return jsonError("Request failed", 400);
    }

    const result = await validateApplyCoupon(code, cartTotal);
    return jsonOk({ valid: result.valid });
  } catch {
    return jsonError("Request failed", 500);
  }
}
