"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Heart, Minus, Plus, ShoppingBag } from "lucide-react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import CommerceTrustStrip from "@/components/catalog/CommerceTrustStrip";
import PricingTaxNote from "@/components/catalog/PricingTaxNote";
import StarRating from "@/components/catalog/StarRating";
import { useToast } from "@/components/ui/ToastProvider";
import { useNotifyMe } from "@/lib/homepage/notify-me-context";
import { formatInr } from "@/lib/catalog/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/storefront/shipping";
import type { StorefrontProductDetail } from "@/lib/catalog/types";
import { useCartOptional } from "@/lib/storefront/cart-context";
import { useCartUiOptional } from "@/lib/storefront/cart-ui-context";
import { useWishlist } from "@/lib/storefront/wishlist-context";
import { ctaHeight, focusRing, wishlistButton } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

export default function ProductPurchasePanel({ product }: { product: StorefrontProductDetail }) {
  const cart = useCartOptional();
  const cartUi = useCartUiOptional();
  const toast = useToast();
  const { openNotifyMe } = useNotifyMe();
  const { isWishlisted, toggle } = useWishlist();
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants[0]?.id ?? null,
  );

  const wishlisted = isWishlisted(product.id);
  const isComingSoon = product.status === "coming_soon";
  const canBuy = product.status === "active" && product.inStock;
  const showRating = product.ratingCount > 0;
  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0] ?? null;
  const variantId = selectedVariant?.id ?? null;
  const maxQty = Math.max(product.stock, 1);
  const displaySku = selectedVariant?.sku ?? product.sku;

  function addToCart() {
    if (!canBuy) return;
    cart?.addItem(product, variantId, qty, selectedVariant?.name ?? null);
    cartUi?.openMiniCart();
    toast.success("Added to cart");
  }

  function buyNow() {
    if (!canBuy) return;
    cart?.addItem(product, variantId, qty, selectedVariant?.name ?? null);
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
          {!isComingSoon && canBuy ? <PricingTaxNote className="mt-2" /> : null}
          <p className={cn("mt-3 text-sm font-semibold", isComingSoon ? "text-terra-600" : product.inStock ? "text-green-700" : "text-terra-600")}>
            {isComingSoon
              ? "Research complete — be first to know when we launch."
              : product.inStock
                ? `${product.stock} in stock · ready to ship`
                : "Currently out of stock"}
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
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-green-900">Quantity</span>
            <div className="pdp-qty-control">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span>{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty}
                className="disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          {isComingSoon ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              type="button"
              className={cn(ctaHeight, "text-base font-semibold")}
              onClick={() => openNotifyMe(product.name, product.categoryName ?? undefined)}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              Notify Me
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!canBuy}
                onClick={addToCart}
                className={cn(ctaHeight, "flex-1 text-base font-semibold shadow-[var(--shadow-soft)]")}
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                Add to Cart
              </Button>
              <Button
                variant="cta"
                size="lg"
                fullWidth
                disabled={!canBuy}
                onClick={buyNow}
                className={cn(ctaHeight, "flex-1 text-base font-semibold")}
              >
                Buy Now
              </Button>
            </>
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
              "w-[3.25rem] shrink-0 rounded-3xl transition-transform duration-[var(--duration-button)] motion-safe:hover:scale-[1.03]",
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
        <div className="pdp-sticky-bar lg:hidden">
          <div className="container flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-base font-bold text-green-900">{formatInr(product.effectivePrice)}</p>
              <p className="text-xs text-green-700/70">In stock · ready to ship</p>
            </div>
            <Button
              variant="primary"
              size="lg"
              type="button"
              onClick={addToCart}
              className={cn(ctaHeight, "min-w-[9.5rem] px-6 text-base font-semibold")}
            >
              Add to Cart
            </Button>
          </div>
        </div>
      ) : isComingSoon ? (
        <div className="pdp-sticky-bar lg:hidden">
          <div className="container">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              type="button"
              className={cn(ctaHeight, "text-base font-semibold")}
              onClick={() => openNotifyMe(product.name, product.categoryName ?? undefined)}
            >
              Notify Me — Launching 2026
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
