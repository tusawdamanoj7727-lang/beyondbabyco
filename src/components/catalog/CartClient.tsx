"use client";

import Link from "next/link";

import CartEmptyState from "@/components/catalog/CartEmptyState";
import CartLineItemRow, { cartLineKey } from "@/components/catalog/CartLineItemRow";
import FreeShippingProgress from "@/components/catalog/FreeShippingProgress";
import OrderSummary from "@/components/catalog/OrderSummary";
import { useCart } from "@/lib/storefront/cart-context";
import { CART_MAX_QUANTITY } from "@/lib/storefront/cart-types";

export default function CartClient() {
  const { items, hydrated, subtotal, updateQuantity, removeItem } = useCart();

  if (!hydrated) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-48 rounded-xl bg-[#2d5a27]/10" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-32 rounded-2xl bg-[#2d5a27]/5" />
              <div className="h-32 rounded-2xl bg-[#2d5a27]/5" />
            </div>
            <div className="h-80 rounded-3xl bg-[#2d5a27]/5" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] bg-[#faf5f0]/40">
        <CartEmptyState />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 pb-16 pt-6">
      <header className="mb-8">
        <h1 className="font-heading text-[clamp(1.75rem,3vw,2.25rem)] font-bold text-[#2d5a27]">
          Your Cart
        </h1>
        <p className="mt-2 text-sm text-[#2d5a27]/70">
          {items.length} item{items.length === 1 ? "" : "s"} · Free shipping on orders ₹999+
        </p>
        <div className="mt-4">
          <FreeShippingProgress subtotal={subtotal} variant="banner" />
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section aria-label="Cart items">
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={cartLineKey(item.productId, item.variantId)}>
                  <CartLineItemRow
                    item={item}
                    onUpdateQuantity={(qty) =>
                      updateQuantity(
                        item.productId,
                        item.variantId,
                        Math.max(1, Math.min(qty, CART_MAX_QUANTITY)),
                      )
                    }
                    onRemove={() => removeItem(item.productId, item.variantId)}
                    showExtras={false}
                  />
                </li>
              ))}
            </ul>
          </section>

          <Link
            href="/products"
            className="mt-6 inline-flex text-sm font-semibold text-[#c4673a] hover:underline"
          >
            ← Continue Shopping
          </Link>
        </div>

        <div className="lg:col-span-1">
          <OrderSummary />
        </div>
      </div>
    </div>
  );
}
