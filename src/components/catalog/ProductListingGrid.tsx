"use client";

import ProductGrid from "@/components/catalog/ProductGrid";
import type { StorefrontProduct } from "@/lib/catalog/types";

/** Product listing grid — always uses the canonical ProductCard via ProductGrid. */
export default function ProductListingGrid({
  products,
  hasActiveFilters = false,
  className,
}: {
  products: StorefrontProduct[];
  hasActiveFilters?: boolean;
  className?: string;
}) {
  return (
    <ProductGrid
      products={products}
      hasActiveFilters={hasActiveFilters}
      className={className}
      enableQuickView
      enableCompare={false}
    />
  );
}
