"use client";

import { useEffect, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Tag, Trash2 } from "lucide-react";

import ProductImageFallback from "@/components/brand/ProductImageFallback";
import CartEmptyState from "@/components/catalog/CartEmptyState";

const CartUpsellRail = dynamic(() => import("@/components/cart/CartUpsellRail"), {
  loading: () => null,
  ssr: false,
});
import CommerceTrustStrip from "@/components/catalog/CommerceTrustStrip";
import FreeShippingProgress from "@/components/catalog/FreeShippingProgress";
import Button from "@/components/ui/Button";
import { trackViewCart } from "@/lib/analytics/events";
import { analyticsItemFromCartItem } from "@/lib/analytics/items";
import { formatInr } from "@/lib/catalog/format";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { applyCouponViaApi } from "@/lib/storefront/cart-coupons";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartHydrated } from "@/lib/store/use-cart-hydrated";
import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
} from "@/lib/storefront/shipping";
import { clampCartQuantity } from "@/lib/storefront/cart-types";
import { cn } from "@/lib/utils";
import { focusRing, formControl, surfaceCard } from "@/lib/design/ui";

function CartSkeleton() {
  return (
    <div className="min-h-screen bg-brand-cream py-8">
      <div className="mx-auto max-w-6xl animate-pulse px-4">
        <div className="skeleton-shimmer mb-8 h-9 w-48 rounded-lg" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="skeleton-shimmer h-28 rounded-[var(--radius-card)]" />
            <div className="skeleton-shimmer h-28 rounded-[var(--radius-card)]" />
          </div>
          <div className="skeleton-shimmer h-96 rounded-[var(--radius-card)]" />
        </div>
      </div>
    </div>
  );
}

