"use client";

import { formatInr } from "@/lib/catalog/format";
import { useCart } from "@/lib/storefront/cart-context";
import { cartMrpTotal } from "@/lib/storefront/cart-types";
import { calcCheckoutTax } from "@/lib/checkout/tax";
import { ESTIMATED_DELIVERY_DAYS, FREE_SHIPPING_THRESHOLD } from "@/lib/storefront/shipping";

type CheckoutOrderSummaryProps = {
  shippingTotal: number;
  deliveryEstimate?: string | null;
  serviceable?: boolean | null;
  codAvailable?: boolean;
  compact?: boolean;
};

export default function CheckoutOrderSummary({
  shippingTotal,
  deliveryEstimate,
  serviceable,
  codAvailable,
  compact = false,
}: CheckoutOrderSummaryProps) {
  const { items, subtotal, appliedCoupon } = useCart();

  const mrpTotal = cartMrpTotal(items);
  const productSavings = Math.max(0, mrpTotal - subtotal);
  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const freeShipping = appliedCoupon?.freeShipping ?? false;
  const shipping = freeShipping ? 0 : shippingTotal;
  const afterDiscount = Math.max(0, subtotal - couponDiscount);
  const tax = calcCheckoutTax(afterDiscount);
  const total = afterDiscount + shipping + tax;
  const totalSavings = productSavings + couponDiscount;

  return (
    <aside
      className={
        compact
          ? "space-y-3"
          : "sticky top-32 rounded-3xl border border-green-100/80 bg-white/95 p-6 shadow-card backdrop-blur-sm"
      }
      aria-label="Order summary"
    >
      {!compact ? (
        <h2 className="font-heading text-xl font-bold text-green-900">Order Summary</h2>
      ) : null}

      <ul className="mt-4 max-h-48 space-y-3 overflow-y-auto text-sm">
        {items.map((item) => (
          <li key={`${item.productId}:${item.variantId ?? "d"}`} className="flex gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-green-900 line-clamp-2">{item.name}</p>
              {item.variantName ? (
                <p className="text-xs text-green-700/70">{item.variantName}</p>
              ) : null}
              <p className="text-xs text-green-600/80">Qty {item.quantity}</p>
            </div>
            <span className="shrink-0 font-medium">{formatInr(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-green-100 pt-4 text-sm">
        <div className="flex justify-between text-green-700">
          <dt>Subtotal</dt>
          <dd>{formatInr(subtotal)}</dd>
        </div>
        {productSavings > 0 ? (
          <div className="flex justify-between text-terra-600">
            <dt>Product savings</dt>
            <dd>−{formatInr(productSavings)}</dd>
          </div>
        ) : null}
        {appliedCoupon ? (
          <div className="flex justify-between text-terra-600">
            <dt>Coupon ({appliedCoupon.code})</dt>
            <dd>−{formatInr(couponDiscount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between text-green-700">
          <dt>Shipping</dt>
          <dd>{shipping === 0 ? "Free" : formatInr(shipping)}</dd>
        </div>
        <div className="flex justify-between text-green-700">
          <dt>GST (18%)</dt>
          <dd>{formatInr(tax)}</dd>
        </div>
      </dl>

      {subtotal < FREE_SHIPPING_THRESHOLD && !freeShipping ? (
        <p className="mt-2 text-xs text-green-600/80">
          Add {formatInr(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping
        </p>
      ) : null}

      {serviceable != null ? (
        <div className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">
          {serviceable ? (
            <>
              <p className="font-medium">Delivery available</p>
              <p className="text-green-700/80">Est. {deliveryEstimate ?? ESTIMATED_DELIVERY_DAYS}</p>
              {codAvailable ? (
                <p className="mt-0.5 text-xs text-green-600/80">Cash on Delivery available</p>
              ) : null}
            </>
          ) : (
            <p className="font-medium text-terra-700">Not serviceable to this PIN yet</p>
          )}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between border-t border-green-100 pt-4">
        <span className="font-heading text-lg font-bold text-green-900">Total</span>
        <span className="font-heading text-2xl font-bold text-green-900">{formatInr(total)}</span>
      </div>
      {totalSavings > 0 ? (
        <p className="text-right text-sm font-medium text-terra-600">
          You save {formatInr(totalSavings)}
        </p>
      ) : null}
    </aside>
  );
}

export function useCheckoutTotals(shippingTotal: number) {
  const { subtotal, appliedCoupon } = useCart();
  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const freeShipping = appliedCoupon?.freeShipping ?? false;
  const shipping = freeShipping ? 0 : shippingTotal;
  const afterDiscount = Math.max(0, subtotal - couponDiscount);
  const tax = calcCheckoutTax(afterDiscount);
  const total = afterDiscount + shipping + tax;
  return { subtotal, couponDiscount, shipping, tax, total, freeShipping };
}
