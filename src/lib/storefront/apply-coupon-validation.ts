import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  evaluateCouponPreview,
  type CouponPreviewResult,
  type CouponPreviewRow,
} from "./apply-coupon-preview";

export type ApplyCouponSuccess = Extract<CouponPreviewResult, { valid: true }>;
export type ApplyCouponFailure = Extract<CouponPreviewResult, { valid: false }>;
export type ApplyCouponResult = CouponPreviewResult;

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function validateApplyCoupon(
  rawCode: string,
  cartTotal: number,
): Promise<ApplyCouponResult> {
  const code = normalizeCode(rawCode);
  if (!code) {
    return { valid: false, error: "Enter a coupon code." };
  }

  if (!Number.isFinite(cartTotal) || cartTotal <= 0) {
    return { valid: false, error: "Add items to your cart before applying a coupon." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select(
      "id, code, type, promo_type, value, min_order, max_uses, used_count, starts_at, expires_at, is_active, lifecycle_status, deleted_at, max_discount, description",
    )
    .eq("code", code)
    .maybeSingle();

  if (error) {
    return { valid: false, error: "Could not validate coupon. Please try again." };
  }

  if (!coupon) {
    return { valid: false, error: "Invalid coupon code" };
  }

  return evaluateCouponPreview(coupon as CouponPreviewRow, cartTotal);
}
