"use client";

import { useCart } from "@/lib/storefront/cart-context";
import { SELLER_STATE } from "@/lib/utils/gst";
import {
  calculateGSTFromCart,
  type GstLineItem,
} from "@/lib/utils/gst";

export function useCheckoutTotals(shippingTotal: number, buyerState: string) {
  const { items, subtotal, appliedCoupon } = useCart();
  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const freeShipping = appliedCoupon?.freeShipping ?? false;
  const shipping = freeShipping ? 0 : shippingTotal;
  const afterDiscount = Math.max(0, subtotal - couponDiscount);
  const gstLineItems: GstLineItem[] = items.map((i) => ({
    price: i.price,
    quantity: i.quantity,
    gstRate: i.gstRate,
  }));
  const gstBreakdown = calculateGSTFromCart(
    gstLineItems,
    buyerState.trim() || SELLER_STATE,
    couponDiscount,
  );
  const total = afterDiscount + shipping;
  return {
    subtotal,
    couponDiscount,
    shipping,
    tax: gstBreakdown.total,
    gstBreakdown,
    total,
    freeShipping,
  };
}
