/** Storefront shipping estimates — checkout will use full rate tables in Phase 6.5. */
export const FREE_SHIPPING_THRESHOLD = 999;
export const STANDARD_SHIPPING_FEE = 49;
export const ESTIMATED_DELIVERY_DAYS = "3–5 business days";

export function estimateShippingFee(subtotal: number, freeShippingCoupon = false): number {
  if (freeShippingCoupon || subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return STANDARD_SHIPPING_FEE;
}

export function freeShippingProgress(subtotal: number) {
  const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingCharge = hasFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return {
    hasFreeShipping,
    shippingCharge,
    amountToFreeShipping,
    progressPercent,
  };
}
