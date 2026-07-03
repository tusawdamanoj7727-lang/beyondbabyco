"use server";

import type { CartLineItem, CouponValidationContext } from "@/lib/admin/coupon-types";
import { validateCoupon } from "@/lib/coupons/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { getCustomerIdForUser } from "@/lib/orders/customer-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/storefront/cart-types";
import { cartSubtotal } from "@/lib/storefront/cart-types";

export interface ValidateCouponActionResult {
  ok: boolean;
  error: string | null;
  code?: string;
  couponId?: string;
  discountAmount?: number;
  freeShipping?: boolean;
}

function toCartLineItems(items: CartItem[]): CartLineItem[] {
  return items.map((item) => ({
    productId: item.productId,
    categoryId: item.categoryId,
    brandId: item.brandId,
    quantity: item.quantity,
    unitPrice: item.price,
  }));
}

async function isFirstOrder(customerId: string | null): Promise<boolean | undefined> {
  if (!customerId) return undefined;
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .in("status", ["confirmed", "processing", "shipped", "delivered"]);
  return (count ?? 0) === 0;
}

export async function validateCartCouponAction(
  code: string,
  items: CartItem[],
  shippingTotal = 0,
): Promise<ValidateCouponActionResult> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { ok: false, error: "Enter a coupon code." };

  const user = await getCurrentUser();
  const customerId = user ? await getCustomerIdForUser(user.id) : null;
  const subtotal = cartSubtotal(items);

  const ctx: CouponValidationContext = {
    customerId,
    isLoggedIn: !!user,
    isFirstOrder: await isFirstOrder(customerId),
    subtotal,
    shippingTotal,
    items: toCartLineItems(items),
  };

  const result = await validateCoupon(trimmed, ctx);
  if (!result.valid) {
    return { ok: false, error: result.error ?? "Invalid coupon." };
  }

  return {
    ok: true,
    error: null,
    code: trimmed,
    couponId: result.couponId,
    discountAmount: result.discountAmount ?? 0,
    freeShipping: result.freeShipping ?? false,
  };
}
