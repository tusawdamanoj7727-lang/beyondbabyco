"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Heart, ShoppingBag } from "lucide-react";

import Badge from "@/components/ui/Badge";
import CommerceTrustStrip from "@/components/catalog/CommerceTrustStrip";
import PricingTaxNote from "@/components/catalog/PricingTaxNote";
import QuantitySelector from "@/components/catalog/QuantitySelector";
import StarRating from "@/components/catalog/StarRating";
import { useToast } from "@/components/ui/ToastProvider";
import { canPurchaseVariant, shouldShowNotifyMe } from "@/lib/catalog/availability";
import { buildProductNotifyTarget, notifyMeButtonLabel } from "@/lib/notify-me/target";
import { useNotifyMe } from "@/lib/homepage/notify-me-context";
import { formatInr } from "@/lib/catalog/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/storefront/shipping";
import type { StorefrontProductDetail } from "@/lib/catalog/types";
import { CART_MAX_QUANTITY } from "@/lib/storefront/cart-types";
import { buildCartItemInput, legacyVariantKey } from "@/lib/store/cart-mappers";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartUiOptional } from "@/lib/storefront/cart-ui-context";
import { useWishlist } from "@/lib/storefront/wishlist-context";
import { ctaHeight, focusRing, wishlistButton } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

