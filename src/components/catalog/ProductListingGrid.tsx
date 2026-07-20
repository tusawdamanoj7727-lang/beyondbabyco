import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import FeaturedProductCard from "@/components/catalog/FeaturedProductCard";
import { MICROCOPY } from "@/lib/brand/copy";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

/**
 * Server-rendered product grid — SSR shells + wishlist/cart action islands.
 * Mirrors homepage FeaturedProductCard (no full ProductCard hydration).
 */
export default function ProductListingGrid({
  products,
  hasActiveFilters = false,
  className,
}: {
  products: StorefrontProduct[];
  hasActiveFilters?: boolean;
  className?: string;
}) {
  if (products.length === 0) {
    return (
      <CatalogEmptyState
        title={hasActiveFilters ? "No products found" : MICROCOPY.products.emptyTitle}
        description={
          hasActiveFilters
            ? MICROCOPY.products.filterEmptyDescription
            : MICROCOPY.products.emptyDescription
        }
        actionLabel={hasActiveFilters ? "Clear filters" : MICROCOPY.products.viewAll}
        actionHref="/products"
        secondaryLabel={MICROCOPY.products.backHome}
        secondaryHref="/"
        mascot="bella-bunny"
      />
    );
  }

  return (
    <div className={cn("collection-product-grid", className)}>
      {products.map((product, index) => (
        <FeaturedProductCard
          key={product.id}
          product={product}
          imagePriority={index === 0}
        />
      ))}
    </div>
  );
}
