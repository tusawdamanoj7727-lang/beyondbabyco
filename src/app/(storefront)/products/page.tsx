import { Suspense } from "react";

import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import CatalogHero from "@/components/catalog/CatalogHero";
import CatalogSearchBar from "@/components/catalog/CatalogSearchBar";
import CategoryChips from "@/components/catalog/CategoryChips";
import CommerceTrustStrip from "@/components/catalog/CommerceTrustStrip";
import { CatalogFiltersSidebar } from "@/components/catalog/CatalogFilters";
import ProductsCatalogSection, { hasBrowseFilters } from "@/components/catalog/ProductsCatalogSection";
import { ProductGridSkeleton } from "@/components/catalog/ProductCardSkeleton";
import { parseCatalogParams } from "@/lib/catalog/params";
import { getCatalogBanner, getCatalogFilterOptions } from "@/lib/catalog/storefront";

import { PRODUCTS_PAGE } from "@/lib/brand/copy";
import { buildProductsMetadata } from "@/lib/seo/metadata";

export const metadata = buildProductsMetadata({
  title: PRODUCTS_PAGE.metaTitle,
  description: PRODUCTS_PAGE.metaDescription,
  path: "/products",
});

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const params = parseCatalogParams(raw);
  const showFeatured = !hasBrowseFilters(params);
  const filtered = hasBrowseFilters(params);

  const [banner, filters] = await Promise.all([getCatalogBanner(), getCatalogFilterOptions()]);

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

            <Suspense fallback={<ProductGridSkeleton count={8} />}>
              <ProductsCatalogSection
                searchParams={raw}
                showFeatured={showFeatured}
                hasActiveFilters={filtered}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
