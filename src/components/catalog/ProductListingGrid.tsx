import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import ProductListingCard from "@/components/catalog/ProductListingCard";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

/** Server-rendered product grid — ships full HTML for SSR / no-JS. */
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
        title="No products found"
        description={
          hasActiveFilters
            ? "Try adjusting your filters, or browse the full collection."
            : "Our collection is growing — check back soon for new arrivals."
        }
        actionLabel={hasActiveFilters ? "Clear filters" : "Browse all products"}
        actionHref="/products"
        mascot="bella-bunny"
      />
    );
  }

  return (
    <div className={cn("collection-product-grid", className)}>
      {products.map((product, index) => (
        <ProductListingCard key={product.id} product={product} priority={index < 2} />
      ))}
    </div>
  );
}
