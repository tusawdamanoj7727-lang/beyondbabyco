import { NextResponse } from "next/server";
import { z } from "zod";

import { validateApplyCoupon } from "@/lib/storefront/apply-coupon-validation";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  code: z.string().min(1).max(64),
  cartTotal: z.number().nonnegative(),
});

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ valid: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { valid: false, error: "Code and cart total required" },
        { status: 400 },
      );
    }

    const { code, cartTotal } = parsed.data;

    if (!code.trim() || cartTotal <= 0) {
      return NextResponse.json(
        { valid: false, error: "Code and cart total required" },
        { status: 400 },
      );
    }

    const result = await validateApplyCoupon(code, cartTotal);

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error });
    }

    return NextResponse.json({
      valid: true,
      code: result.code,
      type: result.discountType,
      value: result.discountValue,
      discountType: result.discountType,
      discountValue: result.discountValue,
      savings: result.savings,
      message: result.message,
      couponId: result.couponId,
    });
  } catch {
    return NextResponse.json({ valid: false, error: "Server error" }, { status: 500 });
  }
}
