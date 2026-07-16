"use client";

import ProductCard from "@/components/catalog/ProductCard";
import type { StorefrontProduct } from "@/lib/catalog/types";

/** Server-friendly alias — uses the same ProductCard as PLP / search / wishlist. */
export default function ProductListingCard({
  product,
  className,
  priority = false,
}: {
  product: StorefrontProduct;
  className?: string;
  priority?: boolean;
}) {
  return (
    <ProductCard
      product={product}
      className={className}
      imagePriority={priority}
      showListingCta
      hideHoverActions
    />
  );
}
