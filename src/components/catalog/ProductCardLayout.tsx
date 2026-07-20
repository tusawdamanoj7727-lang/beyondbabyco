import Link from "next/link";
import type { ReactNode } from "react";

import ProductCardImageClient from "@/components/catalog/ProductCardImageClient";
import CategoryProductPlaceholder from "@/components/catalog/CategoryProductPlaceholder";
import RatingStars from "@/components/reviews/RatingStars";
import {
  categoryPlaceholderImage,
  resolveProductVisualGroup,
} from "@/lib/catalog/product-category-images";
import { formatInr } from "@/lib/catalog/format";
import { productUnit } from "@/lib/catalog/product-images";
import type { StorefrontProduct } from "@/lib/catalog/types";
import {
  focusRing,
  imageHoverZoom,
  premiumCardHover,
  productPrice,
  textCaption,
  textCardTitle,
  textEyebrow,
} from "@/lib/design/ui";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/storefront/shipping";
import { cn } from "@/lib/utils";

const LOW_STOCK_THRESHOLD = 5;

function isResearchBacked(product: StorefrontProduct): boolean {
  return (
    product.secondaryBadge === "Research Backed" ||
    product.secondaryBadge === "Research Complete" ||
    product.badge === "Research Backed"
  );
}

function stockBadge(product: StorefrontProduct): { label: string; className: string } | null {
  if (product.status === "coming_soon") {
    return { label: "Coming Soon", className: "bg-orange-50 text-orange-800" };
  }
  if (product.inStock && product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD) {
    return { label: `Only ${product.stock} left`, className: "bg-terra-100 text-terra-800" };
  }
  if (product.inStock) {
    return { label: "In Stock", className: "bg-green-100 text-green-800" };
  }
  return { label: "Out of Stock", className: "bg-cream-100 text-green-700" };
}

type ProductCardLayoutProps = {
  product: StorefrontProduct;
  priority?: boolean;
  className?: string;
  actions?: ReactNode;
  imageOverlay?: ReactNode;
  /** Compact related/cross-sell density */
  density?: "default" | "related";
};

export function ProductCardLayout({
  product,
  priority = false,
  className,
  actions,
  imageOverlay,
  density = "default",
}: ProductCardLayoutProps) {
  const isComingSoon = product.status === "coming_soon";
  const showPrice = !isComingSoon && product.effectivePrice > 0;
  const showCompare =
    product.compareAtPrice != null &&
    product.compareAtPrice > product.effectivePrice &&
    (product.inStock || isComingSoon);
  const savings =
    showCompare && product.compareAtPrice != null
      ? Math.round(product.compareAtPrice - product.effectivePrice)
      : 0;
  const unit = productUnit(product.slug);
  const badge = stockBadge(product);
  const related = density === "related";
  const href = `/products/${product.slug}`;

  const group = resolveProductVisualGroup(product.categorySlug, product.slug);
  const fallbackSrc = categoryPlaceholderImage(group);
  const trimmed = product.imageUrl?.trim();

  return (
    <div className={cn(premiumCardHover, "group relative overflow-hidden", className)}>
      <div className="relative aspect-square overflow-hidden bg-cream-100">
        {trimmed ? (
          <ProductCardImageClient
            src={trimmed}
            alt={product.name}
            productName={product.name}
            productSlug={product.slug}
            categorySlug={product.categorySlug}
            blurDataUrl={product.imageBlurDataUrl}
            priority={priority}
            className="h-full w-full"
            imageClassName={cn("object-contain p-4", imageHoverZoom)}
            fallbackSrc={fallbackSrc}
          />
        ) : (
          <CategoryProductPlaceholder
            productName={product.name}
            categorySlug={product.categorySlug}
            productSlug={product.slug}
            className="h-full w-full"
          />
        )}

        {badge ? (
          <div className="pointer-events-none absolute right-3 top-3 z-[1]">
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", badge.className)}>
              {badge.label}
            </span>
          </div>
        ) : null}

        {isResearchBacked(product) ? (
          <div className="pointer-events-none absolute left-3 top-3 z-[1]">
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
              Research Backed
            </span>
          </div>
        ) : product.isBestSeller ? (
          <div className="pointer-events-none absolute left-3 top-3 z-[1]">
            <span className="rounded-full bg-terra-100 px-2.5 py-1 text-xs font-semibold text-terra-700">
              Best Seller
            </span>
          </div>
        ) : product.isNewArrival ? (
          <div className="pointer-events-none absolute left-3 top-3 z-[1]">
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
              New
            </span>
          </div>
        ) : null}

        {/* Overlay actions stay siblings of the stretched product link (not nested). */}
        {imageOverlay}
      </div>

      <div className={cn("relative z-[2] p-4", actions ? "pb-3" : "pb-4", related && "p-3")}>
        {product.categoryName ? (
          <p className={cn(textEyebrow, "text-green-700")}>
            {product.categoryName}
            {unit ? ` · ${unit}` : ""}
          </p>
        ) : unit ? (
          <p className={cn(textEyebrow, "text-green-700")}>{unit}</p>
        ) : null}
        <h3 className={cn(textCardTitle, "mb-1 mt-1 line-clamp-2 text-green-900")}>
          <Link
            href={href}
            className={cn(
              "after:absolute after:inset-0 after:z-[1]",
              focusRing,
            )}
          >
            {product.name}
          </Link>
        </h3>
        {!related && product.shortDescription ? (
          <p className={cn(textCaption, "line-clamp-2")}>{product.shortDescription}</p>
        ) : null}
        {product.ratingCount > 0 ? (
          <div className="mt-2">
            <RatingStars rating={product.ratingAvg} count={product.ratingCount} size="sm" />
          </div>
        ) : null}
      </div>

      <div className={cn("relative z-[2] px-4 pb-4", related && "px-3 pb-3")}>
        {showPrice ? (
          <div className="mb-2 flex flex-wrap items-baseline gap-2">
            <span className={cn(productPrice, related && "text-base")}>
              {formatInr(product.effectivePrice)}
            </span>
            {showCompare ? (
              <span className={cn(textCaption, "line-through")}>
                {formatInr(product.compareAtPrice!)}
              </span>
            ) : null}
            {savings > 0 ? (
              <span className="text-xs font-semibold text-green-700">Save {formatInr(savings)}</span>
            ) : null}
          </div>
        ) : (
          <p className={cn(textCaption, "mb-2 font-medium")}>Launching 2026</p>
        )}

        {actions ? <div className="relative z-[2] flex items-center justify-between gap-2">{actions}</div> : null}

        {!related ? (
          <p className={cn(textCaption, "mt-2 text-center")}>
            Incl. of all taxes · Free ship {formatInr(FREE_SHIPPING_THRESHOLD)}+
          </p>
        ) : null}
      </div>
    </div>
  );
}
