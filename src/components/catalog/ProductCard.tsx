"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, Eye, GitCompare, Heart, ShoppingBag } from "lucide-react";

import { MICROCOPY } from "@/lib/brand/copy";
import ProductImageFallback from "@/components/brand/ProductImageFallback";
import { useQuickCompareOptional } from "@/components/catalog/QuickCompareContext";
import { resolveImageBlur } from "@/lib/media/image-delivery";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import RatingStars from "@/components/reviews/RatingStars";
import { useToast } from "@/components/ui/ToastProvider";
import { useNotifyMe } from "@/lib/homepage/notify-me-context";
import { focusRing, premiumCard, textCardTitle, editorialImageCrop, imageHoverZoom, wishlistButton } from "@/lib/design/ui";
import { formatInr } from "@/lib/catalog/format";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { useCartOptional } from "@/lib/storefront/cart-context";
import { useCartUiOptional } from "@/lib/storefront/cart-ui-context";
import { useWishlist } from "@/lib/storefront/wishlist-context";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: StorefrontProduct;
  onQuickView?: (product: StorefrontProduct) => void;
  className?: string;
  hideHoverActions?: boolean;
  hideWishlistButton?: boolean;
  enableCompare?: boolean;
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
}: ProductCardProps) {
  const cart = useCartOptional();
  const cartUi = useCartUiOptional();
  const toast = useToast();
  const { openNotifyMe } = useNotifyMe();
  const { isWishlisted, toggle } = useWishlist();
  const compare = useQuickCompareOptional();
  const [wishPending, startWishTransition] = useTransition();

  const wishlisted = isWishlisted(product.id);
  const isComingSoon = product.status === "coming_soon";
  const canPurchase = product.status === "active" && product.inStock;
  const showRating = product.ratingCount > 0;
  const isHomepageStyle = className?.includes("homepage-product-card");

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!canPurchase) return;
    cart?.addItem(product, null, 1);
    cartUi?.openMiniCart();
    toast.success(MICROCOPY.addingToCart);
  }

  function handleNotify(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    openNotifyMe(product.name, product.categoryName ?? undefined);
  }

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
          {product.imageUrl ? (
            <>
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                placeholder="blur"
                blurDataURL={resolveImageBlur(product.imageBlurDataUrl)}
                className={cn(
                  isHomepageStyle
                    ? cn("product-pedestal-image", editorialImageCrop, imageHoverZoom)
                    : "object-cover object-[center_18%] transition-[transform,opacity] duration-[var(--duration-card)] ease-[var(--ease-out)] group-hover:scale-[1.04]",
                )}
              />
              {!isHomepageStyle ? (
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-green-950/12 via-transparent to-white/5 opacity-80 transition-opacity duration-[var(--duration-card)] group-hover:opacity-100" />
              ) : null}
              <div aria-hidden="true" className={isHomepageStyle ? "product-pedestal-reflection" : "product-image-reflection"} />
            </>
          ) : (
            <ProductImageFallback productSlug={product.slug} categorySlug={product.categorySlug} />
          )}

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
              {isComingSoon ? (
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={handleNotify}
                  className="h-11 flex-1 rounded-full bg-white/95 backdrop-blur-sm"
                  leftIcon={<Bell aria-hidden="true" />}
                >
                  Notify Me
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!canPurchase}
                  className="h-11 flex-1 rounded-full"
                  leftIcon={<ShoppingBag aria-hidden="true" />}
                >
                  {product.inStock ? "Add to Cart" : "Out of Stock"}
                </Button>
              )}
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
            <div>
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
              ) : !product.inStock ? (
                <span className="text-xs font-medium text-terra-600">Out of stock</span>
              ) : (
                <span className="text-xs font-medium text-green-700">In stock · ships fast</span>
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
        </div>
      </Link>
    </article>
  );
}
