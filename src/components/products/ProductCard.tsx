"use client";

import Image from "next/image";
import Link from "next/link";

import AddToCartButton from "@/components/catalog/AddToCartButton";
import { productUnit } from "@/lib/catalog/product-images";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { IMAGES } from "@/lib/images";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/media/image-delivery";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: StorefrontProduct;
  className?: string;
  priority?: boolean;
};

export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const unit = productUnit(product.slug);
  const category = product.categoryName ?? "Baby Care";
  const compareAt = product.compareAtPrice ?? product.price;
  const price = product.effectivePrice;
  const savings = compareAt > price ? Math.round(compareAt - price) : 0;
  const imageSrc = product.imageUrl ?? IMAGES.products.placeholder;

  return (
    <Link href={`/products/${product.slug}`} className={cn("block h-full", className)}>
      <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#2d5a27]/20 hover:shadow-xl">
        <div className="relative aspect-square flex-shrink-0 overflow-hidden bg-[#faf5f0]">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes={IMAGE_SIZES.productCard}
            className="object-contain p-5 transition-transform duration-300 group-hover:scale-105"
            quality={IMAGE_QUALITY.product}
            loading={priority ? undefined : "lazy"}
            priority={priority}
          />
          {product.inStock ? (
            <div className="absolute left-3 top-3">
              <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">
                In Stock
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {category}
            {unit ? ` · ${unit}` : ""}
          </p>
          <h3 className="mb-1.5 line-clamp-2 text-sm font-bold leading-snug text-gray-900">
            {product.name}
          </h3>
          <p className="mb-3 line-clamp-2 flex-1 text-xs text-gray-500">
            {product.shortDescription ?? ""}
          </p>

          <div className="mt-auto">
            <div className="mb-2 flex flex-wrap items-baseline gap-1.5">
              <span className="text-xl font-black text-[#2d5a27]">₹{Math.round(price)}</span>
              {savings > 0 ? (
                <>
                  <span className="text-xs text-gray-400 line-through">₹{Math.round(compareAt)}</span>
                  <span className="text-xs font-semibold text-green-600">Save ₹{savings}</span>
                </>
              ) : null}
            </div>
            <AddToCartButton
              product={product}
              label="Add to Cart"
              showIcon={false}
              size="sm"
              className="w-full rounded-xl py-2.5 text-xs font-bold active:scale-95"
            />
            <p className="mt-1.5 text-center text-[10px] text-gray-400">
              Incl. of all taxes · Free ship ₹999+
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
