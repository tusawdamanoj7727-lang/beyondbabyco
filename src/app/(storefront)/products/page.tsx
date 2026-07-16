import { Suspense } from "react";
import dynamic from "next/dynamic";

import CatalogSearchBar from "@/components/catalog/CatalogSearchBar";
import JsonLd from "@/components/seo/JsonLd";
import ProductsCatalogSection, {
  hasBrowseFilters,
} from "@/components/catalog/ProductsCatalogSection";
import { listSevenStorefrontProducts, listStorefrontProducts } from "@/lib/catalog/storefront";
import { parseCatalogParams } from "@/lib/catalog/params";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/json-ld";
import { buildProductsMetadata } from "@/lib/seo/metadata";
import { PRODUCTS_PAGE } from "@/lib/brand/copy";

export const revalidate = 60;

const BundleSection = dynamic(() => import("@/components/sections/BundleSection"), {
  loading: () => null,
});

export const metadata = buildProductsMetadata({
  title: PRODUCTS_PAGE.metaTitle,
  description: PRODUCTS_PAGE.metaDescription,
  path: "/products",
  keywords: ["baby care products", "dermatologically tested", "Made in India", "BeyondBabyCo shop"],
});

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const params = parseCatalogParams(raw);
  const activeFilters = hasBrowseFilters(params);
  const showFeatured = !activeFilters;

  const [bundleProducts, listed] = await Promise.all([
    listSevenStorefrontProducts(),
    listStorefrontProducts(params),
  ]);

  const itemList = itemListJsonLd(
    listed.products.map((product) => ({
      name: product.name,
      url: `/products/${product.slug}`,
    })),
  );

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Products" },
          ]),
          ...(itemList ? [itemList] : []),
        ]}
      />
      <div>
        <section className="bg-brand-cream px-4 py-16">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-eyebrow mb-2 font-bold uppercase tracking-widest text-brand-terra">
              Our Collection
            </p>
            <h1 className="font-heading text-4xl font-black text-brand-forest md:text-5xl">
              Shop Baby Care
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-lg text-gray-500">
              Pure. Gentle. Tested. Everything your baby needs, nothing they don&apos;t.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {["Dermatologically Tested", "Made in India", "Natural Ingredients", "Research Backed"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600"
                  >
                    ✓ {tag}
                  </span>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <Suspense
            fallback={
              <div className="collection-search mb-8 h-12 animate-pulse rounded-2xl bg-green-50/80" />
            }
          >
            <CatalogSearchBar actionPath="/products" defaultValue={params.q ?? ""} />
          </Suspense>

          <Suspense
            fallback={
              <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4" aria-busy="true">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-green-50/80" />
                ))}
              </div>
            }
          >
            <ProductsCatalogSection
              searchParams={raw}
              showFeatured={showFeatured}
              hasActiveFilters={activeFilters}
            />
          </Suspense>
        </section>

        <div className="mx-auto max-w-6xl px-4">
          <div className="border-t border-gray-100" />
        </div>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-10 text-center">
            <p className="text-eyebrow mb-2 font-bold uppercase tracking-widest text-brand-terra">
              Better Together
            </p>
            <h2 className="font-heading text-3xl font-bold text-brand-forest">Complete Routines</h2>
            <p className="mt-2 text-gray-500">Save more with our curated bundles</p>
          </div>
          <BundleSection products={bundleProducts} />
        </section>
      </div>
    </>
  );
}
