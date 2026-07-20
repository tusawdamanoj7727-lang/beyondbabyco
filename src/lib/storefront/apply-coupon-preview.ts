/**
 * Pure storefront coupon preview rules (shared by server validation + unit tests).
 * Free-shipping promos are valid even when product discount is ₹0.
 */

export type CouponPreviewSuccess = {
  valid: true;
  discountType: "percent" | "flat";
  discountValue: number;
  savings: number;
  freeShipping: boolean;
  message: string;
  couponId: string;
  code: string;
};

export type CouponPreviewFailure = {
  valid: false;
  error: string;
};

export type CouponPreviewResult = CouponPreviewSuccess | CouponPreviewFailure;

export type CouponPreviewRow = {
  id: string;
  code: string;
  type: string;
  promo_type?: string | null;
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

function mapDiscountType(dbType: string): "percent" | "flat" {
  return dbType === "percent" ? "percent" : "flat";
}

function isFreeShippingPromo(coupon: CouponPreviewRow): boolean {
  const promo = (coupon.promo_type ?? "").toLowerCase();
  const type = (coupon.type ?? "").toLowerCase();
  return promo === "free_shipping" || type === "free_shipping";
}

function calculateProductSavings(
  coupon: Pick<CouponPreviewRow, "type" | "value" | "max_discount" | "promo_type">,
  cartTotal: number,
): number {
  if (cartTotal <= 0) return 0;
  if (isFreeShippingPromo(coupon as CouponPreviewRow)) return 0;

  let savings =
    coupon.type === "percent"
      ? Math.round((cartTotal * Number(coupon.value)) / 100)
      : Math.min(Number(coupon.value), cartTotal);

  if (coupon.max_discount != null && coupon.max_discount > 0) {
    savings = Math.min(savings, Number(coupon.max_discount));
  }

  return Math.max(0, savings);
}

function isExpired(coupon: CouponPreviewRow, now = new Date()): boolean {
  if (coupon.expires_at) return now > new Date(coupon.expires_at);
  return false;
}

function isNotYetValid(coupon: CouponPreviewRow, now = new Date()): boolean {
  if (coupon.starts_at) return now < new Date(coupon.starts_at);
  return false;
}

function isUsageLimitReached(coupon: CouponPreviewRow): boolean {
  if (coupon.max_uses == null) return false;
  return coupon.used_count >= coupon.max_uses;
}

/** Evaluate a loaded coupon row against a cart subtotal (no DB I/O). */
export function evaluateCouponPreview(
  coupon: CouponPreviewRow,
  cartTotal: number,
  now = new Date(),
): CouponPreviewResult {
  if (!Number.isFinite(cartTotal) || cartTotal <= 0) {
    return { valid: false, error: "Add items to your cart before applying a coupon." };
  }

  if (coupon.deleted_at) {
    return { valid: false, error: "Invalid coupon code" };
  }

  if (!coupon.is_active || (coupon.lifecycle_status && coupon.lifecycle_status !== "active")) {
    return { valid: false, error: "Invalid coupon code" };
  }

  if (isNotYetValid(coupon, now)) {
    return { valid: false, error: "This coupon is not active yet" };
  }

  if (isExpired(coupon, now)) {
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

  const freeShipping = isFreeShippingPromo(coupon);
  const savings = calculateProductSavings(coupon, cartTotal);

  if (!freeShipping && savings <= 0) {
    return { valid: false, error: "Invalid code" };
  }

  const description = coupon.description?.trim();
  const defaultMessage = freeShipping
    ? `${coupon.code} applied — Free shipping unlocked!`
    : `${coupon.code} applied — You save ₹${savings.toLocaleString("en-IN")}!`;

  return {
    valid: true,
    discountType: mapDiscountType(coupon.type),
    discountValue: Number(coupon.value),
    savings,
    freeShipping,
    message: description || defaultMessage,
    couponId: coupon.id,
    code: coupon.code,
  };
}
