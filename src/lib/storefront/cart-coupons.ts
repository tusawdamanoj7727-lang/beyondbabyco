import type { StorefrontCouponPreviewResult } from "@/lib/storefront/coupon-preview-action";
import { previewStorefrontCouponAction } from "@/lib/storefront/coupon-preview-action";

export type ApplyCouponApiResponse = StorefrontCouponPreviewResult;

export async function applyCouponViaApi(
  code: string,
  cartTotal: number,
): Promise<ApplyCouponApiResponse> {
  return previewStorefrontCouponAction(code, cartTotal);
}
