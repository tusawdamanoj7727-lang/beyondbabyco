"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Tag, Trash2 } from "lucide-react";

import ProductImageFallback from "@/components/brand/ProductImageFallback";
import CartEmptyState from "@/components/catalog/CartEmptyState";
import Button from "@/components/ui/Button";
import { formatInr } from "@/lib/catalog/format";
import { applyCouponViaApi } from "@/lib/storefront/cart-coupons";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartHydrated } from "@/lib/store/use-cart-hydrated";
import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
} from "@/lib/storefront/shipping";
import { clampCartQuantity } from "@/lib/storefront/cart-types";
import { cn } from "@/lib/utils";
import { focusRing } from "@/lib/design/ui";

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

export default function CartPageClient() {
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
        });
        setCouponMsg({
          text: `Coupon applied! You save ${formatInr(data.savings)}`,
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
        <CartEmptyState />
      </div>
    );
  }

  const toFreeShip = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shipProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="min-h-screen bg-brand-cream py-8">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="mb-8 font-heading text-3xl font-black text-brand-forest">
          My Cart{" "}
          <span className="text-lg font-medium text-gray-500">({itemCount} items)</span>
        </h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-[var(--radius-card)] bg-white p-4 shadow-sm">
                <Link
                  href={`/products/${item.slug}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-cream"
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
                    className="truncate font-semibold text-gray-900 hover:text-brand-forest"
                  >
                    {item.name}
                  </Link>
                  {(item.unit || item.variantName) ? (
                    <p className="mt-1 text-sm text-gray-500">{item.unit || item.variantName}</p>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center overflow-hidden rounded-xl border border-gray-200">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-gray-50"
                      >
                        <Minus size={14} aria-hidden="true" />
                      </button>
                      <span className="border-x border-gray-200 px-4 py-2 font-semibold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={item.quantity >= 10}
                        onClick={() => updateQuantity(item.variantId, clampCartQuantity(item.quantity + 1))}
                        className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-gray-50 disabled:opacity-40"
                      >
                        <Plus size={14} aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-brand-forest">
                        {formatInr(item.price * item.quantity)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeItem(item.variantId)}
                        className="flex h-11 w-11 items-center justify-center text-gray-600 transition-colors hover:text-red-700"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Link
              href="/products"
              className="flex items-center gap-2 text-sm font-medium text-brand-forest hover:underline"
            >
              <ShoppingBag size={16} />
              Continue Shopping
            </Link>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-[var(--radius-card)] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Order Summary</h2>

              <div className="mb-4">
                {toFreeShip > 0 ? (
                  <p className="mb-2 text-sm text-gray-600">
                    Add <span className="font-bold text-brand-forest">{formatInr(toFreeShip)}</span> more
                    for FREE delivery!
                  </p>
                ) : (
                  <p className="mb-2 text-sm font-semibold text-green-600">🎉 You get FREE delivery!</p>
                )}
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-brand-forest transition-all duration-500 motion-safe:transition-all"
                    style={{ width: `${shipProgress}%` }}
                  />
                </div>
              </div>

              {coupon ? (
                <div className="mb-4 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-green-700">
                    <Tag size={14} />
                    {coupon.code} — Save {formatInr(coupon.savings)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      removeCoupon();
                      setCouponMsg({ text: "", type: "" });
                    }}
                    className="text-xs font-medium text-gray-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="mb-4">
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
                      placeholder="Coupon code"
                      disabled={applying}
                      autoComplete="off"
                      enterKeyHint="go"
                      className={cn(
                        "min-h-11 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-base",
                        focusRing,
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => void handleApplyCoupon()}
                      disabled={applying || !couponInput.trim()}
                      className={cn(
                        "min-h-11 rounded-xl bg-brand-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60",
                        focusRing,
                      )}
                      aria-busy={applying}
                    >
                      {applying ? "Applying…" : "Apply"}
                    </button>
                  </div>
                  {couponMsg.text ? (
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        couponMsg.type === "success" ? "text-green-600" : "text-red-700",
                      )}
                    >
                      {couponMsg.text}
                    </p>
                  ) : null}
                </div>
              )}

              <div className="space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatInr(subtotal)}</span>
                </div>
                {discount > 0 ? (
                  <div className="flex justify-between font-medium text-green-600">
                    <span>Discount</span>
                    <span>-{formatInr(discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-gray-600">
                  <span>GST (incl.)</span>
                  <span>{formatInr(gstAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className={shippingCharge === 0 ? "font-medium text-green-600" : ""}>
                    {shippingCharge === 0 ? "FREE" : formatInr(shippingCharge)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t pt-3 text-xl font-black text-brand-forest">
                  <span>Total</span>
                  <span>{formatInr(total)}</span>
                </div>
              </div>

              <Button asChild variant="primary" size="lg" fullWidth className="mt-6">
                <Link href="/checkout">Proceed to Checkout →</Link>
              </Button>
              <p className="mt-3 text-center text-xs text-gray-600">
                🔒 Secure checkout powered by Razorpay
              </p>
              {subtotal < FREE_SHIPPING_THRESHOLD && shippingCharge > 0 ? (
                <p className="mt-2 text-center text-xs text-gray-600">
                  Standard delivery {formatInr(STANDARD_SHIPPING_FEE)} · Free on{" "}
                  {formatInr(FREE_SHIPPING_THRESHOLD)}+
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
