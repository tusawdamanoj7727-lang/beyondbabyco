import Link from "next/link";
import type { ReactNode } from "react";

import ProductCardImage from "@/components/catalog/ProductCardImage";
import { formatInr } from "@/lib/catalog/format";
import { productUnit } from "@/lib/catalog/product-images";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/storefront/shipping";
import { cn } from "@/lib/utils";

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
  if (product.inStock) {
    return { label: "In Stock", className: "bg-green-100 text-green-800" };
  }
  return { label: "Out of Stock", className: "bg-gray-100 text-gray-700" };
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

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-2 hover:border-brand-forest/20 hover:shadow-2xl",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-brand-cream">
        <ProductCardImage
          src={product.imageUrl}
          alt={product.name}
          productName={product.name}
          productSlug={product.slug}
          categorySlug={product.categorySlug}
          blurDataUrl={product.imageBlurDataUrl}
          priority={priority}
          className="h-full w-full"
          imageClassName="object-contain p-4 transition-transform duration-300 group-hover:scale-110"
        />

        {badge ? (
          <div className="pointer-events-none absolute right-3 top-3 z-[1]">
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", badge.className)}>
              {badge.label}
            </span>
          </div>
        ) : null}

        {isResearchBacked(product) ? (
          <div className="pointer-events-none absolute left-3 top-3 z-[1]">
            <span className="rounded-full bg-brand-forest/10 px-2 py-0.5 text-[10px] font-semibold text-brand-forest">
              Research Backed
            </span>
          </div>
        ) : product.isBestSeller ? (
          <div className="pointer-events-none absolute left-3 top-3 z-[1]">
            <span className="rounded-full bg-terra-100 px-2 py-0.5 text-[10px] font-semibold text-terra-700">
              Best Seller
            </span>
          </div>
        ) : product.isNewArrival ? (
          <div className="pointer-events-none absolute left-3 top-3 z-[1]">
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
              New
            </span>
          </div>
        ) : null}

        {/* Overlay actions stay siblings of the stretched product link (not nested). */}
        {imageOverlay}
      </div>

      <div className={cn("relative z-[2] p-4", actions ? "pb-3" : "pb-4", related && "p-3")}>
        {product.categoryName ? (
          <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
            {product.categoryName}
            {unit ? ` · ${unit}` : ""}
          </p>
        ) : unit ? (
          <p className="text-xs font-medium uppercase tracking-wide text-gray-600">{unit}</p>
        ) : null}
        <h3
          className={cn(
            "mb-1 mt-1 line-clamp-2 font-semibold leading-snug text-gray-900",
            related ? "text-sm" : "text-sm",
          )}
        >
          <Link
            href={href}
            className={cn(
              "after:absolute after:inset-0 after:z-[1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500 focus-visible:ring-offset-2",
            )}
          >
            {product.name}
          </Link>
        </h3>
        {!related && product.shortDescription ? (
          <p className="line-clamp-2 text-xs text-gray-600">{product.shortDescription}</p>
        ) : null}
      </div>

      <div className={cn("relative z-[2] px-4 pb-4", related && "px-3 pb-3")}>
        {showPrice ? (
          <div className="mb-2 flex flex-wrap items-baseline gap-1.5">
            <span className={cn("font-bold text-brand-forest", related ? "text-base" : "text-lg")}>
              {formatInr(product.effectivePrice)}
            </span>
            {showCompare ? (
              <span className="text-xs text-gray-600 line-through">
                {formatInr(product.compareAtPrice!)}
              </span>
            ) : null}
            {savings > 0 ? (
              <span className="text-xs font-semibold text-green-700">Save {formatInr(savings)}</span>
            ) : null}
          </div>
        ) : (
          <p className="mb-2 text-sm font-medium text-gray-600">Launching 2026</p>
        )}

        {actions ? <div className="relative z-[2] flex items-center justify-between gap-2">{actions}</div> : null}

        {!related ? (
          <p className="mt-2 text-center text-[10px] text-gray-600">
            Incl. of all taxes · Free ship {formatInr(FREE_SHIPPING_THRESHOLD)}+
          </p>
        ) : null}
      </div>
    </div>
  );
}
