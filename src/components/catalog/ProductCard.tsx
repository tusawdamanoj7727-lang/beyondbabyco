"use client";

import { useTransition } from "react";
import { Eye, GitCompare, Heart } from "lucide-react";

import AddToCartButton from "@/components/catalog/AddToCartButton";
import NotifyMeButton from "@/components/catalog/NotifyMeButton";
import { ProductCardLayout } from "@/components/catalog/ProductCardLayout";
import { useQuickCompareOptional } from "@/components/catalog/QuickCompareContext";
import { MICROCOPY } from "@/lib/brand/copy";
import { useToast } from "@/components/ui/ToastProvider";
import { canPurchaseProduct } from "@/lib/catalog/availability";
import { focusRing } from "@/lib/design/ui";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { useWishlist } from "@/lib/storefront/wishlist-context";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: StorefrontProduct;
  onQuickView?: (product: StorefrontProduct) => void;
  className?: string;
  hideHoverActions?: boolean;
  hideWishlistButton?: boolean;
  enableCompare?: boolean;
  showListingCta?: boolean;
  imagePriority?: boolean;
};

function cardPurchaseAction(product: StorefrontProduct, compact = true) {
  if (canPurchaseProduct(product)) {
    return (
      <AddToCartButton
        product={product}
        size="sm"
        fullWidth={false}
        showIcon={false}
        label="Add to Cart"
        className={cn(
          "h-auto rounded-lg px-3 py-1.5 text-xs font-semibold active:scale-95",
          compact && "shrink-0",
        )}
      />
    );
  }

  return (
    <NotifyMeButton
      product={product}
      size="sm"
      fullWidth={false}
      label="Notify Me"
      className={cn(
        "h-auto rounded-lg border border-[#2d5a27] bg-transparent px-3 py-1.5 text-xs font-semibold text-[#2d5a27] hover:bg-[#eaf3de]",
        compact && "shrink-0",
      )}
    />
  );
}

export default function ProductCard({
  product,
  onQuickView,
  className,
  hideHoverActions = false,
  hideWishlistButton = false,
  enableCompare = false,
  showListingCta = false,
  imagePriority = false,
}: ProductCardProps) {
  const toast = useToast();
  const { isWishlisted, toggle } = useWishlist();
  const compare = useQuickCompareOptional();
  const [wishPending, startWishTransition] = useTransition();

  const wishlisted = isWishlisted(product.id);
  const compareSelected = enableCompare && compare?.isSelected(product.id);

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startWishTransition(async () => {
      const result = await toggle(product.id);
      if (!result.ok && result.error) toast.error(result.error);
      else if (result.ok) toast.success(wishlisted ? MICROCOPY.removedFromWishlist : MICROCOPY.savedToWishlist);
    });
  }

  function handleCompare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    compare?.toggle(product);
  }

  const imageOverlay = (
    <>
      {enableCompare && compare?.enabled ? (
        <button
          type="button"
          onClick={handleCompare}
          aria-label={compareSelected ? "Remove from compare" : "Add to compare"}
          aria-pressed={compareSelected}
          className={cn("collection-compare-toggle absolute right-3 top-12 z-10", focusRing)}
          data-selected={compareSelected ? "true" : "false"}
        >
          <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
      {!hideHoverActions ? (
        <div className="absolute inset-x-0 bottom-0 flex translate-y-0 gap-2 p-3 transition-transform duration-[var(--duration-card)] ease-[var(--ease-out)] lg:translate-y-full lg:group-hover:translate-y-0 lg:group-focus-within:translate-y-0">
          {cardPurchaseAction(product, false)}
          {onQuickView ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className={cn("icon-btn bg-white/95 shadow-sm backdrop-blur-sm", focusRing)}
              aria-label={`Quick view ${product.name}`}
            >
              <Eye aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );

  return (
    <article className={cn("relative h-full", className)}>
      <ProductCardLayout
        product={product}
        priority={imagePriority}
        actions={showListingCta ? undefined : cardPurchaseAction(product)}
        imageOverlay={imageOverlay}
      />
      {!hideWishlistButton ? (
        <button
          type="button"
          onClick={handleWishlist}
          disabled={wishPending}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
          className={cn(
            "absolute left-3 top-[calc(100%-4.5rem)] z-10 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-600 shadow-sm backdrop-blur-sm transition hover:text-[#2d5a27] sm:top-[13.5rem]",
            focusRing,
          )}
        >
          <Heart className={cn("h-3.5 w-3.5", wishlisted && "fill-current text-[#c4673a]")} aria-hidden="true" />
        </button>
      ) : null}
      {showListingCta ? (
        <div className="mt-3">{cardPurchaseAction(product, false)}</div>
      ) : null}
    </article>
  );
}
