"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import CommerceTrustStrip from "@/components/catalog/CommerceTrustStrip";
import HomepageMascotGuide from "@/components/mascots/HomepageMascotGuide";
import PdpDeliveryEstimator from "@/components/catalog/PdpDeliveryEstimator";
import PricingTaxNote from "@/components/catalog/PricingTaxNote";
import QuantitySelector from "@/components/catalog/QuantitySelector";
import StarRating from "@/components/catalog/StarRating";
import { useToast } from "@/components/ui/ToastProvider";
import { canPurchaseVariant } from "@/lib/catalog/availability";
import { buildProductNotifyTarget, notifyMeButtonLabel } from "@/lib/notify-me/target";
import { useNotifyMe } from "@/lib/homepage/notify-me-context";
import { formatInr } from "@/lib/catalog/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/storefront/shipping";
import type { StorefrontProductDetail, StorefrontVariant } from "@/lib/catalog/types";
import { CART_MAX_QUANTITY } from "@/lib/storefront/cart-types";
import { buildCartItemInput, legacyVariantKey } from "@/lib/store/cart-mappers";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartUiOptional } from "@/lib/storefront/cart-ui-context";
import { useWishlist } from "@/lib/storefront/wishlist-context";
import { ctaHeight, focusRing, productPrice, textCaption, wishlistButton } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

function variantAvailableStock(
  variant: StorefrontVariant,
  stockMap: Map<string, number>,
): number {
  return stockMap.get(variant.id) ?? variant.stockQuantity;
}

function variantInStock(
  product: StorefrontProductDetail,
  variant: StorefrontVariant,
  stockMap: Map<string, number>,
): boolean {
  return canPurchaseVariant(product, variantAvailableStock(variant, stockMap));
}

