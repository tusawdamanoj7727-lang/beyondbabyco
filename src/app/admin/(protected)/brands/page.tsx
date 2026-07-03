import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import Icon from "@/components/admin/Icon";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  listBrands,
  BRAND_SORTABLE_COLUMNS,
  type BrandSortColumn,
} from "@/lib/admin/brands";
import type { CatalogStatus } from "@/lib/supabase/database.types";
import BrandsClient from "./BrandsClient";

export const metadata: Metadata = { title: "Brands" };

const STATUSES = ["all", "active", "draft", "archived"] as const;

function parseStatus(v: string | undefined): CatalogStatus | "all" {
  return (STATUSES as readonly string[]).includes(v ?? "") ? (v as CatalogStatus | "all") : "all";
}
function parseSort(v: string | undefined): BrandSortColumn {
  return (BRAND_SORTABLE_COLUMNS as readonly string[]).includes(v ?? "")
    ? (v as BrandSortColumn)
    : "position";
}

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.CATALOG_MANAGE);

  const sp = await searchParams;
  const status = parseStatus(sp.status);
  const sort = parseSort(sp.sort);
  const dir = sp.dir === "asc" ? "asc" : sp.dir === "desc" ? "desc" : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const featured = sp.featured === "1";
  const trash = sp.trash === "1";

  const result = await listBrands({
    search: sp.q ?? "",
    status,
    featured,
    sort,
    dir,
    page,
    trash,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Catalog"
        title="Brands"
        description="Manage the brands featured across your catalog"
        actions={
          <Link
            href="/admin/brands/new"
            className="inline-flex h-12 items-center gap-2 rounded-3xl bg-green-500 px-6 font-medium text-cream-50 shadow-clay transition-colors hover:bg-green-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500 focus-visible:ring-offset-2"
          >
            <Icon name="plus" size={18} />
            Add Brand
          </Link>
        }
      />

      <BrandsClient
        rows={result.rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        pageCount={result.pageCount}
        filters={{
          search: sp.q ?? "",
          status,
          featured,
        }}
        sort={sort}
        dir={dir ?? (sort === "position" ? "asc" : "desc")}
        trash={trash}
      />
    </div>
  );
}
