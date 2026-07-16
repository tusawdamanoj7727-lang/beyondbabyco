"use client";

import ProductCard from "@/components/catalog/ProductCard";
import type { StorefrontProduct } from "@/lib/catalog/types";

/** Related / cross-sell card — same ProductCard, related density. */
export default function RelatedProductCard({ product }: { product: StorefrontProduct }) {
  return (
    <ProductCard
      product={product}
      hideHoverActions
      density="related"
      showListingCta
      className="h-full"
    />
  );
}