function jumpToReviews() {
  if (typeof window === "undefined") return;
  window.location.hash = "reviews";
  const tab = document.getElementById("tab-Reviews");
  tab?.click();
  tab?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function ProductPurchasePanel({ product }: { product: StorefrontProductDetail }) {
  const addStoreItem = useCartStore((s) => s.addItem);
  const updateStoreQuantity = useCartStore((s) => s.updateQuantity);
  const cartUi = useCartUiOptional();
  const toast = useToast();
  const { openNotifyMe } = useNotifyMe();
  const { isWishlisted, toggle } = useWishlist();
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const [selectedVariant, setSelectedVariant] = useState<StorefrontVariant | null>(
    product.variants[0] ?? null,
  );
  const [variantStock, setVariantStock] = useState<Map<string, number>>(
    () => new Map(product.variants.map((v) => [v.id, v.stockQuantity])),
  );
  const [showStickyBar, setShowStickyBar] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId = 0;
    let idleId = 0;

    async function refreshStock() {
      try {
        const res = await fetch(`/api/inventory/product/${product.id}`);
        if (!res.ok || cancelled) return;
        const body = (await res.json()) as {
          ok?: boolean;
          data?: { variants?: { variantId: string; available: number }[] };
        };
        if (!body.ok || !body.data?.variants || cancelled) return;
        setVariantStock(new Map(body.data.variants.map((v) => [v.variantId, v.available])));
      } catch {
        // Keep server-rendered stock on network failure.
      }
    }

    const g = globalThis as typeof globalThis & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof g.requestIdleCallback === "function") {
      idleId = g.requestIdleCallback(() => void refreshStock(), { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(() => void refreshStock(), 1500);
    }

    return () => {
      cancelled = true;
      if (idleId && typeof g.cancelIdleCallback === "function") g.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [product.id]);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry?.isIntersecting);
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const variantsWithStock = useMemo(
    () =>
      product.variants.map((variant) => ({
        ...variant,
        inStock: variantInStock(product, variant, variantStock),
      })),
    [product, variantStock],
  );

  const activeVariant = selectedVariant ?? product.variants[0] ?? null;
  const variantId = activeVariant?.id ?? null;
  const selectedStock = activeVariant ? variantAvailableStock(activeVariant, variantStock) : 0;
  const selectedInStock = activeVariant
    ? variantInStock(product, activeVariant, variantStock)
    : product.inStock;

  const isComingSoon = product.status === "coming_soon";
  const notifyTarget = buildProductNotifyTarget(product);
  const notifyLabel = notifyMeButtonLabel(notifyTarget.mode, product.status);

  const displayPrice = activeVariant?.price ?? product.effectivePrice;
  const displayCompare = activeVariant?.compareAtPrice ?? product.compareAtPrice;
  const showCompare =
    displayCompare != null && displayCompare > displayPrice && selectedInStock;

  const wishlisted = isWishlisted(product.id);
  const showRating = product.ratingCount > 0;
  const maxQty = Math.min(CART_MAX_QUANTITY, Math.max(selectedStock, 1));
  const displaySku = activeVariant?.sku ?? product.sku;

  function addToCart() {
    if (!selectedInStock || pending) return;

    startTransition(() => {
      const input = buildCartItemInput(
        {
          ...product,
          price: displayPrice,
          effectivePrice: displayPrice,
          compareAtPrice: displayCompare ?? displayPrice,
        },
        {
          variantId,
          variantName: activeVariant?.name ?? null,
        },
      );
      addStoreItem(input);
      if (qty > 1) {
        updateStoreQuantity(legacyVariantKey(variantId), Math.min(qty, maxQty));
      }
      cartUi?.openMiniCart();
      toast.success("Added to cart!");
    });
  }

  function buyNow() {
    if (!selectedInStock || pending) return;

    startTransition(() => {
      const input = buildCartItemInput(
        {
          ...product,
          price: displayPrice,
          effectivePrice: displayPrice,
          compareAtPrice: displayCompare ?? displayPrice,
        },
        {
          variantId,
          variantName: activeVariant?.name ?? null,
        },
      );
      addStoreItem(input);
      if (qty > 1) {
        updateStoreQuantity(legacyVariantKey(variantId), Math.min(qty, maxQty));
      }
      window.location.href = "/checkout";
    });
  }

  function handleNotifyMe() {
    openNotifyMe(notifyTarget);
  }

  function handleWishlist() {
    startTransition(async () => {
      const result = await toggle(product.id);
      if (!result.ok && result.error) toast.error(result.error);
      else toast.success(wishlisted ? "Removed from wishlist" : "Saved to wishlist");
    });
  }

  const primaryBadge =
    product.badge ?? (isComingSoon ? "Coming Soon" : selectedInStock ? "In Stock" : null);

  const purchaseButtons = selectedInStock ? (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        disabled={pending}
        loading={pending}
        onClick={addToCart}
      >
        {pending ? "Adding…" : "Add to Cart"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="lg"
        fullWidth
        disabled={pending}
        onClick={buyNow}
      >
        {pending ? "Redirecting…" : "Buy Now"}
      </Button>
      <p className={cn(textCaption, "text-center")}>
        Free delivery on orders {formatInr(FREE_SHIPPING_THRESHOLD)}+ ·{" "}
        <Link href="/shipping-policy" className="font-semibold text-terra-600 underline underline-offset-2 hover:text-terra-700">
          Shipping
        </Link>
        {" · "}
        <Link href="/refund-policy" className="font-semibold text-terra-600 underline underline-offset-2 hover:text-terra-700">
          7-day returns
        </Link>
      </p>
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      <Button type="button" variant="cta" size="lg" fullWidth onClick={handleNotifyMe}>
        Notify Me When Available
      </Button>
    </div>
  );

  return (
    <>
      <div className="pdp-purchase-panel lg:sticky lg:top-32 lg:self-start">
        <div className="flex flex-wrap items-center gap-2">
          {primaryBadge ? (
            <Badge variant={isComingSoon || !selectedInStock ? "comingSoon" : "success"} size="md">
              {primaryBadge}
            </Badge>
          ) : null}
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
            <p className="mt-4 max-w-prose text-base leading-[1.75] text-green-800">{product.shortDescription}</p>
          ) : null}
          {displaySku ? <p className="pdp-product-sku mt-3">SKU · {displaySku}</p> : null}
        </div>

        {showRating ? (
          <button
            type="button"
            onClick={jumpToReviews}
            className={cn("inline-flex rounded-lg text-left", focusRing)}
            aria-label={`Rated ${product.ratingAvg} out of 5 from ${product.ratingCount} reviews. Jump to reviews.`}
          >
            <StarRating rating={product.ratingAvg} count={product.ratingCount} size="md" />
          </button>
        ) : null}

        <hr className="pdp-purchase-divider" />

        {product.variants.length > 0 && !isComingSoon ? (
          <div className="flex flex-wrap gap-2">
            {variantsWithStock.map((variant) => (
              <button
                key={variant.id}
                type="button"
                disabled={!variant.inStock}
                onClick={() => setSelectedVariant(variant)}
                className={cn(
                  "rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all",
                  activeVariant?.id === variant.id
                    ? "border-brand-forest bg-brand-mint text-brand-forest"
                    : "border-gray-200 text-gray-600 hover:border-gray-400",
                  !variant.inStock && "cursor-not-allowed opacity-40",
                  focusRing,
                )}
              >
                {variant.name}
                {variant.price > 0 ? (
                  <span className="mt-0.5 block text-xs opacity-70">{formatInr(variant.price)}</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-4">
          <div className="flex flex-wrap items-baseline gap-3">
            {isComingSoon ? (
              <span className="text-2xl font-black text-terra-600">Launching 2026</span>
            ) : (
              <>
                <span className="text-4xl font-black text-brand-forest">{formatInr(displayPrice)}</span>
                {showCompare ? (
                  <span className="text-xl text-gray-600 line-through">{formatInr(displayCompare!)}</span>
                ) : null}
                {product.discountPercent && showCompare ? (
                  <span className="rounded-full bg-terra-100 px-3 py-1 text-sm font-bold text-terra-700">
                    Save {product.discountPercent}%
                  </span>
                ) : null}
              </>
            )}
          </div>
          {!isComingSoon && selectedInStock ? (
            <PricingTaxNote className="mt-2" gstRate={product.gstRate} showMrpLabel />
          ) : null}
          <p
            className={cn(
              "mt-3 text-sm font-semibold",
              isComingSoon ? "text-terra-600" : selectedInStock ? "text-green-700" : "text-gray-500",
            )}
          >
            {isComingSoon
              ? "Research complete — be first to know when we launch."
              : selectedInStock
                ? `${selectedStock} in stock · ready to ship`
                : "Currently unavailable — join the waitlist below."}
          </p>
        </div>

        {!isComingSoon && selectedInStock ? (
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold text-green-900">Quantity</span>
            <QuantitySelector
              value={qty}
              min={1}
              max={Math.min(maxQty, CART_MAX_QUANTITY)}
              onChange={setQty}
              variant="pill"
            />
          </div>
        ) : null}

        {!isComingSoon ? (
          <div className="mt-5">
            <PdpDeliveryEstimator />
          </div>
        ) : null}

        <div className="relative mt-6">
          <HomepageMascotGuide
            mascot="bella-bunny"
            pose="hug"
            size={120}
            placementClassName="-right-4 top-0"
            className="opacity-90"
            floating={false}
          />

          <div ref={ctaRef} className="relative mt-6 flex flex-col gap-3">
            {purchaseButtons}
          </div>

          <button
            type="button"
            onClick={handleWishlist}
            disabled={pending}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
            className={cn(
              wishlistButton(wishlisted),
              ctaHeight,
              "mt-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-3xl transition-transform duration-[var(--duration-button)] motion-safe:hover:scale-[1.03] md:mt-4",
              focusRing,
            )}
          >
            <Heart className={cn("h-5 w-5", wishlisted && "fill-current")} aria-hidden="true" />
          </button>
        </div>

        <CommerceTrustStrip variant="panel" />

        <p className="text-xs leading-[1.7] text-green-700">
          Secure checkout with Razorpay &amp; COD. Free shipping on orders over {formatInr(FREE_SHIPPING_THRESHOLD)}.{" "}
          <Link href="/shipping-policy" className="font-semibold text-terra-600 hover:underline">
            Shipping
          </Link>
          {" · "}
          <Link href="/refund-policy" className="font-semibold text-terra-600 hover:underline">
            Returns
          </Link>
          {" · "}
          <Link href="/trust-center" className="font-semibold text-terra-600 hover:underline">
            Trust center
          </Link>
        </p>
      </div>

      <div
        className={cn(
          "pdp-sticky-bar fixed bottom-0 left-0 right-0 z-40 transition-transform duration-[var(--duration-drawer)] md:hidden",
          showStickyBar ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
        aria-hidden={!showStickyBar}
        {...(!showStickyBar ? { inert: true } : {})}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          {!isComingSoon ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-green-900">{product.name}</p>
              <p className={productPrice}>{formatInr(displayPrice)}</p>
            </div>
          ) : null}
          <div className={cn("flex shrink-0 gap-2", isComingSoon && "w-full")}>
            {selectedInStock ? (
              <>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={addToCart}
                  disabled={pending || !showStickyBar}
                  loading={pending}
                  className="flex-1"
                >
                  {pending ? "Adding…" : "Add to Cart"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={buyNow}
                  disabled={pending || !showStickyBar}
                >
                  {pending ? "…" : "Buy"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="cta"
                size="sm"
                fullWidth
                onClick={handleNotifyMe}
                disabled={!showStickyBar}
              >
                {notifyLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
