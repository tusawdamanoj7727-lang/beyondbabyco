import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import ProductCardImage from "@/components/catalog/ProductCardImage";
import { formatInr } from "@/lib/catalog/format";
import { IMAGES } from "@/lib/images";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { IMAGE_DIMENSIONS, IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/media/image-delivery";
import { cn } from "@/lib/utils";

function isResearchBacked(product: StorefrontProduct): boolean {
  return (
    product.secondaryBadge === "Research Backed" ||
    product.secondaryBadge === "Research Complete" ||
    product.status === "active" ||
    product.status === "coming_soon"
  );
}

type ProductCardLayoutProps = {
  product: StorefrontProduct;
  priority?: boolean;
  className?: string;
  actions?: ReactNode;
  imageOverlay?: ReactNode;
  useProductCardImage?: boolean;
};

export function ProductCardLayout({
  product,
  priority = false,
  className,
  actions,
  imageOverlay,
  useProductCardImage = true,
}: ProductCardLayoutProps) {
  const isComingSoon = product.status === "coming_soon";
  const showPrice = !isComingSoon && product.effectivePrice > 0;
  const showCompare =
    product.compareAtPrice != null &&
    product.compareAtPrice > product.effectivePrice &&
    product.inStock;

  return (
    <div
      className={cn(
        "group overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-2 hover:border-brand-forest/20 hover:shadow-2xl",
        className,
      )}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-brand-cream">
          {useProductCardImage ? (
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
              sizes={IMAGE_SIZES.productCard}
            />
          ) : (
            <Image
              src={product.imageUrl || IMAGES.products.placeholder}
              alt={product.name}
              width={IMAGE_DIMENSIONS.productCard.width}
              height={IMAGE_DIMENSIONS.productCard.height}
              priority={priority}
              sizes={IMAGE_SIZES.productCard}
              quality={IMAGE_QUALITY.product}
              className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-110"
            />
          )}

          <div className="absolute right-3 top-3">
            {product.inStock ? (
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                In Stock
              </span>
            ) : (
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                Coming Soon
              </span>
            )}
          </div>

          {isResearchBacked(product) ? (
            <div className="absolute left-3 top-3">
              <span className="rounded-full bg-brand-forest/10 px-2 py-0.5 text-[10px] font-semibold text-brand-forest">
                Research Backed
              </span>
            </div>
          ) : null}

          {imageOverlay}
        </div>

        <div className={cn("p-4", actions ? "pb-3" : "pb-4")}>
          {product.categoryName ? (
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {product.categoryName}
            </p>
          ) : null}
          <h3 className="mb-1 mt-1 line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
            {product.name}
          </h3>
          {product.shortDescription ? (
            <p className="line-clamp-2 text-xs text-gray-500">{product.shortDescription}</p>
          ) : null}
        </div>
      </Link>

      {actions ? (
        <div className="flex items-center justify-between gap-2 px-4 pb-4">
          <div className="min-w-0">
            {showPrice ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-brand-forest">
                  {formatInr(product.effectivePrice)}
                </span>
                {showCompare ? (
                  <span className="text-xs text-gray-400 line-through">
                    {formatInr(product.compareAtPrice!)}
                  </span>
                ) : null}
              </div>
            ) : (
              <span className="text-sm font-medium text-gray-400">Launching 2026</span>
            )}
          </div>
          {actions}
        </div>
      ) : (
        <div className="px-4 pb-4">
          {showPrice ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-brand-forest">
                {formatInr(product.effectivePrice)}
              </span>
              {showCompare ? (
                <span className="text-xs text-gray-400 line-through">
                  {formatInr(product.compareAtPrice!)}
                </span>
              ) : null}
            </div>
          ) : (
            <span className="text-sm font-medium text-gray-400">Launching 2026</span>
          )}
        </div>
      )}
    </div>
  );
}
