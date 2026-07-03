/** Storefront shipping estimates — checkout will use full rate tables in Phase 6.5. */
export const FREE_SHIPPING_THRESHOLD = 999;
export const STANDARD_SHIPPING_FEE = 99;
export const ESTIMATED_DELIVERY_DAYS = "3–5 business days";

export function estimateShippingFee(subtotal: number, freeShippingCoupon = false): number {
  if (freeShippingCoupon || subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return STANDARD_SHIPPING_FEE;
}
