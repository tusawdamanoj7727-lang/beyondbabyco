import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import { MICROCOPY } from "@/lib/brand/copy";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Page not found",
  description: "The page you requested could not be found.",
  noIndex: true,
});

export default function NotFound() {
  return (
    <div className="premium-page-bg flex min-h-[60vh] items-center py-20">
      <CatalogEmptyState
        mascot="bella-bunny"
        title={MICROCOPY.notFound.title}
        description={MICROCOPY.notFound.description}
        actionLabel={MICROCOPY.notFound.home}
        actionHref="/"
        secondaryLabel={MICROCOPY.notFound.shop}
        secondaryHref="/products"
      />
    </div>
  );
}
