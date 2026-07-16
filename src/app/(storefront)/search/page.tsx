import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import SearchExperience from "@/components/catalog/SearchExperience";
import { listStorefrontProducts } from "@/lib/catalog/storefront";
import { parseCatalogParams } from "@/lib/catalog/params";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Search",
  description: "Search BeyondBabyCo products.",
  path: "/search",
});

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q.trim() : "";
  const results = q ? (await listStorefrontProducts({ ...parseCatalogParams(raw), q, page: 1 })).products : [];

  return (
    <>
      <CatalogBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Search" },
        ]}
      />
      <div>
        <div className="container mb-8">
          <h1 className="font-heading text-3xl font-bold text-green-900">Search</h1>
          {q ? (
            <p className="mt-2 text-green-700">
              Results for <span className="font-semibold text-green-900">&ldquo;{q}&rdquo;</span>
            </p>
          ) : null}
        </div>
        <SearchExperience initialQuery={q} initialResults={results} />
      </div>
    </>
  );
}
