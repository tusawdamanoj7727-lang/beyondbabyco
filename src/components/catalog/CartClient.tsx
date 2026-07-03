"use client";

import Link from "next/link";

import { MICROCOPY } from "@/lib/brand/copy";
import CartLineItemRow, { cartLineKey } from "@/components/catalog/CartLineItemRow";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import OrderSummary from "@/components/catalog/OrderSummary";
import { useCart } from "@/lib/storefront/cart-context";

export default function CartClient() {
  const { items, savedItems, updateQuantity, removeItem, saveForLater, moveSavedToCart, removeSaved } =
    useCart();

  if (items.length === 0 && savedItems.length === 0) {
    return (
      <CatalogEmptyState
        title={MICROCOPY.cart.emptyTitle}
        description={MICROCOPY.cart.emptyDescription}
        actionLabel={MICROCOPY.cart.shopCta}
        actionHref="/products"
        mascot="bella-bunny"
      />
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 pb-16">
      <header className="mb-8">
        <h1 className="text-h1">{MICROCOPY.cart.pageTitle}</h1>
        <p className="mt-2 text-green-700/70">
          {items.length} item{items.length === 1 ? "" : "s"} in your cart
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          {items.length > 0 ? (
            <section aria-label="Cart items">
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={cartLineKey(item.productId, item.variantId)}>
                    <CartLineItemRow
                      item={item}
                      onUpdateQuantity={(qty) => updateQuantity(item.productId, item.variantId, qty)}
                      onRemove={() => removeItem(item.productId, item.variantId)}
                      onSaveForLater={() => saveForLater(item.productId, item.variantId)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <div className="rounded-3xl border border-dashed border-green-200 bg-white/60 p-8 text-center">
              <p className="text-green-700/80">No items in your cart right now.</p>
              <Link href="/products" className="mt-4 inline-block text-sm font-semibold text-terra-600 hover:underline">
                Continue shopping
              </Link>
            </div>
          )}

          {savedItems.length > 0 ? (
            <section aria-label="Saved for later" className="mt-10">
              <h2 className="font-heading text-xl font-bold text-green-900">Saved for later</h2>
              <ul className="mt-4 space-y-4">
                {savedItems.map((item) => (
                  <li
                    key={cartLineKey(item.productId, item.variantId)}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-green-100/80 bg-white/70 p-4"
                  >
                    <div>
                      <p className="font-heading font-semibold text-green-900">{item.name}</p>
                      {item.variantName ? (
                        <p className="text-sm text-green-700/70">{item.variantName}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => moveSavedToCart(item.productId, item.variantId)}
                        className="rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-cream-50 hover:bg-green-600"
                      >
                        Move to cart
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSaved(item.productId, item.variantId)}
                        className="rounded-full border border-green-200 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-50"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {items.length > 0 ? (
          <OrderSummary />
        ) : null}
      </div>
    </div>
  );
}
