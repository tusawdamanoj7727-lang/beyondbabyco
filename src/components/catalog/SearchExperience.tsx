import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import FeaturedProductCard from "@/components/catalog/FeaturedProductCard";
import SearchBox from "@/components/catalog/SearchBox";
import { MICROCOPY } from "@/lib/brand/copy";
import type { StorefrontProduct } from "@/lib/catalog/types";

/** SSR results + interactive search island only. */
export default function SearchExperience({
  initialQuery = "",
  initialResults = [],
}: {
  initialQuery?: string;
  initialResults?: StorefrontProduct[];
}) {
  return (
    <div className="container pb-16 pt-2 sm:pt-4">
      <SearchBox initialQuery={initialQuery} />

      <div className="mt-10">
        {initialQuery && initialResults.length === 0 ? (
          <CatalogEmptyState
            title={MICROCOPY.search.noResultsTitle}
            description={MICROCOPY.search.noResultsDescription(initialQuery)}
            mascot="bella-bunny"
            actionLabel={MICROCOPY.search.browseAll}
            actionHref="/products"
            secondaryLabel={MICROCOPY.search.clearSearch}
            secondaryHref="/search"
          />
        ) : (
          <>
            {initialQuery && initialResults.length > 0 ? (
              <p className="mb-6 text-sm text-green-700" role="status">
                Showing {initialResults.length} result{initialResults.length === 1 ? "" : "s"} for “
                {initialQuery}”
              </p>
            ) : null}
            {initialResults.length > 0 ? (
              <div className="collection-product-grid">
                {initialResults.map((product, index) => (
                  <FeaturedProductCard
                    key={product.id}
                    product={product}
                    imagePriority={index === 0}
                  />
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
