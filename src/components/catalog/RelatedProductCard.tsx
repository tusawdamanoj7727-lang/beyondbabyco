import Link from "next/link";

import ProductCardImage from "@/components/catalog/ProductCardImage";
import { canPurchaseProduct } from "@/lib/catalog/availability";
import { formatInr } from "@/lib/catalog/format";
import { productUnit } from "@/lib/catalog/product-images";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { IMAGE_SIZES } from "@/lib/media/image-delivery";

export default function RelatedProductCard({ product }: { product: StorefrontProduct }) {
  const unit = productUnit(product.slug);
  const categoryLabel = product.categoryName ?? "Baby Care";
  const inStock = canPurchaseProduct(product);

  return (
    <Link href={`/products/${product.slug}`} className="block no-underline">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:shadow-lg">
        <div className="relative aspect-square bg-brand-cream">
          <ProductCardImage
            src={product.imageUrl}
            alt={product.name}
            productName={product.name}
            productSlug={product.slug}
            categorySlug={product.categorySlug}
            blurDataUrl={product.imageBlurDataUrl}
            className="h-full w-full"
            imageClassName="object-contain p-4"
            sizes={IMAGE_SIZES.productCard}
          />
        </div>
        <div className="p-3">
          <p className="mb-1 text-xs text-gray-400">
            {categoryLabel}
            {unit ? ` · ${unit}` : ""}
          </p>
          <h3 className="line-clamp-2 text-sm font-bold text-gray-900">{product.name}</h3>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="font-black text-brand-forest">{formatInr(product.effectivePrice)}</span>
            <span
              className={
                inStock
                  ? "rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600"
                  : "rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600"
              }
            >
              {inStock ? "In Stock" : "Coming Soon"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
