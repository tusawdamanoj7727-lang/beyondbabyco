import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type CouponRedemptionResult = { ok: true } | { ok: false; error: string };

/**
 * Trusted storefront coupon redemption — service_role RPC only.
 * Customers never insert into coupon_usage directly.
 */
export async function redeemCouponForOrder(input: {
  orderId: string;
  couponId: string;
  customerId: string | null;
  discountAmount: number;
  orderSubtotal: number;
}): Promise<CouponRedemptionResult> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase.rpc("redeem_coupon_for_order", {
    p_order_id: input.orderId,
    p_coupon_id: input.couponId,
    p_customer_id: input.customerId,
    p_discount_amount: input.discountAmount,
    p_order_subtotal: input.orderSubtotal,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const message = typeof data === "string" && data.trim().length > 0 ? data : null;
  if (message) {
    return { ok: false, error: message };
  }

  await supabase.rpc("log_audit", {
    p_table: "coupons",
    p_record: input.couponId,
    p_action: "redeem",
    p_new: {
      order_id: input.orderId,
      discount_amount: input.discountAmount,
    } as Json,
  });

  return { ok: true };
}

/** Reverse coupon usage when a pending order is cancelled. Idempotent. */
export async function releaseCouponForOrder(orderId: string): Promise<CouponRedemptionResult> {
  if (!orderId.trim()) return { ok: true };

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.rpc("release_coupon_for_order", {
    p_order_id: orderId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/** Count prior redemptions for per-customer limit checks (service_role read). */
export async function countCouponUsageForCustomer(
  couponId: string,
  customerId: string,
): Promise<number> {
  const supabase = createSupabaseServiceClient();
  const { count, error } = await supabase
    .from("coupon_usage")
    .select("id", { count: "exact", head: true })
    .eq("coupon_id", couponId)
    .eq("customer_id", customerId);

  if (error) {
    console.error("[coupons] countCouponUsageForCustomer failed:", error.message);
    return Number.MAX_SAFE_INTEGER;
  }

  return count ?? 0;
}
