"use client";

import {
  ProductCardListingAction,
  ProductCardOverlayActions,
  ProductCardWishlistButton,
} from "@/components/catalog/ProductCardActions";
import { ProductCardLayout } from "@/components/catalog/ProductCardLayout";
import { useQuickCompareOptional } from "@/components/catalog/QuickCompareContext";
import type { StorefrontProduct } from "@/lib/catalog/types";
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
  const compare = useQuickCompareOptional();

  const imageOverlay =
    !hideHoverActions || (enableCompare && compare?.enabled) ? (
      <ProductCardOverlayActions
        product={product}
        onQuickView={onQuickView}
        enableCompare={enableCompare}
      />
    ) : null;

  return (
    <article className={cn("relative h-full", className)}>
      <ProductCardLayout
        product={product}
        priority={imagePriority}
        density={density}
        actions={showListingCta || hideHoverActions ? <ProductCardListingAction product={product} /> : undefined}
        imageOverlay={imageOverlay}
      />
      {!hideWishlistButton ? <ProductCardWishlistButton product={product} /> : null}
    </article>
  );
}
