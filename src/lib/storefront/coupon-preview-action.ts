"use server";

import { validateApplyCoupon } from "@/lib/storefront/apply-coupon-validation";

export type StorefrontCouponPreviewResult =
  | {
      valid: true;
      code: string;
      couponId: string;
      discountType: "percent" | "flat";
      discountValue: number;
      savings: number;
      freeShipping: boolean;
      message: string;
    }
  | {
      valid: false;
      error: string;
    };

/** Server-side coupon preview for cart/checkout — not exposed via public API. */
export async function previewStorefrontCouponAction(
  code: string,
  cartTotal: number,
): Promise<StorefrontCouponPreviewResult> {
  const result = await validateApplyCoupon(code, cartTotal);
  if (!result.valid) {
    return { valid: false, error: result.error };
  }

  return {
    valid: true,
    code: result.code,
    couponId: result.couponId,
    discountType: result.discountType,
    discountValue: result.discountValue,
    savings: result.savings,
    freeShipping: result.freeShipping,
    message: result.message,
  };
}
