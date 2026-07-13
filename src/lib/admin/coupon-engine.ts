import "server-only";

import {
  countCouponUsageForCustomer,
  redeemCouponForOrder,
  releaseCouponForOrder,
} from "@/lib/coupons/redemption";
import {
  type BuyXGetYRule,
  type CouponEligibility,
  type CouponValidationContext,
  type CouponValidationResult,
  type CouponType,
  computeDisplayStatus,
} from "./coupon-types";
import { getCouponByCode } from "./coupons";

function eligibleItems(ctx: CouponValidationContext, eligibility: CouponEligibility) {
  let items = ctx.items;

  if (eligibility.excludeProductIds?.length) {
    const ex = new Set(eligibility.excludeProductIds);
    items = items.filter((i) => !i.productId || !ex.has(i.productId));
  }
  if (eligibility.excludeCategoryIds?.length) {
    const ex = new Set(eligibility.excludeCategoryIds);
    items = items.filter((i) => !i.categoryId || !ex.has(i.categoryId));
  }
  if (eligibility.productIds?.length) {
    const inc = new Set(eligibility.productIds);
    items = items.filter((i) => i.productId && inc.has(i.productId));
  }
  if (eligibility.categoryIds?.length) {
    const inc = new Set(eligibility.categoryIds);
    items = items.filter((i) => i.categoryId && inc.has(i.categoryId));
  }
  if (eligibility.brandIds?.length) {
    const inc = new Set(eligibility.brandIds);
    items = items.filter((i) => i.brandId && inc.has(i.brandId));
  }

  return items;
}

function eligibleSubtotal(ctx: CouponValidationContext, eligibility: CouponEligibility) {
  return eligibleItems(ctx, eligibility).reduce((s, i) => s + i.unitPrice * i.quantity, 0);
}

function capDiscount(amount: number, max: number | null | undefined) {
  if (max == null) return amount;
  return Math.min(amount, max);
}

export function calculateDiscount(
  promoType: CouponType,
  value: number,
  ctx: CouponValidationContext,
  opts: {
    maxDiscount?: number | null;
    eligibility?: CouponEligibility;
    buyXGetY?: BuyXGetYRule;
    freeShippingMin?: number;
  } = {},
): { discountAmount: number; freeShipping: boolean } {
  const subtotal = eligibleSubtotal(ctx, opts.eligibility ?? {});
  let discountAmount = 0;
  let freeShipping = false;

  switch (promoType) {
    case "percentage":
    case "automatic":
      discountAmount = capDiscount((subtotal * value) / 100, opts.maxDiscount);
      break;
    case "fixed_amount":
    case "gift_voucher":
      discountAmount = capDiscount(Math.min(value, ctx.subtotal), opts.maxDiscount);
      break;
    case "free_shipping": {
      const min = opts.freeShippingMin ?? 0;
      if (ctx.subtotal >= min) {
        freeShipping = true;
        discountAmount = ctx.shippingTotal ?? 0;
      }
      break;
    }
    case "buy_x_get_y": {
      const rule = opts.buyXGetY ?? {};
      const buyQty = rule.buyQuantity ?? 1;
      const getQty = rule.getQuantity ?? 1;
      const eligible = eligibleItems(ctx, opts.eligibility ?? {});
      const totalQty = eligible.reduce((s, i) => s + i.quantity, 0);
      const sets = Math.floor(totalQty / (buyQty + getQty));
      if (sets > 0 && rule.getProductId) {
        const getItem = ctx.items.find((i) => i.productId === rule.getProductId);
        if (getItem) {
          const pct = (rule.discountPercent ?? 100) / 100;
          discountAmount = capDiscount(getItem.unitPrice * getQty * sets * pct, opts.maxDiscount);
        }
      }
      break;
    }
    default:
      break;
  }

  return { discountAmount: Math.max(0, Math.round(discountAmount * 100) / 100), freeShipping };
}

export async function validateCoupon(
  code: string,
  ctx: CouponValidationContext,
): Promise<CouponValidationResult> {
  const row = await getCouponByCode(code);
  if (!row) return { valid: false, error: "Coupon not found." };

  const lifecycle = row.lifecycle_status ?? "draft";
  const display = computeDisplayStatus({
    isActive: row.is_active,
    lifecycleStatus: lifecycle,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
  });

  if (row.deleted_at) return { valid: false, error: "Coupon is no longer available." };
  if (lifecycle === "archived") return { valid: false, error: "Coupon has been archived." };
  if (!row.is_active) return { valid: false, error: "Coupon is inactive." };
  if (display === "expired") return { valid: false, error: "Coupon has expired." };
  if (display === "scheduled") return { valid: false, error: "Coupon is not yet active." };

  if (row.logged_in_only && !ctx.isLoggedIn) return { valid: false, error: "Login required to use this coupon." };
  if (row.first_order_only && ctx.isFirstOrder === false) return { valid: false, error: "Valid for first orders only." };

  if (ctx.subtotal < Number(row.min_order ?? 0)) {
    return { valid: false, error: `Minimum cart value is ₹${row.min_order}.` };
  }

  const eligibility = (row.eligibility as CouponEligibility) ?? {};
  if (eligibility.customerIds?.length && ctx.customerId) {
    if (!eligibility.customerIds.includes(ctx.customerId)) {
      return { valid: false, error: "Coupon not valid for this customer." };
    }
  }

  if (row.max_uses != null && row.used_count >= row.max_uses) {
    return { valid: false, error: "Coupon usage limit reached." };
  }

  if (row.per_customer_limit != null && ctx.customerId) {
    const usageCount = await countCouponUsageForCustomer(row.id, ctx.customerId);
    if (usageCount >= row.per_customer_limit) {
      return { valid: false, error: "Per-customer usage limit reached." };
    }
  }

  if (row.is_exclusive && ctx.existingCouponIds?.length) {
    return { valid: false, error: "Cannot combine with other coupons." };
  }

  const promoType = (row.promo_type ?? (row.type === "percent" ? "percentage" : "fixed_amount")) as CouponType;
  const freeShippingRule = (row.free_shipping as { minimumCartValue?: number }) ?? {};
  const { discountAmount, freeShipping } = calculateDiscount(promoType, row.value, ctx, {
    maxDiscount: row.max_discount,
    eligibility,
    buyXGetY: row.buy_x_get_y as BuyXGetYRule,
    freeShippingMin: freeShippingRule.minimumCartValue,
  });

  if (promoType !== "free_shipping" && discountAmount <= 0) {
    return { valid: false, error: "Coupon does not apply to this cart." };
  }

  return {
    valid: true,
    error: null,
    couponId: row.id,
    discountAmount,
    freeShipping,
  };
}

export async function applyCoupon(
  orderId: string,
  couponId: string,
  customerId: string | null,
  discountAmount: number,
  orderSubtotal: number,
): Promise<string | null> {
  const result = await redeemCouponForOrder({
    orderId,
    couponId,
    customerId,
    discountAmount,
    orderSubtotal,
  });

  return result.ok ? null : result.error;
}

export async function removeCoupon(orderId: string): Promise<string | null> {
  const result = await releaseCouponForOrder(orderId);
  return result.ok ? null : result.error;
}