export default function ProductPurchasePanel({ product }: { product: StorefrontProductDetail }) {
  const addStoreItem = useCartStore((s) => s.addItem);
  const updateStoreQuantity = useCartStore((s) => s.updateQuantity);
  const cartUi = useCartUiOptional();
  const toast = useToast();
  const { openNotifyMe } = useNotifyMe();
  const { isWishlisted, toggle } = useWishlist();
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants[0]?.id ?? null,
  );
  const [variantStock, setVariantStock] = useState<Map<string, number>>(
    () => new Map(product.variants.map((v) => [v.id, v.stockQuantity])),
  );

  useEffect(() => {
    let cancelled = false;

    async function refreshStock() {
      try {
        const res = await fetch(`/api/inventory/product/${product.id}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          variants?: { variantId: string; available: number }[];
        };
        if (!data.variants || cancelled) return;
        setVariantStock(new Map(data.variants.map((v) => [v.variantId, v.available])));
      } catch {
        // Keep server-rendered stock on network failure.
      }
    }

    void refreshStock();
    return () => {
      cancelled = true;
    };
  }, [product.id, selectedVariantId]);

  const wishlisted = isWishlisted(product.id);
  const isComingSoon = product.status === "coming_soon";
  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0] ?? null;
  const variantId = selectedVariant?.id ?? null;
  const selectedStock = selectedVariant ? (variantStock.get(selectedVariant.id) ?? 0) : 0;
  const canBuy = canPurchaseVariant(product, selectedStock);
  const notifyMe = shouldShowNotifyMe({ ...product, inStock: canBuy });
  const notifyTarget = buildProductNotifyTarget(product);
  const notifyLabel = notifyMeButtonLabel(notifyTarget.mode, product.status);
  const showRating = product.ratingCount > 0;
  const maxQty = Math.min(CART_MAX_QUANTITY, Math.max(selectedStock, 1));
  const displaySku = selectedVariant?.sku ?? product.sku;

  function addToCart() {
    if (!canBuy) {
      toast.warning("This item is out of stock");
      return;
    }
    const input = buildCartItemInput(product, {
      variantId,
      variantName: selectedVariant?.name ?? null,
    });
    addStoreItem(input);
    if (qty > 1) {
      updateStoreQuantity(legacyVariantKey(variantId), Math.min(qty, maxQty));
    }
    cartUi?.openMiniCart();
    toast.success("Added to cart!");
  }

  function buyNow() {
    if (!canBuy) {
      toast.warning("This item is out of stock");
      return;
    }
    addToCart();
    window.location.href = "/cart";
  }

  function handleWishlist() {
    startTransition(async () => {
      const result = await toggle(product.id);
      if (!result.ok && result.error) toast.error(result.error);
      else toast.success(wishlisted ? "Removed from wishlist" : "Saved to wishlist");
    });
  }

  const primaryBadge =
    product.badge ??
    (isComingSoon ? "Launching 2026" : product.status === "active" ? "Available Now" : null);

  return (
    <>
      <div className="pdp-purchase-panel lg:sticky lg:top-32 lg:self-start">
        <div className="flex flex-wrap items-center gap-2">
          {primaryBadge ? (
            <Badge variant={isComingSoon ? "comingSoon" : "success"} size="md">
              {primaryBadge}
            </Badge>
          ) : null}
          <Badge variant="info" size="sm">
            {isComingSoon ? "Research Complete" : "Research Backed"}
          </Badge>
        </div>

        <div>
          {product.brandName && product.brandSlug ? (
            <Link
              href={`/products?brand=${encodeURIComponent(product.brandSlug)}`}
              className="text-xs font-semibold uppercase tracking-[0.16em] text-green-600 hover:text-terra-600 hover:underline"
            >
              {product.brandName}
            </Link>
          ) : product.brandName ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-600">{product.brandName}</p>
          ) : null}
          <h1 className="pdp-product-title mt-2">{product.name}</h1>
          {product.shortDescription ? (
            <p className="mt-4 max-w-prose text-base leading-[1.75] text-green-700/90">{product.shortDescription}</p>
          ) : null}
          {displaySku ? (
            <p className="pdp-product-sku mt-3">SKU · {displaySku}</p>
          ) : null}
        </div>

        {showRating ? (
          <StarRating rating={product.ratingAvg} count={product.ratingCount} size="md" />
        ) : null}

        <hr className="pdp-purchase-divider" />

        <div>
          <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
            <span className="pdp-product-price">
              {isComingSoon ? "Launching 2026" : formatInr(product.effectivePrice)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.effectivePrice && canBuy ? (
              <span className="text-lg text-green-700/55 line-through">{formatInr(product.compareAtPrice)}</span>
            ) : null}
            {product.discountPercent && product.compareAtPrice && canBuy ? (
              <span className="rounded-full bg-terra-100 px-3 py-1 text-sm font-bold text-terra-700">
                Save {product.discountPercent}%
              </span>
            ) : null}
          </div>
          {!isComingSoon && canBuy ? (
            <PricingTaxNote className="mt-2" gstRate={product.gstRate} showMrpLabel />
          ) : null}
          <p className={cn("mt-3 text-sm font-semibold", isComingSoon ? "text-terra-600" : canBuy ? "text-green-700" : "text-terra-600")}>
            {isComingSoon
              ? "Research complete — be first to know when we launch."
              : canBuy
                ? `${product.stock} in stock · ready to ship`
                : "Join the waitlist — we'll notify you when it's available."}
          </p>
        </div>

        {product.variants.length > 1 && !isComingSoon ? (
          <fieldset>
            <legend className="mb-3 text-sm font-semibold tracking-[-0.01em] text-green-900">Choose variant</legend>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  aria-pressed={selectedVariantId === variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={cn(
                    "inline-flex min-h-[3.25rem] items-center rounded-full border px-5 text-sm font-semibold transition duration-[var(--duration-button)] ease-[var(--ease-out)]",
                    selectedVariantId === variant.id
                      ? "border-green-600 bg-green-600 text-cream-50 shadow-[var(--shadow-soft)]"
                      : "border-cream-300 bg-white text-green-800 hover:border-green-300",
                    focusRing,
                  )}
                >
                  {variant.name}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {!isComingSoon ? (
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold text-green-900">Quantity</span>
            <QuantitySelector
              value={qty}
              min={1}
              max={Math.min(maxQty, CART_MAX_QUANTITY)}
              onChange={setQty}
              disabled={!canBuy}
              variant="pill"
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          {notifyMe ? (
            <button
              type="button"
              onClick={() => openNotifyMe(notifyTarget)}
              className={cn(
                "hidden w-full items-center justify-center gap-2 rounded-xl border border-green-300 py-4 text-base font-semibold text-green-800 transition hover:bg-green-50 md:inline-flex",
                focusRing,
              )}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {notifyLabel}
            </button>
          ) : (
            <div className="hidden w-full flex-col gap-3 md:flex">
              <button
                type="button"
                disabled={!canBuy}
                onClick={addToCart}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d5a27] py-4 text-lg font-semibold text-white transition hover:bg-[#234a20] disabled:cursor-not-allowed disabled:opacity-50",
                  focusRing,
                )}
              >
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                Add to Cart
              </button>
              <button
                type="button"
                disabled={!canBuy}
                onClick={buyNow}
                className={cn(
                  "w-full rounded-xl border-2 border-[#2d5a27] py-4 text-lg font-semibold text-[#2d5a27] transition hover:bg-[#2d5a27]/5 disabled:cursor-not-allowed disabled:opacity-50",
                  focusRing,
                )}
              >
                Buy Now
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={handleWishlist}
            disabled={pending}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
            className={cn(
              wishlistButton(wishlisted),
              ctaHeight,
              "w-[3.25rem] shrink-0 self-start rounded-3xl transition-transform duration-[var(--duration-button)] motion-safe:hover:scale-[1.03]",
              focusRing,
            )}
          >
            <Heart className={cn("h-5 w-5", wishlisted && "fill-current")} />
          </button>
        </div>

        <CommerceTrustStrip variant="panel" />

        <p className="text-xs leading-[1.7] text-green-700/75">
          Secure checkout with Razorpay &amp; COD. Free shipping on orders over {formatInr(FREE_SHIPPING_THRESHOLD)}.{" "}
          <Link href="/trust-center" className="font-semibold text-terra-600 hover:underline">
            Trust center
          </Link>
        </p>
      </div>

      {!isComingSoon && canBuy ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-3 shadow-lg md:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-1">
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-base font-bold text-[#2d5a27]">
                {formatInr(product.effectivePrice)}
              </p>
              <p className="text-xs text-gray-500">In stock · ready to ship</p>
            </div>
            <button
              type="button"
              onClick={addToCart}
              className={cn(
                "shrink-0 rounded-xl bg-[#2d5a27] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234a20]",
                focusRing,
              )}
            >
              Add to Cart
            </button>
          </div>
        </div>
      ) : notifyMe ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-3 shadow-lg md:hidden">
          <div className="mx-auto max-w-7xl px-1">
            <button
              type="button"
              onClick={() => openNotifyMe(notifyTarget)}
              className={cn(
                "w-full rounded-xl border border-green-300 py-3.5 text-base font-semibold text-green-800 transition hover:bg-green-50",
                focusRing,
              )}
            >
              {notifyLabel}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
