import Link from "next/link";

import ProductCardImage from "@/components/catalog/ProductCardImage";
import { formatInr } from "@/lib/catalog/format";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

export default function RelatedProductCard({ product }: { product: StorefrontProduct }) {
  return (
    <Link href={`/products/${product.slug}`} className="block h-full">
      <article className="group overflow-hidden rounded-2xl border border-gray-100 transition-all hover:shadow-lg">
        <div className="relative aspect-square bg-gray-50">
          <ProductCardImage
            src={product.imageUrl}
            alt={product.name}
            productName={product.name}
            productSlug={product.slug}
            categorySlug={product.categorySlug}
            blurDataUrl={product.imageBlurDataUrl}
            className="h-full w-full"
            imageClassName="object-contain p-4 transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </div>

        <div className="p-4">
          {product.categoryName ? (
            <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">{product.categoryName}</p>
          ) : null}
          <h3 className="line-clamp-2 font-semibold text-gray-900">{product.name}</h3>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-lg font-bold text-[#2d5a27]">{formatInr(product.effectivePrice)}</span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-1 text-xs",
                product.inStock ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400",
              )}
            >
              {product.inStock ? "In Stock" : "Coming Soon"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
