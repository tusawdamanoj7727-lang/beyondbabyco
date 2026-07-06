"use client";

import ActiveFilterChips from "@/components/catalog/ActiveFilterChips";
import CatalogToolbar from "@/components/catalog/CatalogFilters";
import CollectionStickyToolbar from "@/components/catalog/CollectionStickyToolbar";
import type { CatalogFilterOptions, CatalogSearchParams } from "@/lib/catalog/types";

type ProductsCatalogClientProps = {
  filters: CatalogFilterOptions;
  params: CatalogSearchParams;
  total: number;
};

/** Client toolbar for /products — filter & sort via URL (server re-fetches products). */
export default function ProductsCatalogClient({
  filters,
  params,
  total,
}: ProductsCatalogClientProps) {
  return (
    <CollectionStickyToolbar>
      <CatalogToolbar filters={filters} total={total} params={params} />
      <ActiveFilterChips filters={filters} params={params} />
    </CollectionStickyToolbar>
  );
}
