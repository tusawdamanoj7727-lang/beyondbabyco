"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Minus, Plus, Trash2, X } from "lucide-react";

import ProductImageFallback from "@/components/brand/ProductImageFallback";
import { useToast } from "@/components/ui/ToastProvider";
import { formatInr } from "@/lib/catalog/format";
import { INDIAN_STATES } from "@/lib/checkout/schema";
import { brandWhatsAppNumber } from "@/lib/brand/contact";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartHydrated } from "@/lib/store/use-cart-hydrated";
import {
  calculateGSTFromCart,
  gstDisplayLines,
  SELLER_STATE,
  type GstLineItem,
} from "@/lib/utils/gst";
import { cn } from "@/lib/utils";

const FOREST = "#2d5a27";
const CREAM = "#faf5f0";
const TERRACOTTA = "#c4673a";
const FREE_SHIPPING_THRESHOLD = 999;
const BELLA_EMPTY = "/mascots/bella/bella-01-default.webp";

function CartSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl animate-pulse px-4 py-10">
      <div className="h-9 w-56 rounded-lg bg-[#2d5a27]/10" />
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-32 rounded-2xl bg-[#2d5a27]/5" />
          <div className="h-32 rounded-2xl bg-[#2d5a27]/5" />
        </div>
        <div className="h-96 rounded-2xl bg-[#2d5a27]/5" />
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative h-[300px] w-[300px]">
        <Image
          src={BELLA_EMPTY}
          alt="Bella Bunny"
          fill
          className="object-contain"
          sizes="300px"
          priority
        />
      </div>
      <h1 className="mt-6 font-heading text-2xl font-bold text-[#2d5a27]">Your cart is empty</h1>
      <p className="mt-2 text-base text-gray-600">Looks like you haven&apos;t added anything yet.</p>
      <Link
        href="/products"
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#2d5a27] px-8 py-3.5 text-base font-semibold text-white transition hover:bg-[#234a20]"
      >
        Shop Now
      </Link>
    </div>
  );
}

function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const qualified = subtotal >= FREE_SHIPPING_THRESHOLD;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div className="mb-4">
      <p className={cn("text-sm font-medium", qualified ? "text-[#2d5a27]" : "text-gray-600")}>
        {qualified
          ? "🎉 You've got FREE delivery!"
          : `Add ${formatInr(remaining)} more for FREE delivery!`}
      </p>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn("h-full rounded-full transition-all duration-500", qualified ? "bg-[#2d5a27]" : "bg-[#2d5a27]")}
          style={{ width: `${qualified ? 100 : pct}%` }}
        />
      </div>
    </div>
  );
}

