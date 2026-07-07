"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

import Badge from "@/components/ui/Badge";
import CommerceTrustStrip from "@/components/catalog/CommerceTrustStrip";
import HomepageMascotGuide from "@/components/mascots/HomepageMascotGuide";
import PricingTaxNote from "@/components/catalog/PricingTaxNote";
import QuantitySelector from "@/components/catalog/QuantitySelector";
import StarRating from "@/components/catalog/StarRating";
import { useToast } from "@/components/ui/ToastProvider";
import { canPurchaseVariant, shouldShowNotifyMe } from "@/lib/catalog/availability";
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
import { ctaHeight, focusRing, wishlistButton } from "@/lib/design/ui";
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
  }, [product.id]);

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
  const notifyMe = isComingSoon || shouldShowNotifyMe({ ...product, inStock: selectedInStock });
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
    if (!selectedInStock) return;

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
  }

  function buyNow() {
    if (!selectedInStock) return;
    addToCart();
    window.location.href = "/cart";
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
    <>
      <button
        type="button"
        onClick={addToCart}
        className={cn(
          "w-full rounded-2xl bg-[#2d5a27] py-4 text-lg font-bold text-white transition-all hover:bg-[#234821] active:scale-95",
          focusRing,
        )}
      >
        Add to Cart 🛒
      </button>
      <button
        type="button"
        onClick={buyNow}
        className={cn(
          "w-full rounded-2xl border-2 border-[#2d5a27] py-4 text-lg font-bold text-[#2d5a27] transition-all hover:bg-[#eaf3de]",
          focusRing,
        )}
      >
        Buy Now ⚡
      </button>
    </>
  ) : (
    <>
      <button
        type="button"
        onClick={handleNotifyMe}
        className={cn(
          "w-full rounded-2xl border-2 border-[#c4673a] py-4 text-lg font-bold text-[#c4673a] transition-all hover:bg-[#fdf0eb]",
          focusRing,
        )}
      >
        🔔 Notify Me When Available
      </button>
      <p className="text-center text-sm text-gray-500">We&apos;ll email you the moment it&apos;s back!</p>
    </>
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
            <p className="mt-4 max-w-prose text-base leading-[1.75] text-green-700/90">{product.shortDescription}</p>
          ) : null}
          {displaySku ? <p className="pdp-product-sku mt-3">SKU · {displaySku}</p> : null}
        </div>

        {showRating ? (
          <StarRating rating={product.ratingAvg} count={product.ratingCount} size="md" />
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
                    ? "border-[#2d5a27] bg-[#eaf3de] text-[#2d5a27]"
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
                <span className="text-4xl font-black text-[#2d5a27]">{formatInr(displayPrice)}</span>
                {showCompare ? (
                  <span className="text-xl text-gray-400 line-through">{formatInr(displayCompare!)}</span>
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

        <div className="relative mt-6">
          <HomepageMascotGuide
            mascot="bella-bunny"
            pose="hug"
            size={120}
            placementClassName="-right-4 top-0"
            className="opacity-90"
            floating={false}
          />

          <div className="relative mt-6 hidden flex-col gap-3 md:flex">{purchaseButtons}</div>

          <button
            type="button"
            onClick={handleWishlist}
            disabled={pending}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
            className={cn(
              wishlistButton(wishlisted),
              ctaHeight,
              "mt-3 w-[3.25rem] shrink-0 rounded-3xl transition-transform duration-[var(--duration-button)] motion-safe:hover:scale-[1.03] md:mt-4",
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

      <div className="pdp-sticky-bar fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-3 shadow-lg md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          {!isComingSoon ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-black text-[#2d5a27]">{formatInr(displayPrice)}</p>
              <p className="text-xs text-gray-500">
                {selectedInStock ? "In stock · ready to ship" : "Notify when available"}
              </p>
            </div>
          ) : null}
          <div className={cn("flex shrink-0 gap-2", isComingSoon && "w-full")}>
            {selectedInStock ? (
              <>
                <button
                  type="button"
                  onClick={addToCart}
                  className={cn(
                    "rounded-xl bg-[#2d5a27] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#234821]",
                    focusRing,
                  )}
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={buyNow}
                  className={cn(
                    "rounded-xl border-2 border-[#2d5a27] px-4 py-3 text-sm font-bold text-[#2d5a27] transition hover:bg-[#eaf3de]",
                    focusRing,
                  )}
                >
                  Buy Now
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleNotifyMe}
                className={cn(
                  "w-full rounded-xl border-2 border-[#c4673a] py-3.5 text-sm font-bold text-[#c4673a] transition hover:bg-[#fdf0eb]",
                  focusRing,
                )}
              >
                {notifyLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
