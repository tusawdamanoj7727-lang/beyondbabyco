import { NextResponse } from "next/server";
import { z } from "zod";

import { validateApplyCoupon } from "@/lib/storefront/apply-coupon-validation";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  code: z.string().min(1).max(64),
  cartTotal: z.number().nonnegative(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ valid: false, error: "Invalid code or cart total." }, { status: 422 });
  }

  const result = await validateApplyCoupon(parsed.data.code, parsed.data.cartTotal);

  if (!result.valid) {
    return NextResponse.json(result, { status: 200 });
  }

  return NextResponse.json({
    valid: true,
    discountType: result.discountType,
    discountValue: result.discountValue,
    savings: result.savings,
    message: result.message,
    couponId: result.couponId,
    code: result.code,
  });
}
