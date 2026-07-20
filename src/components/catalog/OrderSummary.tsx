"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, Tag, Truck, X } from "lucide-react";

import FreeShippingProgress from "@/components/catalog/FreeShippingProgress";
import Button from "@/components/ui/Button";
import { formatInr } from "@/lib/catalog/format";
import { INDIAN_STATES } from "@/lib/checkout/schema";
import { formControl } from "@/lib/design/ui";
import { apiCouponToStore } from "@/lib/store/cart-mappers";
import { useCartStore } from "@/lib/store/cart-store";
import { applyCouponViaApi } from "@/lib/storefront/cart-coupons";
import { useCart } from "@/lib/storefront/cart-context";
import {
  calculateGSTFromCart,
  gstDisplayLines,
  SELLER_STATE,
  type GstLineItem,
} from "@/lib/utils/gst";
import {
  estimateShippingFee,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
} from "@/lib/storefront/shipping";
import { cn } from "@/lib/utils";

type OrderSummaryProps = {
  compact?: boolean;
  onCheckout?: () => void;
};

export default function OrderSummary({ compact = false, onCheckout }: OrderSummaryProps) {
  const { items, appliedCoupon, setAppliedCoupon, subtotal } = useCart();
  const [buyerState, setBuyerState] = useState(SELLER_STATE);
  const [couponInput, setCouponInput] = useState(appliedCoupon?.code ?? "");
  const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [applying, setApplying] = useState(false);

  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const afterDiscount = Math.max(0, subtotal - couponDiscount);
  const shipping = estimateShippingFee(afterDiscount, appliedCoupon?.freeShipping ?? false);
  const gstLineItems: GstLineItem[] = items.map((i) => ({
    price: i.price,
    quantity: i.quantity,
    gstRate: i.gstRate,
  }));
  const gstBreakdown = calculateGSTFromCart(gstLineItems, buyerState, couponDiscount);
  const gstLines = gstDisplayLines(gstBreakdown, gstLineItems);
  const total = Math.max(0, afterDiscount + shipping);

  async function applyCoupon() {
    setApplying(true);
    setCouponMessage(null);

    try {
      const result = await applyCouponViaApi(couponInput, subtotal);

      if (!result.valid) {
        setCouponMessage({ type: "error", text: result.error });
        return;
      }

      setAppliedCoupon({
        code: result.code,
        couponId: result.couponId,
        discountAmount: result.savings,
        freeShipping: result.freeShipping,
      });
      useCartStore.getState().applyCoupon(
        apiCouponToStore({
          code: result.code,
          discountType: result.discountType,
          discountValue: result.discountValue,
          savings: result.savings,
          freeShipping: result.freeShipping,
        }),
      );
      setCouponMessage({
        type: "success",
        text: result.message,
      });
    } catch {
      setCouponMessage({
        type: "error",
        text: "Could not validate coupon. Please try again.",
      });
    } finally {
      setApplying(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    useCartStore.getState().removeCoupon();
    setCouponInput("");
    setCouponMessage(null);
  }

  return (
    <aside
      className={
        compact
          ? "space-y-4"
          : "glass-surface-strong sticky top-32 rounded-[var(--radius-card)] p-6"
      }
      aria-label="Order summary"
    >
      {!compact ? (
        <h2 className="font-heading text-xl font-bold text-brand-forest">Order Summary</h2>
      ) : null}

      <dl className={cn("space-y-3 text-sm", compact ? "mt-0" : "mt-5")}>
        <div className="flex justify-between text-brand-forest/85">
          <dt>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</dt>
          <dd className="font-medium text-brand-forest">{formatInr(subtotal)}</dd>
        </div>

        {appliedCoupon && couponDiscount > 0 ? (
          <div className="flex justify-between text-emerald-700">
            <dt className="flex items-center gap-1">
              Discount ({appliedCoupon.code})
            </dt>
            <dd className="font-semibold">−{formatInr(couponDiscount)}</dd>
          </div>
        ) : null}

        {gstLines.map((line) => (
          <div key={line.label} className="flex justify-between text-brand-forest/85">
            <dt>{line.label}</dt>
            <dd className="font-medium text-brand-forest">{formatInr(line.amount)}</dd>
          </div>
        ))}

        <div className="flex justify-between text-brand-forest/85">
          <dt className="flex items-center gap-1.5">
            <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
            Delivery
          </dt>
          <dd className="font-medium text-brand-forest">
            {shipping === 0 ? (
              <span className="font-semibold text-emerald-700">FREE</span>
            ) : (
              formatInr(STANDARD_SHIPPING_FEE)
            )}
          </dd>
        </div>
      </dl>

      {!compact ? (
        <div className="mt-4 space-y-2 border-t border-brand-forest/10 pt-4">
          <label htmlFor="summary-gst-state" className="text-xs font-semibold text-brand-forest/70">
            Delivery state (GST estimate)
          </label>
          <select
            id="summary-gst-state"
            value={buyerState}
            onChange={(e) => setBuyerState(e.target.value)}
            className={cn("w-full text-sm bg-white", formControl)}
          >
            {INDIAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {!compact ? (
        <div className="mt-5 space-y-2 border-t border-brand-forest/10 pt-5">
          <label htmlFor="coupon-code" className="flex items-center gap-1.5 text-sm font-semibold text-brand-forest">
            <Tag className="h-4 w-4" aria-hidden="true" />
            Coupon code
          </label>
          <div className="flex gap-2">
            <input
              id="coupon-code"
              type="text"
              value={couponInput}
              onChange={(e) => {
                setCouponInput(e.target.value.toUpperCase());
                if (couponMessage) setCouponMessage(null);
              }}
              placeholder="Enter code"
              disabled={!!appliedCoupon || applying}
              className={cn("min-w-0 flex-1 uppercase", formControl, "text-sm bg-white")}
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={removeCoupon}
                aria-label="Remove coupon"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-forest/20 bg-white text-brand-forest transition-colors hover:bg-brand-forest/5"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={applying || !couponInput.trim()}
                onClick={() => void applyCoupon()}
                className="shrink-0 min-w-[4.5rem]"
              >
                {applying ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Validating coupon" /> : "Apply"}
              </Button>
            )}
          </div>
          {couponMessage ? (
            <p
              role="status"
              className={cn(
                "flex items-start gap-1.5 text-xs font-medium",
                couponMessage.type === "success" ? "text-emerald-700" : "text-red-600",
              )}
            >
              {couponMessage.type === "success" ? (
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : null}
              {couponMessage.text}
            </p>
          ) : null}
        </div>
      ) : null}

      {!compact ? (
        <div className="mt-5 border-t border-brand-forest/10 pt-5">
          <FreeShippingProgress
            subtotal={subtotal}
            unlocked={appliedCoupon?.freeShipping ?? subtotal >= FREE_SHIPPING_THRESHOLD}
          />
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between border-t border-brand-forest/10 pt-5">
        <span className="font-heading text-lg font-bold text-brand-forest">Total</span>
        <span className="font-heading text-2xl font-bold text-brand-forest">{formatInr(total)}</span>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <Button
          variant="primary"
          fullWidth
          type="button"
          disabled={items.length === 0 || items.some((i) => !i.inStock)}
          onClick={onCheckout ?? (() => { window.location.href = "/checkout"; })}
          className="bg-brand-forest hover:bg-green-800 border-transparent font-semibold"
        >
          Proceed to Checkout
        </Button>
        <Link
          href="/products"
          className="inline-flex min-h-[44px] items-center justify-center text-sm font-semibold text-brand-terra transition-colors hover:text-terra-700 hover:underline"
        >
          Continue Shopping
        </Link>
      </div>
    </aside>
  );
}
