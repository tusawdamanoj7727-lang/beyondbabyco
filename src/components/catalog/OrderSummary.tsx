"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, MapPin, Tag, Truck } from "lucide-react";

import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { useCustomerAuth } from "@/lib/auth/customer-hooks";
import { formatInr } from "@/lib/catalog/format";
import { formControl } from "@/lib/design/ui";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/storefront/cart-context";
import { cartMrpTotal } from "@/lib/storefront/cart-types";
import { validateCartCouponAction } from "@/lib/storefront/coupon-actions";
import { checkDeliveryEstimateAction } from "@/lib/storefront/delivery-actions";
import PricingTaxNote from "@/components/catalog/PricingTaxNote";
import { calcCheckoutTax } from "@/lib/checkout/tax";
import { estimateShippingFee, FREE_SHIPPING_THRESHOLD } from "@/lib/storefront/shipping";

type OrderSummaryProps = {
  compact?: boolean;
  onCheckout?: () => void;
};

export default function OrderSummary({ compact = false, onCheckout }: OrderSummaryProps) {
  const { items, appliedCoupon, setAppliedCoupon, subtotal } = useCart();
  const { isLoggedIn, loading: authLoading } = useCustomerAuth();
  const toast = useToast();
  const [couponInput, setCouponInput] = useState(appliedCoupon?.code ?? "");
  const [pincode, setPincode] = useState("");
  const [delivery, setDelivery] = useState<{
    serviceable: boolean;
    estimatedDelivery?: string;
    cod?: boolean;
    prepaid?: boolean;
  } | null>(null);
  const [couponPending, startCoupon] = useTransition();
  const [deliveryPending, startDelivery] = useTransition();

  const mrpTotal = cartMrpTotal(items);
  const productDiscount = Math.max(0, mrpTotal - subtotal);
  const shippingBeforeCoupon = estimateShippingFee(subtotal, false);
  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const freeShipping = appliedCoupon?.freeShipping ?? false;
  const shipping = freeShipping ? 0 : estimateShippingFee(subtotal, false);
  const totalDiscount = productDiscount + couponDiscount;
  const afterDiscount = Math.max(0, subtotal - couponDiscount);
  const estimatedGst = calcCheckoutTax(afterDiscount);
  const total = Math.max(0, afterDiscount + shipping);

  function applyCoupon() {
    startCoupon(async () => {
      const result = await validateCartCouponAction(couponInput, items, shippingBeforeCoupon);
      if (!result.ok) {
        toast.error(result.error ?? "Invalid coupon");
        return;
      }
      setAppliedCoupon({
        code: result.code!,
        couponId: result.couponId!,
        discountAmount: result.discountAmount ?? 0,
        freeShipping: result.freeShipping ?? false,
      });
      toast.success(`Coupon ${result.code} applied`);
    });
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    toast.info("Coupon removed");
  }

  function checkDelivery() {
    startDelivery(async () => {
      const result = await checkDeliveryEstimateAction(pincode);
      if (!result.ok) {
        toast.error(result.error ?? "Could not check delivery");
        return;
      }
      if (!result.serviceable) {
        setDelivery({ serviceable: false });
        toast.error("Delivery not available to this PIN code");
        return;
      }
      setDelivery({
        serviceable: true,
        estimatedDelivery: result.estimatedDelivery,
        cod: result.cod,
        prepaid: result.prepaid,
      });
      toast.success("Delivery available");
    });
  }

  return (
    <aside
      className={
        compact
          ? "space-y-4"
          : "sticky top-32 rounded-3xl border border-green-100/80 bg-white/90 p-6 shadow-card backdrop-blur-sm"
      }
      aria-label="Order summary"
    >
      {!compact ? (
        <h2 className="font-heading text-xl font-bold text-green-900">Order Summary</h2>
      ) : null}

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between text-green-700">
          <dt>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</dt>
          <dd className="font-medium text-green-900">{formatInr(subtotal)}</dd>
        </div>
        {productDiscount > 0 ? (
          <div className="flex justify-between text-terra-600">
            <dt>Product savings</dt>
            <dd className="font-medium">−{formatInr(productDiscount)}</dd>
          </div>
        ) : null}
        {appliedCoupon ? (
          <div className="flex justify-between text-terra-600">
            <dt>Coupon ({appliedCoupon.code})</dt>
            <dd className="font-medium">−{formatInr(couponDiscount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between text-green-700">
          <dt className="flex items-center gap-1.5">
            <Truck className="h-4 w-4" aria-hidden="true" />
            Shipping
          </dt>
          <dd className="font-medium text-green-900">
            {shipping === 0 ? <span className="text-green-600">Free</span> : formatInr(shipping)}
          </dd>
        </div>
        {subtotal < FREE_SHIPPING_THRESHOLD && !freeShipping ? (
          <p className="text-xs text-green-600/80">
            Add {formatInr(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping
          </p>
        ) : null}
        <div className="flex justify-between text-green-700/80">
          <dt>Estimated GST (18%)</dt>
          <dd className="font-medium text-green-900">{formatInr(estimatedGst)}</dd>
        </div>
      </dl>

      <PricingTaxNote className="mt-2" />

      {!compact ? (
        <div className="mt-5 space-y-3 border-t border-green-100 pt-5">
          <label htmlFor="coupon-code" className="flex items-center gap-1.5 text-sm font-semibold text-green-800">
            <Tag className="h-4 w-4" aria-hidden="true" />
            Coupon code
          </label>
          <div className="flex gap-2">
            <input
              id="coupon-code"
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="Enter code"
              disabled={!!appliedCoupon || couponPending}
              className={cn("min-w-0 flex-1 uppercase", formControl, "text-sm")}
            />
            {appliedCoupon ? (
              <Button variant="secondary" size="sm" type="button" onClick={removeCoupon}>
                Remove
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={couponPending || !couponInput.trim()}
                onClick={applyCoupon}
              >
                {couponPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {!compact ? (
        <div className="mt-5 space-y-3 border-t border-green-100 pt-5">
          <label
            htmlFor="delivery-pincode"
            className="flex items-center gap-1.5 text-sm font-semibold text-green-800"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Delivery estimate
          </label>
          <div className="flex gap-2">
            <input
              id="delivery-pincode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="PIN code"
              className={cn("min-w-0 flex-1", formControl, "text-sm")}
            />
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled={deliveryPending || pincode.length !== 6}
              onClick={checkDelivery}
            >
              {deliveryPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
            </Button>
          </div>
          {delivery ? (
            <div className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">
              {delivery.serviceable ? (
                <>
                  <p className="font-medium">Delivery available</p>
                  {delivery.estimatedDelivery ? (
                    <p className="mt-0.5 text-green-700/80">Est. {delivery.estimatedDelivery}</p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-green-600/80">
                    {delivery.prepaid ? "Prepaid" : ""}
                    {delivery.prepaid && delivery.cod ? " · " : ""}
                    {delivery.cod ? "COD available" : ""}
                  </p>
                </>
              ) : (
                <p className="font-medium text-terra-700">Not serviceable to this PIN</p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between border-t border-green-100 pt-5">
        <span className="font-heading text-lg font-bold text-green-900">Estimated total (excl. GST)</span>
        <span className="font-heading text-2xl font-bold text-green-900">{formatInr(total)}</span>
      </div>
      {totalDiscount > 0 ? (
        <p className="text-right text-sm font-medium text-terra-600">
          Total savings {formatInr(totalDiscount)}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3">
        <Button
          variant="primary"
          fullWidth
          type="button"
          disabled={items.length === 0 || items.some((i) => !i.inStock)}
          onClick={onCheckout ?? (() => { window.location.href = "/checkout"; })}
        >
          Proceed to Checkout
        </Button>
        {!authLoading && !isLoggedIn ? (
          <p className="text-center text-xs text-green-700/80">
            <Link href="/login?redirectTo=/checkout" className="font-semibold text-terra-600 hover:underline">
              Sign in
            </Link>{" "}
            to complete your order. New here?{" "}
            <Link href="/register?redirectTo=/checkout" className="font-semibold text-terra-600 hover:underline">
              Create an account
            </Link>
            .
          </p>
        ) : null}
        <Link
          href="/products"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-green-200 px-5 py-2.5 text-sm font-semibold text-green-800 transition-colors hover:bg-green-50"
        >
          Continue Shopping
        </Link>
      </div>
    </aside>
  );
}
