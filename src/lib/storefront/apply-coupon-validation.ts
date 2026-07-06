import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ApplyCouponSuccess = {
  valid: true;
  discountType: "percent" | "flat";
  discountValue: number;
  savings: number;
  message: string;
  couponId: string;
  code: string;
};

export type ApplyCouponFailure = {
  valid: false;
  error: string;
};

export type ApplyCouponResult = ApplyCouponSuccess | ApplyCouponFailure;

type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  min_order: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  lifecycle_status: string | null;
  deleted_at: string | null;
  max_discount: number | null;
  description: string | null;
};

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function mapDiscountType(dbType: string): "percent" | "flat" {
  return dbType === "percent" ? "percent" : "flat";
}

function calculateSavings(
  coupon: Pick<CouponRow, "type" | "value" | "max_discount">,
  cartTotal: number,
): number {
  if (cartTotal <= 0) return 0;

  let savings =
    coupon.type === "percent"
      ? Math.round((cartTotal * Number(coupon.value)) / 100)
      : Math.min(Number(coupon.value), cartTotal);

  if (coupon.max_discount != null && coupon.max_discount > 0) {
    savings = Math.min(savings, Number(coupon.max_discount));
  }

  return Math.max(0, savings);
}

function isExpired(coupon: CouponRow, now = new Date()): boolean {
  if (coupon.expires_at) {
    return now > new Date(coupon.expires_at);
  }
  return false;
}

function isNotYetValid(coupon: CouponRow, now = new Date()): boolean {
  if (coupon.starts_at) {
    return now < new Date(coupon.starts_at);
  }
  return false;
}

function isUsageLimitReached(coupon: CouponRow): boolean {
  if (coupon.max_uses == null) return false;
  return coupon.used_count >= coupon.max_uses;
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
      "id, code, type, value, min_order, max_uses, used_count, starts_at, expires_at, is_active, lifecycle_status, deleted_at, max_discount, description",
    )
    .eq("code", code)
    .maybeSingle();

  if (error) {
    return { valid: false, error: "Could not validate coupon. Please try again." };
  }

  if (!coupon || coupon.deleted_at) {
    return { valid: false, error: "Invalid coupon code" };
  }

  if (!coupon.is_active || (coupon.lifecycle_status && coupon.lifecycle_status !== "active")) {
    return { valid: false, error: "Invalid coupon code" };
  }

  if (isNotYetValid(coupon)) {
    return { valid: false, error: "This coupon is not active yet" };
  }

  if (isExpired(coupon)) {
    return { valid: false, error: "This coupon has expired" };
  }

  if (isUsageLimitReached(coupon)) {
    return { valid: false, error: "Coupon usage limit reached" };
  }

  const minOrder = Number(coupon.min_order ?? 0);
  if (cartTotal < minOrder) {
    return {
      valid: false,
      error: `Minimum order ₹${Math.round(minOrder).toLocaleString("en-IN")} required`,
    };
  }

  const savings = calculateSavings(coupon, cartTotal);
  if (savings <= 0) {
    return { valid: false, error: "Invalid code" };
  }

  const discountType = mapDiscountType(coupon.type);

  const description = coupon.description?.trim();
  const defaultMessage = `${coupon.code} applied — You save ₹${savings.toLocaleString("en-IN")}!`;

  return {
    valid: true,
    discountType,
    discountValue: Number(coupon.value),
    savings,
    message: description || defaultMessage,
    couponId: coupon.id,
    code: coupon.code,
  };
}
