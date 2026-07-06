import type { ApplyCouponResult } from "@/lib/storefront/apply-coupon-validation";

export type ApplyCouponApiResponse =
  | {
      valid: true;
      discountType: "percent" | "flat";
      discountValue: number;
      savings: number;
      message: string;
      couponId: string;
      code: string;
    }
  | {
      valid: false;
      error: string;
    };

export async function applyCouponViaApi(
  code: string,
  cartTotal: number,
): Promise<ApplyCouponApiResponse> {
  const response = await fetch("/api/coupons/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, cartTotal }),
  });

  if (!response.ok) {
    return { valid: false, error: "Could not validate coupon. Please try again." };
  }

  return (await response.json()) as ApplyCouponApiResponse;
}

export type { ApplyCouponResult };
