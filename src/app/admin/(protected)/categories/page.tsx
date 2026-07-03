import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import Icon from "@/components/admin/Icon";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  listCategories,
  getCategoryOptions,
  CATEGORY_SORTABLE_COLUMNS,
  type CategorySortColumn,
} from "@/lib/admin/categories";
import type { CatalogStatus } from "@/lib/supabase/database.types";
import CategoriesClient from "./CategoriesClient";

export const metadata: Metadata = { title: "Categories" };

const STATUSES = ["all", "active", "draft", "archived"] as const;

function parseStatus(v: string | undefined): CatalogStatus | "all" {
  return (STATUSES as readonly string[]).includes(v ?? "") ? (v as CatalogStatus | "all") : "all";
}
function parseSort(v: string | undefined): CategorySortColumn {
  return (CATEGORY_SORTABLE_COLUMNS as readonly string[]).includes(v ?? "")
    ? (v as CategorySortColumn)
    : "position";
}

export default async function CategoriesPage({
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

  const [result, parents] = await Promise.all([
    listCategories({
      search: sp.q ?? "",
      status,
      parentId: sp.parent,
      featured,
      sort,
      dir,
      page,
      trash,
    }),
    getCategoryOptions(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Organise your catalog with unlimited nested categories"
        actions={
          <Link
            href="/admin/categories/new"
            className="inline-flex h-12 items-center gap-2 rounded-3xl bg-green-500 px-6 font-medium text-cream-50 shadow-clay transition-colors hover:bg-green-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500 focus-visible:ring-offset-2"
          >
            <Icon name="plus" size={18} />
            Add Category
          </Link>
        }
      />

      <CategoriesClient
        rows={result.rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        pageCount={result.pageCount}
        parents={parents.map((p) => ({ id: p.id, name: p.name }))}
        filters={{
          search: sp.q ?? "",
          status,
          parentId: sp.parent ?? "",
          featured,
        }}
        sort={sort}
        dir={dir ?? (sort === "position" ? "asc" : "desc")}
        trash={trash}
      />
    </div>
  );
}
