/** GST rate for baby care products (display + order tax_total). */
export const GST_RATE = 0.18;

/** GST disclosure copy for product, cart, and mini cart surfaces. */
export const GST_CHECKOUT_NOTE = "GST (18%) calculated at checkout";

export function calcCheckoutTax(taxableAmount: number): number {
  return Math.round(taxableAmount * GST_RATE * 100) / 100;
}

export function calcCheckoutTotals(input: {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
}) {
  const afterDiscount = Math.max(0, input.subtotal - input.discountTotal);
  const taxTotal = calcCheckoutTax(afterDiscount);
  const grandTotal = Math.max(0, afterDiscount + input.shippingTotal + taxTotal);
  return {
    subtotal: input.subtotal,
    discountTotal: input.discountTotal,
    taxTotal,
    shippingTotal: input.shippingTotal,
    grandTotal,
  };
}
