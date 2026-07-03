import "server-only";

import { getCouponDetail, listCoupons } from "@/lib/admin/coupons";
import { validateCoupon as validateCouponEngine, calculateDiscount, applyCoupon, removeCoupon } from "@/lib/admin/coupon-engine";
import type {
  CouponDetail,
  CouponValidationContext,
  CouponValidationResult,
  CouponType,
} from "@/lib/admin/coupon-types";

export type { CouponDetail, CouponValidationContext, CouponValidationResult };
export type { CouponListItem as PublicCouponSummary } from "@/lib/admin/coupon-types";
export { calculateDiscount, applyCoupon, removeCoupon };

export async function getCoupons(opts?: {
  promoType?: CouponType;
  limit?: number;
}) {
  const result = await listCoupons({
    promoType: opts?.promoType,
    perPage: opts?.limit ?? 50,
    page: 1,
  });
  return result.rows;
}

export async function getCoupon(id: string): Promise<CouponDetail | null> {
  return getCouponDetail(id);
}

export async function validateCoupon(
  code: string,
  ctx: CouponValidationContext,
): Promise<CouponValidationResult> {
  return validateCouponEngine(code, ctx);
}
