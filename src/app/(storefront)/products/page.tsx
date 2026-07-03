import { Suspense } from "react";

import ActiveFilterChips from "@/components/catalog/ActiveFilterChips";
import CatalogBeyondCare from "@/components/catalog/CatalogBeyondCare";
import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import CatalogBundleRecommendations from "@/components/catalog/CatalogBundleRecommendations";
import CatalogHero from "@/components/catalog/CatalogHero";
import CatalogSearchBar from "@/components/catalog/CatalogSearchBar";
import CategoryChips from "@/components/catalog/CategoryChips";
import CommerceTrustStrip from "@/components/catalog/CommerceTrustStrip";
import CatalogToolbar, { CatalogFiltersSidebar } from "@/components/catalog/CatalogFilters";
import CollectionStickyToolbar from "@/components/catalog/CollectionStickyToolbar";
import FeaturedCollections from "@/components/catalog/FeaturedCollections";
import ProductGrid, { Pagination } from "@/components/catalog/ProductGrid";
import { CatalogPageSkeleton } from "@/components/catalog/ProductCardSkeleton";
import RecentlyViewed from "@/components/catalog/RecentlyViewed";
import { parseCatalogParams, catalogParamsToSearchParams } from "@/lib/catalog/params";
import type { CatalogSearchParams } from "@/lib/catalog/types";
import {
  getCatalogBanner,
  getCatalogFilterOptions,
  getFeaturedStorefrontProducts,
  listStorefrontProducts,
} from "@/lib/catalog/storefront";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Shop the collection",
  description: "Thoughtfully crafted baby care — gentle formulas developed through research, available now and arriving through 2026.",
  path: "/products",
});

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hasBrowseFilters(params: CatalogSearchParams): boolean {
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

export default async function ProductsPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const params = parseCatalogParams(raw);
  const showFeatured = !hasBrowseFilters(params);
  const filtered = hasBrowseFilters(params);

  const [banner, filters, result, featured] = await Promise.all([
    getCatalogBanner(),
    getCatalogFilterOptions(),
    listStorefrontProducts(params),
    showFeatured ? getFeaturedStorefrontProducts(4) : Promise.resolve([]),
  ]);

  const queryString = catalogParamsToSearchParams(params).toString();

  return (
    <>
      <CatalogHero banner={banner} />
      <CatalogBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Products" },
        ]}
      />
      <div className="container pb-24 lg:pb-20">
        <div className="space-y-6 py-8 lg:py-10">
          <CommerceTrustStrip variant="panel" />
          <Suspense fallback={null}>
            <CategoryChips filters={filters} />
          </Suspense>
        </div>

        <div className="flex gap-12 xl:gap-16">
          <Suspense fallback={null}>
            <CatalogFiltersSidebar filters={filters} />
          </Suspense>

          <div className="min-w-0 flex-1">
            <CatalogSearchBar />

            <Suspense fallback={<CatalogPageSkeleton />}>
              {showFeatured ? (
                <>
                  <FeaturedCollections products={featured} />
                  <CatalogBundleRecommendations products={featured} />
                  <CatalogBeyondCare />
                </>
              ) : null}

              <CollectionStickyToolbar>
                <CatalogToolbar filters={filters} total={result.total} params={params} />
                <ActiveFilterChips filters={filters} params={params} />
              </CollectionStickyToolbar>

              <ProductGrid products={result.products} hasActiveFilters={filtered} />
              <Pagination
                page={result.page}
                pageCount={result.pageCount}
                basePath="/products"
                search={queryString}
              />

              <RecentlyViewed variant="collection" />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
