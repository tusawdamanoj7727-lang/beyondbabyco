"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Eye, GitCompare, Heart } from "lucide-react";

import AddToCartButton from "@/components/catalog/AddToCartButton";
import NotifyMeButton from "@/components/catalog/NotifyMeButton";
import { MICROCOPY } from "@/lib/brand/copy";
import ProductCardImage from "@/components/catalog/ProductCardImage";
import { useQuickCompareOptional } from "@/components/catalog/QuickCompareContext";
import Badge from "@/components/ui/Badge";
import RatingStars from "@/components/reviews/RatingStars";
import { useToast } from "@/components/ui/ToastProvider";
import { canPurchaseProduct } from "@/lib/catalog/availability";
import { focusRing, premiumCard, textCardTitle, editorialImageCrop, imageHoverZoom, wishlistButton } from "@/lib/design/ui";
import { formatInr } from "@/lib/catalog/format";
import { MrpInclusiveLabel } from "@/components/catalog/PricingTaxNote";
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

function badgeVariant(badge: string | null): "success" | "comingSoon" | "info" | "default" {
  if (badge === "Available Now") return "success";
  if (badge === "Launching 2026" || badge === "Coming Soon") return "comingSoon";
  if (badge === "Research Complete" || badge === "Research Backed") return "info";
  return "default";
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
  const isComingSoon = product.status === "coming_soon";
  const canPurchase = canPurchaseProduct(product);
  const showRating = product.ratingCount > 0;
  const isHomepageStyle = className?.includes("homepage-product-card");

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

  const compareSelected = enableCompare && compare?.isSelected(product.id);

  const purchaseButton = canPurchase ? (
    <AddToCartButton
      product={product}
      size="sm"
      fullWidth={false}
      className="h-11 flex-1 bg-white/95 text-cream-50 backdrop-blur-sm"
    />
  ) : (
    <NotifyMeButton
      product={product}
      size="sm"
      fullWidth={false}
      className="h-11 flex-1 bg-white/95 backdrop-blur-sm"
    />
  );

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden",
        premiumCard,
        className,
      )}
    >
      <Link href={`/products/${product.slug}`} className="flex h-full flex-col">
        <div className={cn("product-image-stage relative overflow-hidden bg-cream-50", isHomepageStyle ? "product-pedestal-stage" : "aspect-[4/5]")}>
          <ProductCardImage
            src={product.imageUrl}
            alt={product.name}
            productName={product.name}
            productSlug={product.slug}
            categorySlug={product.categorySlug}
            blurDataUrl={product.imageBlurDataUrl}
            priority={imagePriority}
            className="h-full w-full"
            imageClassName={cn(
              isHomepageStyle
                ? cn("product-pedestal-image", editorialImageCrop, imageHoverZoom)
                : "object-[center_18%] transition-[transform,opacity] duration-[var(--duration-card)] ease-[var(--ease-out)] group-hover:scale-[1.04]",
            )}
          />
          {!isHomepageStyle ? (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-green-950/12 via-transparent to-white/5 opacity-80 transition-opacity duration-[var(--duration-card)] group-hover:opacity-100" />
          ) : null}
          <div aria-hidden="true" className={isHomepageStyle ? "product-pedestal-reflection" : "product-image-reflection"} />

          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.badge ? (
              <Badge variant={badgeVariant(product.badge)} size="sm">
                {product.badge}
              </Badge>
            ) : null}
            {product.secondaryBadge ? (
              <Badge variant="info" size="sm" className="bg-white/90 backdrop-blur-sm">
                {product.secondaryBadge}
              </Badge>
            ) : null}
          </div>

          {product.discountPercent && canPurchase ? (
            <span className="absolute right-3 top-3 rounded-full bg-terra-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              -{product.discountPercent}%
            </span>
          ) : null}

          {enableCompare && compare?.enabled ? (
            <button
              type="button"
              onClick={handleCompare}
              aria-label={compareSelected ? "Remove from compare" : "Add to compare"}
              aria-pressed={compareSelected}
              className={cn(
                "collection-compare-toggle absolute right-3 z-10",
                product.discountPercent && canPurchase ? "top-12" : "top-3",
                focusRing,
              )}
              data-selected={compareSelected ? "true" : "false"}
            >
              <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : null}

          {!hideHoverActions ? (
            <div className="absolute inset-x-0 bottom-0 flex translate-y-0 gap-2 p-3 transition-transform duration-[var(--duration-card)] ease-[var(--ease-out)] lg:translate-y-full lg:group-hover:translate-y-0 lg:group-focus-within:translate-y-0">
              {purchaseButton}
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
        </div>

        <div className="flex flex-1 flex-col p-5 lg:p-6">
          <div className="flex flex-wrap items-center gap-2">
            {product.categoryName ? (
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-green-600/80">
                {product.categoryName}
              </span>
            ) : null}
            {product.ageGroupName ? (
              <Badge variant="default" size="sm">
                {product.ageGroupName}
              </Badge>
            ) : null}
          </div>

          <h3 className={cn("mt-2 line-clamp-2", textCardTitle)}>
            {product.name}
          </h3>

          {product.shortDescription ? (
            <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-green-700/85">
              {product.shortDescription}
            </p>
          ) : (
            <div className="flex-1" />
          )}

          {showRating ? (
            <div className="mt-3">
              <RatingStars rating={product.ratingAvg} count={product.ratingCount} detailed />
            </div>
          ) : null}

          <div className="mt-4 flex items-end justify-between gap-3 border-t border-green-50 pt-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="product-price">
                  {isComingSoon ? "Launching 2026" : formatInr(product.effectivePrice)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.effectivePrice && canPurchase ? (
                  <span className="text-sm text-green-700/60 line-through">
                    {formatInr(product.compareAtPrice)}
                  </span>
                ) : null}
              </div>
              {isComingSoon ? (
                <span className="text-xs font-medium text-terra-600">Notify for launch updates</span>
              ) : canPurchase ? (
                <>
                  <span className="text-xs font-medium text-green-700">In stock · ships fast</span>
                  <MrpInclusiveLabel className="mt-1 block" />
                </>
              ) : (
                <span className="text-xs font-medium text-terra-600">Join the waitlist for updates</span>
              )}
            </div>

            {!hideWishlistButton ? (
              <button
                type="button"
                onClick={handleWishlist}
                disabled={wishPending}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={wishlisted}
                className={cn(
                  wishlistButton(wishlisted),
                  "transition-[transform,box-shadow] duration-[var(--duration-button)] ease-[var(--ease-out)] motion-safe:hover:scale-105 motion-safe:active:scale-95",
                  wishlisted && "motion-safe:animate-[pulseSoft_0.4s_ease-out_1]",
                )}
              >
                <Heart className={cn("h-[18px] w-[18px] transition-transform", wishlisted && "scale-110 fill-current")} aria-hidden="true" />
              </button>
            ) : null}
          </div>

          {showListingCta ? (
            <div className="mt-4">
              {canPurchase ? (
                <AddToCartButton product={product} />
              ) : (
                <NotifyMeButton product={product} />
              )}
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
