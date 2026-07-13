import { ProductCard } from "@/components/products/ProductCard";
import JsonLd from "@/components/seo/JsonLd";
import BundleSection from "@/components/sections/BundleSection";
import { listSevenStorefrontProducts } from "@/lib/catalog/storefront";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/json-ld";
import { buildProductsMetadata } from "@/lib/seo/metadata";
import { PRODUCTS_PAGE } from "@/lib/brand/copy";

export const metadata = buildProductsMetadata({
  title: PRODUCTS_PAGE.metaTitle,
  description: PRODUCTS_PAGE.metaDescription,
  path: "/products",
  keywords: ["baby care products", "dermatologically tested", "Made in India", "BeyondBabyCo shop"],
});

export default async function ProductsPage() {
  const products = await listSevenStorefrontProducts();
  const itemList = itemListJsonLd(
    products.map((product) => ({
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
        {/* ── SECTION 1: Page Hero ── */}
        <section className="bg-brand-cream px-4 py-16">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-eyebrow mb-2 font-bold uppercase tracking-widest text-brand-terra">
              Our Collection
            </p>
            <h1 className="font-heading text-4xl font-black text-brand-forest md:text-5xl">Shop Baby Care</h1>
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

        {/* ── SECTION 2: Products Grid ── */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              All Products
              <span className="ml-2 text-sm font-normal text-gray-500">({products.length} products)</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        </section>

        {/* ── DIVIDER ── */}
        <div className="mx-auto max-w-6xl px-4">
          <div className="border-t border-gray-100" />
        </div>

        {/* ── SECTION 3: Bundles (AFTER products) ── */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-10 text-center">
            <p className="text-eyebrow mb-2 font-bold uppercase tracking-widest text-brand-terra">
              Better Together
            </p>
            <h2 className="font-heading text-3xl font-bold text-brand-forest">Complete Routines</h2>
            <p className="mt-2 text-gray-500">Save more with our curated bundles</p>
          </div>
          <BundleSection products={products} />
        </section>
      </div>
    </>
  );
}