export default function CartPageClient({
  upsellProducts = [],
}: {
  upsellProducts?: StorefrontProduct[];
}) {
  const hydrated = useCartHydrated();

  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const itemCount = useCartStore((s) => s.itemCount());
  const subtotal = useCartStore((s) => s.subtotal());
  const discount = useCartStore((s) => s.discount());
  const gstAmount = useCartStore((s) => s.gstAmount());
  const shippingCharge = useCartStore((s) => s.shippingCharge());
  const total = useCartStore((s) => s.total());

  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState({ text: "", type: "" as "" | "success" | "error" });
  const [applying, setApplying] = useState(false);
  const couponId = useId();
  const viewCartTrackedRef = useRef(false);

  useEffect(() => {
    if (!hydrated || items.length === 0 || viewCartTrackedRef.current) return;
    viewCartTrackedRef.current = true;
    trackViewCart({
      value: total,
      items: items.map((item) => analyticsItemFromCartItem(item, coupon?.code)),
      currency: "INR",
    });
  }, [hydrated, items, total, coupon?.code]);

  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setApplying(true);
    setCouponMsg({ text: "", type: "" });

    try {
      const data = await applyCouponViaApi(code, subtotal);

      if (data.valid) {
        applyCoupon({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          savings: data.savings,
          freeShipping: data.freeShipping,
        });
        setCouponMsg({
          text: data.freeShipping
            ? `Coupon applied! Free shipping unlocked.`
            : `Coupon applied! You save ${formatInr(data.savings)}`,
          type: "success",
        });
        setCouponInput("");
      } else {
        setCouponMsg({ text: data.error ?? "Invalid coupon code", type: "error" });
      }
    } catch {
      setCouponMsg({ text: "Something went wrong. Please try again.", type: "error" });
    } finally {
      setApplying(false);
    }
  }

  if (!hydrated) return <CartSkeleton />;

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-cream px-4 py-16">
        <CartEmptyState recoveryProducts={upsellProducts} />
      </div>
    );
  }

  const lineCompareSavings = items.reduce((sum, item) => {
    if (item.originalPrice > item.price) {
      return sum + (item.originalPrice - item.price) * item.quantity;
    }
    return sum;
  }, 0);
  const totalSavings = discount + lineCompareSavings;

  return (
    <div className="min-h-screen bg-brand-cream pb-28 pt-8 lg:pb-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
          <h1 className="font-heading text-3xl font-black text-green-900">
            My Cart{" "}
            <span className="text-lg font-medium text-green-700">
              ({itemCount} {itemCount === 1 ? "item" : "items"})
            </span>
          </h1>
          <Link
            href="/products"
            className={cn(
              "hidden items-center gap-2 text-sm font-semibold text-green-800 hover:text-terra-700 sm:inline-flex",
              focusRing,
            )}
          >
            <ShoppingBag size={16} aria-hidden="true" />
            Continue shopping
          </Link>
        </div>

        {totalSavings > 0 ? (
          <p
            role="status"
            className="mb-5 rounded-2xl border border-green-200 bg-green-50/90 px-4 py-3 text-sm font-medium text-green-800"
          >
            You’re saving {formatInr(totalSavings)} on this order
            {discount > 0 && lineCompareSavings > 0
              ? ` (${formatInr(lineCompareSavings)} product + ${formatInr(discount)} coupon)`
              : discount > 0
                ? " with your coupon"
                : ""}
            .
          </p>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => {
              const lineTotal = item.price * item.quantity;
              const unitSave =
                item.originalPrice > item.price ? item.originalPrice - item.price : 0;
              return (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-[var(--radius-card)] border border-green-100 bg-white p-4 shadow-[var(--shadow-soft)]"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className={cn(
                      "relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-cream",
                      focusRing,
                    )}
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain"
                        sizes="80px"
                      />
                    ) : (
                      <ProductImageFallback compact />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.slug}`}
                      className={cn(
                        "block truncate font-semibold text-green-900 hover:text-green-700",
                        focusRing,
                      )}
                    >
                      {item.name}
                    </Link>
                    {item.unit || item.variantName ? (
                      <p className="mt-1 text-sm text-green-700">{item.unit || item.variantName}</p>
                    ) : null}
                    {unitSave > 0 ? (
                      <p className="mt-1 text-xs font-medium text-terra-700">
                        Save {formatInr(unitSave)} each
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div
                        className="inline-flex items-center overflow-hidden rounded-full border border-green-100"
                        role="group"
                        aria-label={`Quantity for ${item.name}`}
                      >
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.name}`}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className={cn(
                            "flex h-11 w-11 items-center justify-center text-green-800 transition-colors hover:bg-green-50",
                            focusRing,
                          )}
                        >
                          <Minus size={14} aria-hidden="true" />
                        </button>
                        <span
                          className="min-w-[2.75rem] border-x border-green-100 px-3 py-2 text-center font-semibold text-green-900"
                          aria-live="polite"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.name}`}
                          disabled={item.quantity >= 10}
                          onClick={() =>
                            updateQuantity(item.id, clampCartQuantity(item.quantity + 1))
                          }
                          className={cn(
                            "flex h-11 w-11 items-center justify-center text-green-800 transition-colors hover:bg-green-50 disabled:opacity-40",
                            focusRing,
                          )}
                        >
                          <Plus size={14} aria-hidden="true" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-green-900">{formatInr(lineTotal)}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => removeItem(item.id)}
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-full text-green-700 transition-colors hover:bg-terra-50 hover:text-terra-700",
                            focusRing,
                          )}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <CartUpsellRail products={upsellProducts} />

            <Link
              href="/products"
              className={cn(
                "inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-green-800 hover:text-terra-700 sm:hidden",
                focusRing,
              )}
            >
              <ShoppingBag size={16} aria-hidden="true" />
              Continue shopping
            </Link>
          </div>

          <div className="lg:col-span-1">
            <div className={cn(surfaceCard, "sticky top-24 p-4 sm:p-6")}>
              <h2 className="mb-4 font-heading text-lg font-bold text-green-900">Order Summary</h2>

              <FreeShippingProgress subtotal={subtotal} className="mb-4" />

              {coupon ? (
                <div className="mb-4 flex items-center justify-between gap-2 rounded-[var(--radius-input)] border border-green-200 bg-green-50 px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-green-800">
                    <Tag size={14} className="shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {coupon.code} — Save {formatInr(coupon.savings)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      removeCoupon();
                      setCouponMsg({ text: "", type: "" });
                    }}
                    className={cn(
                      "shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-green-700 hover:text-terra-700",
                      focusRing,
                    )}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-600">
                    Have a coupon?
                  </p>
                  <div className="flex gap-2">
                    <label htmlFor={couponId} className="sr-only">
                      Coupon code
                    </label>
                    <input
                      id={couponId}
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleApplyCoupon();
                        }
                      }}
                      placeholder="Enter code"
                      disabled={applying}
                      autoComplete="off"
                      enterKeyHint="go"
                      aria-invalid={couponMsg.type === "error"}
                      aria-describedby={couponMsg.text ? `${couponId}-msg` : undefined}
                      className={cn(formControl, "flex-1", focusRing)}
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => void handleApplyCoupon()}
                      disabled={applying || !couponInput.trim()}
                      loading={applying}
                      className="shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                  {couponMsg.text ? (
                    <p
                      id={`${couponId}-msg`}
                      role="status"
                      className={cn(
                        "mt-1.5 text-xs font-medium",
                        couponMsg.type === "success" ? "text-green-700" : "text-terra-700",
                      )}
                    >
                      {couponMsg.text}
                    </p>
                  ) : null}
                </div>
              )}

              <div className="space-y-2 border-t border-green-100 pt-4 text-sm">
                <div className="flex justify-between text-green-700">
                  <span>Subtotal</span>
                  <span>{formatInr(subtotal)}</span>
                </div>
                {discount > 0 ? (
                  <div className="flex justify-between font-medium text-green-800">
                    <span>Coupon discount</span>
                    <span className="text-terra-700">−{formatInr(discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-green-700">
                  <span>GST (incl.)</span>
                  <span>{formatInr(gstAmount)}</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span>Delivery</span>
                  <span className={shippingCharge === 0 ? "font-semibold text-green-800" : ""}>
                    {shippingCharge === 0 ? "FREE" : formatInr(shippingCharge)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t border-green-100 pt-3 text-xl font-black text-green-900">
                  <span>Total</span>
                  <span>{formatInr(total)}</span>
                </div>
              </div>

              <Button asChild variant="primary" size="lg" fullWidth className="mt-6 hidden lg:inline-flex">
                <Link href="/checkout">Proceed to Checkout →</Link>
              </Button>
              <CommerceTrustStrip variant="compact" className="mt-4" />
              <p className="mt-3 text-center text-xs text-green-700">
                Secure checkout powered by Razorpay
              </p>
              {subtotal < FREE_SHIPPING_THRESHOLD && shippingCharge > 0 ? (
                <p className="mt-2 text-center text-xs text-green-700">
                  Standard delivery {formatInr(STANDARD_SHIPPING_FEE)} · Free on{" "}
                  {formatInr(FREE_SHIPPING_THRESHOLD)}+
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="cart-sticky-checkout fixed inset-x-0 bottom-0 z-40 border-t border-green-100 bg-white px-4 py-3 shadow-[0_-8px_32px_rgba(20,60,40,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-green-600">Total</p>
            <p className="truncate font-heading text-lg font-bold text-green-900">{formatInr(total)}</p>
          </div>
          <Button asChild variant="primary" size="lg" className="shrink-0 min-w-[8.5rem] max-[360px]:min-w-[7.5rem] sm:min-w-[10.5rem]">
            <Link href="/checkout">Checkout →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