export default function CartPageClient() {
  const hydrated = useCartHydrated();
  const toast = useToast();

  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);

  const itemCount = useCartStore((s) => s.itemCount());
  const subtotal = useCartStore((s) => s.subtotal());
  const discount = useCartStore((s) => s.discount());
  const shippingCharge = useCartStore((s) => s.shippingCharge());

  const [buyerState, setBuyerState] = useState(SELLER_STATE);
  const [couponInput, setCouponInput] = useState("");
  const [applying, setApplying] = useState(false);

  const gstLineItems: GstLineItem[] = items.map((i) => ({
    price: i.price,
    quantity: i.quantity,
    gstRate: i.gstRate,
  }));
  const gstBreakdown = calculateGSTFromCart(gstLineItems, buyerState, discount);
  const gstLines = gstDisplayLines(gstBreakdown, gstLineItems);
  const afterDiscount = Math.max(0, subtotal - discount);
  const orderTotal = afterDiscount + gstBreakdown.total + shippingCharge;

  if (!hydrated) return <CartSkeleton />;

  if (items.length === 0) return <EmptyCart />;

  async function handleApplyCoupon() {
    setApplying(true);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, cartTotal: subtotal }),
      });

      const data = (await res.json()) as {
        valid: boolean;
        error?: string;
        message?: string;
        code?: string;
        discountType?: "percent" | "flat";
        discountValue?: number;
        savings?: number;
      };

      if (data.valid && data.code && data.discountType != null && data.discountValue != null && data.savings != null) {
        applyCoupon({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          savings: data.savings,
        });
        toast.success(`${data.code} applied! Saved ${formatInr(data.savings)}`);
        setCouponInput("");
      } else {
        toast.error(data.error ?? "Invalid coupon code");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setApplying(false);
    }
  }

  function handleRemoveCoupon() {
    removeCoupon();
  }

  function handleCheckout() {
    const wa = brandWhatsAppNumber();
    toast.info(`Checkout coming soon! WhatsApp us: wa.me/${wa}`);
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 font-[family-name:var(--font-montserrat,sans-serif)] lg:py-10">
      <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
        {/* Left — cart items */}
        <div className="lg:col-span-2">
          <h1 className="font-heading text-2xl font-bold text-[#2d5a27] md:text-3xl">
            Your cart ({itemCount} {itemCount === 1 ? "item" : "items"})
          </h1>

          <ul className="mt-6 space-y-4">
            {items.map((item) => {
              const lineTotal = item.price * item.quantity;
              const discounted = item.originalPrice > item.price;

              return (
                <li
                  key={item.id}
                  className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#faf5f0]"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <ProductImageFallback compact />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/products/${item.slug}`}
                          className="font-medium text-gray-900 hover:text-[#2d5a27]"
                        >
                          {item.name}
                        </Link>
                        {item.variantName ? (
                          <p className="mt-0.5 text-sm text-gray-500">{item.variantName}</p>
                        ) : null}
                        <div className="mt-1 flex flex-wrap items-baseline gap-2">
                          <span className="font-semibold text-gray-900">{formatInr(item.price)}</span>
                          {discounted ? (
                            <span className="text-sm text-gray-400 line-through">
                              {formatInr(item.originalPrice)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <p className="font-heading text-lg font-bold text-[#2d5a27]">
                        {formatInr(lineTotal)}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={item.quantity <= 1}
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="flex h-9 w-9 items-center justify-center text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={item.quantity >= 10}
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="flex h-9 w-9 items-center justify-center text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeItem(item.variantId)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <Link
            href="/products"
            className="mt-6 inline-flex text-sm font-semibold transition hover:underline"
            style={{ color: TERRACOTTA }}
          >
            ← Continue Shopping
          </Link>
        </div>

        {/* Right — order summary */}
        <div className="lg:col-span-1">
          <aside
            className="sticky top-24 rounded-2xl border border-gray-200 p-6"
            style={{ backgroundColor: CREAM }}
          >
            <h2 className="font-heading text-lg font-bold text-[#2d5a27]">Order Summary</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-gray-700">
                <dt>Subtotal</dt>
                <dd className="font-medium">{formatInr(subtotal)}</dd>
              </div>

              {coupon && discount > 0 ? (
                <div className="flex justify-between text-green-700">
                  <dt>Discount ({coupon.code})</dt>
                  <dd className="font-medium">−{formatInr(discount)}</dd>
                </div>
              ) : null}

              {gstLines.map((line) => (
                <div key={line.label} className="flex justify-between text-gray-700">
                  <dt>{line.label}</dt>
                  <dd className="font-medium">{formatInr(line.amount)}</dd>
                </div>
              ))}

              <div className="flex justify-between text-gray-700">
                <dt>Delivery</dt>
                <dd className={cn("font-medium", shippingCharge === 0 && "text-green-700")}>
                  {shippingCharge === 0 ? "FREE" : formatInr(shippingCharge)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-gray-200 pt-4">
              <label htmlFor="cart-gst-state" className="text-xs font-semibold text-gray-600">
                Delivery state (for GST estimate)
              </label>
              <select
                id="cart-gst-state"
                value={buyerState}
                onChange={(e) => setBuyerState(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800"
              >
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            {/* Coupon */}
            <div className="mt-5 border-t border-gray-200 pt-5">
              {coupon ? (
                <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
                    <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {coupon.code}
                  </div>
                  <button
                    type="button"
                    aria-label="Remove coupon"
                    onClick={handleRemoveCoupon}
                    className="rounded-full p-1 text-green-700 transition hover:bg-green-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Enter coupon code"
                      disabled={applying}
                      className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2d5a27] focus:ring-2 focus:ring-[#2d5a27]/20"
                    />
                    <button
                      type="button"
                      onClick={() => void handleApplyCoupon()}
                      disabled={applying || !couponInput.trim()}
                      className="shrink-0 rounded-xl border border-[#2d5a27] bg-white px-4 py-2.5 text-sm font-semibold text-[#2d5a27] transition hover:bg-[#2d5a27]/5 disabled:opacity-50"
                    >
                      {applying ? "Applying…" : "Apply"}
                    </button>
                  </div>
                </>
              )}
            </div>

            <FreeShippingBar subtotal={subtotal} />

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-semibold text-gray-800">TOTAL</span>
                <span className="font-heading text-2xl font-bold" style={{ color: FOREST }}>
                  {formatInr(orderTotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="mt-6 w-full rounded-xl py-4 text-lg font-semibold text-white transition hover:opacity-95"
              style={{ backgroundColor: FOREST }}
            >
              Proceed to Checkout →
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
