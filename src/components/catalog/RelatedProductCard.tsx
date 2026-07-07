import Link from "next/link";

import AddToCartButton from "@/components/catalog/AddToCartButton";
import NotifyMeButton from "@/components/catalog/NotifyMeButton";
import ProductCardImage from "@/components/catalog/ProductCardImage";
import { canPurchaseProduct } from "@/lib/catalog/availability";
import { formatInr } from "@/lib/catalog/format";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { IMAGE_SIZES } from "@/lib/media/image-delivery";

function isResearchBacked(product: StorefrontProduct): boolean {
  return (
    product.secondaryBadge === "Research Backed" ||
    product.secondaryBadge === "Research Complete" ||
    product.status === "active" ||
    product.status === "coming_soon"
  );
}

function cardPurchaseAction(product: StorefrontProduct) {
  if (canPurchaseProduct(product)) {
    return (
      <AddToCartButton
        product={product}
        size="sm"
        fullWidth={false}
        showIcon={false}
        label="Add to Cart"
        className="h-auto shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold active:scale-95"
      />
    );
  }

  return (
    <NotifyMeButton
      product={product}
      size="sm"
      fullWidth={false}
      label="Notify Me"
      className="h-auto shrink-0 rounded-lg border border-[#2d5a27] bg-transparent px-3 py-1.5 text-xs font-semibold text-[#2d5a27] hover:bg-[#eaf3de]"
    />
  );
}

export default function RelatedProductCard({ product }: { product: StorefrontProduct }) {
  const isComingSoon = product.status === "coming_soon";
  const showPrice = !isComingSoon && product.effectivePrice > 0;
  const showCompare =
    product.compareAtPrice != null &&
    product.compareAtPrice > product.effectivePrice &&
    product.inStock;

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#2d5a27]/20 hover:shadow-xl">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#faf5f0]">
          <ProductCardImage
            src={product.imageUrl}
            alt={product.name}
            productName={product.name}
            productSlug={product.slug}
            categorySlug={product.categorySlug}
            blurDataUrl={product.imageBlurDataUrl}
            className="h-full w-full"
            imageClassName="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            sizes={IMAGE_SIZES.productCard}
          />

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
              <span className="rounded-full bg-[#2d5a27]/10 px-2 py-0.5 text-[10px] font-semibold text-[#2d5a27]">
                Research Backed
              </span>
            </div>
          ) : null}
        </div>

        <div className="p-4 pb-3">
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

      <div className="flex items-center justify-between gap-2 px-4 pb-4">
        <div className="min-w-0">
          {showPrice ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-[#2d5a27]">
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
        {cardPurchaseAction(product)}
      </div>
    </div>
  );
}
