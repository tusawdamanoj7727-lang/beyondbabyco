import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import Icon from "@/components/admin/Icon";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  listProducts,
  getProductFormOptions,
  SORTABLE_COLUMNS,
  type SortColumn,
} from "@/lib/admin/products";
import type { ProductStatus } from "@/lib/supabase/database.types";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = { title: "Products" };

const STATUSES = ["all", "active", "draft", "archived", "coming_soon"] as const;

function parseStatus(v: string | undefined): ProductStatus | "all" {
  return (STATUSES as readonly string[]).includes(v ?? "") ? (v as ProductStatus | "all") : "all";
}
function parseSort(v: string | undefined): SortColumn {
  return (SORTABLE_COLUMNS as readonly string[]).includes(v ?? "") ? (v as SortColumn) : "updated_at";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.CATALOG_MANAGE);

  const sp = await searchParams;
  const status = parseStatus(sp.status);
  const sort = parseSort(sp.sort);
  const dir = sp.dir === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(sp.page) || 1);
  const featured = sp.featured === "1";
  const trash = sp.trash === "1";

  const [result, options] = await Promise.all([
    listProducts({
      search: sp.q ?? "",
      status,
      brandId: sp.brand,
      categoryId: sp.category,
      featured,
      sort,
      dir,
      page,
      trash,
    }),
    getProductFormOptions(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage your complete product catalog"
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex h-12 items-center gap-2 rounded-3xl bg-green-500 px-6 font-medium text-cream-50 shadow-clay transition-colors hover:bg-green-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500 focus-visible:ring-offset-2"
          >
            <Icon name="plus" size={18} />
            Add Product
          </Link>
        }
      />

      <ProductsClient
        rows={result.rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        pageCount={result.pageCount}
        brands={options.brands}
        categories={options.categories}
        filters={{
          search: sp.q ?? "",
          status,
          brandId: sp.brand ?? "",
          categoryId: sp.category ?? "",
          featured,
        }}
        sort={sort}
        dir={dir}
        trash={trash}
      />
    </div>
  );
}
