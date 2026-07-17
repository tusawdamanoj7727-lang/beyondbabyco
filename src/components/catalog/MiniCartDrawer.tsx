"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";

import CartLineItemRow from "@/components/catalog/CartLineItemRow";
import FreeShippingProgress from "@/components/catalog/FreeShippingProgress";
import { MICROCOPY } from "@/lib/brand/copy";
import Button from "@/components/ui/Button";
import { Mascot } from "@/components/mascots";
import { useCustomerAuth } from "@/lib/auth/customer-hooks";
import { badgeCount, dialogOverlay, drawerPanel, focusRing, iconButton } from "@/lib/design/ui";
import { formatInr } from "@/lib/catalog/format";
import { useCart } from "@/lib/storefront/cart-context";
import { useCartUi } from "@/lib/storefront/cart-ui-context";
import { calcCartGstBreakdown } from "@/lib/storefront/cart-tax";
import { formatGstRateLabel } from "@/lib/catalog/gst-rates";
import { estimateShippingFee } from "@/lib/storefront/shipping";
import { cartLineKey } from "@/lib/storefront/cart-types";
import { cn } from "@/lib/utils";

export default function MiniCartDrawer() {
  const { miniCartOpen, setMiniCartOpen } = useCartUi();
  const {
    items,
    count,
    subtotal,
    appliedCoupon,
    updateQuantity,
    removeItem,
    saveForLater,
  } = useCart();

  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const { isLoggedIn, loading: authLoading } = useCustomerAuth();
  const freeShipping = appliedCoupon?.freeShipping ?? false;
  const shipping = freeShipping ? 0 : estimateShippingFee(subtotal, false);
  const afterDiscount = Math.max(0, subtotal - couponDiscount);
  const gstBreakdown = calcCartGstBreakdown(items, couponDiscount);
  const total = Math.max(0, afterDiscount + shipping);

  return (
    <Dialog.Root open={miniCartOpen} onOpenChange={setMiniCartOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn("fixed inset-0 z-[80]", dialogOverlay)} />
        <Dialog.Content
          aria-label="Shopping cart"
          className={cn(
            drawerPanel,
            "fixed inset-y-0 right-0 z-[90] flex w-full max-w-md flex-col pb-[env(safe-area-inset-bottom)] outline-none",
            "data-[state=closed]:translate-x-full data-[state=open]:translate-x-0",
          )}
        >
          <div className="flex items-center justify-between border-b border-green-100 px-5 py-4">
            <Dialog.Title className="flex items-center gap-2 font-heading text-lg font-bold text-green-900">
              <ShoppingBag className="h-5 w-5 stroke-[2]" aria-hidden="true" />
              Your Cart
              {count > 0 ? <span className={badgeCount}>{count}</span> : null}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Review items in your cart
            </Dialog.Description>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close cart" className={cn(iconButton, focusRing)}>
                <X aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Mascot mascot="bella-bunny" pose="peek" size={120} animated floating alt="" />
                <p className="text-subheading mt-4">{MICROCOPY.cart.miniEmpty}</p>
                <p className="text-body mt-2">Add something lovely for your little one.</p>
                <Button asChild variant="primary" className="mt-6">
                  <Link href="/products" onClick={() => setMiniCartOpen(false)}>
                    Shop Collection
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={cartLineKey(item.productId, item.variantId)}>
                    <CartLineItemRow
                      item={item}
                      compact
                      onUpdateQuantity={(qty) => updateQuantity(item.productId, item.variantId, qty)}
                      onRemove={() => removeItem(item.productId, item.variantId)}
                      onSaveForLater={() => saveForLater(item.productId, item.variantId)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.length > 0 ? (
            <div className="glass-surface border-t border-green-100 px-5 py-4">
              <FreeShippingProgress
                subtotal={subtotal}
                unlocked={freeShipping}
                className="mb-4"
              />
              <div className="mb-4 space-y-1">
                <div className="flex items-center justify-between text-sm text-green-700">
                  <span>Subtotal</span>
                  <span>{formatInr(subtotal)}</span>
                </div>
                {couponDiscount > 0 ? (
                  <div className="flex items-center justify-between text-sm text-green-700">
                    <span>Coupon</span>
                    <span>-{formatInr(couponDiscount)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-sm text-green-700">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatInr(shipping)}</span>
                </div>
                {gstBreakdown.lines.length === 1 ? (
                  <div className="flex items-center justify-between text-sm text-green-700">
                    <span>{formatGstRateLabel(gstBreakdown.lines[0]!.rate)}</span>
                    <span>{formatInr(gstBreakdown.lines[0]!.amount)}</span>
                  </div>
                ) : (
                  gstBreakdown.lines.map((line) => (
                    <div key={line.rate} className="flex items-center justify-between text-sm text-green-700">
                      <span>{formatGstRateLabel(line.rate)}</span>
                      <span>{formatInr(line.amount)}</span>
                    </div>
                  ))
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">Total (MRP incl. taxes)</span>
                  <span className="font-heading text-lg font-bold text-green-900">{formatInr(total)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="primary"
                  fullWidth
                  type="button"
                  onClick={() => {
                    setMiniCartOpen(false);
                    window.location.href = "/checkout";
                  }}
                >
                  Quick Checkout
                </Button>
                {!authLoading && !isLoggedIn ? (
                  <p className="text-center text-xs text-green-700">
                    Guest checkout available —{" "}
                    <Link
                      href="/login?redirectTo=/checkout"
                      className="font-semibold text-terra-600 hover:underline"
                      onClick={() => setMiniCartOpen(false)}
                    >
                      sign in
                    </Link>{" "}
                    to use saved addresses.
                  </p>
                ) : null}
                <Button asChild variant="outline" fullWidth>
                  <Link href="/cart" onClick={() => setMiniCartOpen(false)}>
                    View Full Cart
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={() => setMiniCartOpen(false)}
                  className={cn(
                    "min-h-[44px] text-sm font-medium text-green-700 transition-colors duration-[var(--duration-button)] hover:text-green-900",
                    focusRing,
                  )}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
