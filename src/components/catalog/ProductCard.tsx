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
import { notifyMeButtonLabel } from "@/lib/notify-me/target";
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
  density?: "default" | "related";
};

function cardPurchaseAction(product: StorefrontProduct, fullWidth = true) {
  if (canPurchaseProduct(product)) {
    return (
      <AddToCartButton
        product={product}
        size="sm"
        fullWidth={fullWidth}
        showIcon={false}
        label="Add to Cart"
        className={cn(
          "min-h-11 rounded-full px-4 py-2.5 text-xs font-bold active:scale-95",
          fullWidth && "w-full",
        )}
      />
    );
  }

  return (
    <NotifyMeButton
      product={product}
      size="sm"
      fullWidth={fullWidth}
      label={notifyMeButtonLabel(
        product.status === "coming_soon" ? "launch" : "restock",
        product.status,
      )}
      className={cn(
        "min-h-11 rounded-full border border-green-700 bg-transparent px-4 py-2.5 text-xs font-bold text-green-800 hover:bg-green-50",
        fullWidth && "w-full",
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
  density = "default",
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
        <div className="absolute inset-x-0 bottom-0 z-[2] flex translate-y-0 gap-2 p-3 transition-transform duration-[var(--duration-card)] ease-[var(--ease-out)] lg:translate-y-full lg:group-hover:translate-y-0 lg:group-focus-within:translate-y-0">
          {cardPurchaseAction(product, true)}
          {onQuickView ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className={cn("icon-btn shrink-0 bg-white/95 shadow-sm backdrop-blur-sm", focusRing)}
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
        density={density}
        actions={showListingCta || hideHoverActions ? cardPurchaseAction(product, true) : undefined}
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
            "absolute right-3 top-12 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-green-100 bg-white/95 text-green-700 shadow-[var(--shadow-soft)] backdrop-blur-sm transition hover:text-green-900",
            focusRing,
          )}
        >
          <Heart className={cn("h-3.5 w-3.5", wishlisted && "fill-current text-brand-terra")} aria-hidden="true" />
        </button>
      ) : null}
    </article>
  );
}
