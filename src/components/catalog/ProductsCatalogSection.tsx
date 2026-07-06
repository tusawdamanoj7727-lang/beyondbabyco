import CatalogBeyondCare from "@/components/catalog/CatalogBeyondCare";
import CatalogBundleRecommendations from "@/components/catalog/CatalogBundleRecommendations";
import FeaturedCollections from "@/components/catalog/FeaturedCollections";
import ProductGridPagination from "@/components/catalog/ProductGridPagination";
import ProductListingGrid from "@/components/catalog/ProductListingGrid";
import ProductsCatalogClient from "@/components/catalog/ProductsCatalogClient";
import RecentlyViewed from "@/components/catalog/RecentlyViewed";
import { catalogParamsToSearchParams, parseCatalogParams } from "@/lib/catalog/params";
import type { CatalogSearchParams } from "@/lib/catalog/types";
import {
  getCatalogFilterOptions,
  getFeaturedStorefrontProducts,
  listStorefrontProducts,
} from "@/lib/catalog/storefront";

type ProductsCatalogSectionProps = {
  searchParams: Record<string, string | string[] | undefined>;
  showFeatured: boolean;
  hasActiveFilters: boolean;
};

export default async function ProductsCatalogSection({
  searchParams,
  showFeatured,
  hasActiveFilters,
}: ProductsCatalogSectionProps) {
  const params = parseCatalogParams(searchParams);

  const [filters, result, featured] = await Promise.all([
    getCatalogFilterOptions(),
    listStorefrontProducts(params),
    showFeatured ? getFeaturedStorefrontProducts(4) : Promise.resolve([]),
  ]);

  const queryString = catalogParamsToSearchParams(params).toString();

  return (
    <>
      {showFeatured ? (
        <>
          <FeaturedCollections products={featured} />
          <CatalogBundleRecommendations products={featured} />
          <CatalogBeyondCare />
        </>
      ) : null}

      <ProductsCatalogClient filters={filters} params={params} total={result.total} />

      <ProductListingGrid
        products={result.products}
        hasActiveFilters={hasActiveFilters}
        className="mt-8"
      />

      <ProductGridPagination
        page={result.page}
        pageCount={result.pageCount}
        basePath="/products"
        search={queryString}
      />

      <RecentlyViewed variant="collection" />
    </>
  );
}

export function hasBrowseFilters(params: CatalogSearchParams): boolean {
  return Boolean(
    params.q ||
      params.category ||
      params.brand ||
      params.age ||
      params.type ||
      params.minPrice != null ||
      params.maxPrice != null ||
      params.inStock ||
      (params.minRating != null && params.minRating > 0) ||
      (params.page != null && params.page > 1),
  );
}
