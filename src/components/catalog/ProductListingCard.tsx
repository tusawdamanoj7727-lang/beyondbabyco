import Link from "next/link";

import AddToCartButton from "@/components/catalog/AddToCartButton";
import NotifyMeButton from "@/components/catalog/NotifyMeButton";
import ProductCardImage from "@/components/catalog/ProductCardImage";
import ProductWishlistToggle from "@/components/catalog/ProductWishlistToggle";
import { canPurchaseProduct } from "@/lib/catalog/availability";
import { formatInr } from "@/lib/catalog/format";
import { MrpInclusiveLabel } from "@/components/catalog/PricingTaxNote";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { premiumCard, textCardTitle } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

/** Server-rendered product card — visible without client JavaScript. */
export default function ProductListingCard({
  product,
  className,
  priority = false,
}: {
  product: StorefrontProduct;
  className?: string;
  priority?: boolean;
}) {
  const isComingSoon = product.status === "coming_soon";
  const canPurchase = canPurchaseProduct(product);
  const href = `/products/${product.slug}`;

  return (
    <article className={cn("group relative flex h-full flex-col overflow-hidden", premiumCard, className)}>
      <Link href={href} className="flex h-full flex-col">
        <div className="product-image-stage relative aspect-[4/5] overflow-hidden bg-cream-50">
          <ProductCardImage
            src={product.imageUrl}
            alt={product.name}
            productName={product.name}
            productSlug={product.slug}
            categorySlug={product.categorySlug}
            blurDataUrl={product.imageBlurDataUrl}
            priority={priority}
            className="h-full w-full"
          />

          <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1.5">
            {product.inStock ? (
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                In Stock
              </span>
            ) : (
              <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
                Coming Soon
              </span>
            )}
            <ProductWishlistToggle productId={product.id} size="sm" />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5 lg:p-6">
          {product.categoryName ? (
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-green-600/80">
              {product.categoryName}
            </span>
          ) : null}

          <h3 className={cn("mt-2 line-clamp-2", textCardTitle)}>{product.name}</h3>

          {product.shortDescription ? (
            <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-green-700/85">
              {product.shortDescription}
            </p>
          ) : (
            <div className="flex-1" />
          )}

          <div className="mt-4 border-t border-green-50 pt-4">
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
            {canPurchase ? (
              <>
                <span className="mt-1 block text-xs font-medium text-green-700">In stock · ships fast</span>
                <MrpInclusiveLabel className="mt-1 block" />
              </>
            ) : isComingSoon ? (
              <span className="mt-1 block text-xs font-medium text-terra-600">Notify for launch updates</span>
            ) : (
              <span className="mt-1 block text-xs font-medium text-terra-600">Notify when in stock</span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-5 pb-5 lg:px-6 lg:pb-6">
        {canPurchase ? (
          <AddToCartButton product={product} />
        ) : (
          <NotifyMeButton product={product} />
        )}
      </div>
    </article>
  );
}
