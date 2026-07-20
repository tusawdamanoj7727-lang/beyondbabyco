"use client";

import { useTransition } from "react";
import { Eye, GitCompare, Heart } from "lucide-react";

import AddToCartButton from "@/components/catalog/AddToCartButton";
import NotifyMeButton from "@/components/catalog/NotifyMeButton";
import { useQuickCompareOptional } from "@/components/catalog/QuickCompareContext";
import { trackWishlistAdd, trackWishlistRemove } from "@/lib/analytics/events";
import { MICROCOPY } from "@/lib/brand/copy";
import { useToast } from "@/components/ui/ToastProvider";
import { canPurchaseProduct } from "@/lib/catalog/availability";
import { notifyMeButtonLabel } from "@/lib/notify-me/target";
import { focusRing } from "@/lib/design/ui";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { useWishlist } from "@/lib/storefront/wishlist-context";
import { cn } from "@/lib/utils";

function purchaseAction(product: StorefrontProduct, fullWidth = true, className?: string) {
  if (canPurchaseProduct(product)) {
    return (
      <AddToCartButton
        product={product}
        size="sm"
        fullWidth={fullWidth}
        showIcon={false}
        label="Add to Cart"
        className={cn(
          "product-card-listing-cta min-h-11 rounded-full px-4 py-2.5 text-xs font-bold active:scale-95",
          fullWidth && "w-full",
          className,
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
        "product-card-listing-cta min-h-11 rounded-full border border-green-700 bg-transparent px-4 py-2.5 text-xs font-bold text-green-800 hover:bg-green-50",
        fullWidth && "w-full",
        className,
      )}
    />
  );
}

export function ProductCardWishlistButton({ product }: { product: StorefrontProduct }) {
  const toast = useToast();
  const { isWishlisted, toggle } = useWishlist();
  const [wishPending, startWishTransition] = useTransition();
  const wishlisted = isWishlisted(product.id);

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startWishTransition(async () => {
      const result = await toggle(product.id);
      if (!result.ok && result.error) toast.error(result.error);
      else if (result.ok) {
        if (wishlisted) trackWishlistRemove({ productId: product.id, productName: product.name });
        else trackWishlistAdd({ productId: product.id, productName: product.name });
        toast.success(wishlisted ? MICROCOPY.removedFromWishlist : MICROCOPY.savedToWishlist);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleWishlist}
      disabled={wishPending}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
      className={cn(
        "absolute right-3 top-12 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-green-100 bg-white text-green-700 shadow-sm transition hover:text-green-900 md:bg-white/95 md:shadow-[var(--shadow-soft)] md:backdrop-blur-sm",
        focusRing,
      )}
    >
      <Heart className={cn("h-3.5 w-3.5", wishlisted && "fill-current text-brand-terra")} aria-hidden="true" />
    </button>
  );
}

export function ProductCardListingAction({ product }: { product: StorefrontProduct }) {
  return purchaseAction(product, true);
}

type ProductCardOverlayActionsProps = {
  product: StorefrontProduct;
  onQuickView?: (product: StorefrontProduct) => void;
  enableCompare?: boolean;
};

export function ProductCardOverlayActions({
  product,
  onQuickView,
  enableCompare = false,
}: ProductCardOverlayActionsProps) {
  const compare = useQuickCompareOptional();
  const compareSelected = enableCompare && compare?.isSelected(product.id);

  function handleCompare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    compare?.toggle(product);
  }

  return (
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
      <div className="product-card-hover-overlay absolute inset-x-0 bottom-0 z-[2] flex translate-y-0 gap-2 p-3 transition-transform duration-[var(--duration-card)] ease-[var(--ease-out)] lg:translate-y-full lg:group-hover:translate-y-0 lg:group-focus-within:translate-y-0">
        {purchaseAction(product, true, "product-card-hover-cta")}
        {onQuickView ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            className={cn(
              "product-card-quick-view icon-btn shrink-0 bg-white shadow-sm md:bg-white/95 md:backdrop-blur-sm",
              focusRing,
            )}
            aria-label={`Quick view ${product.name}`}
          >
            <Eye aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </>
  );
}
