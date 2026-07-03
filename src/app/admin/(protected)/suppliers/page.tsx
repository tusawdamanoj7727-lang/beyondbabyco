import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import Icon from "@/components/admin/Icon";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listSuppliers, SUPPLIER_SORTABLE_COLUMNS, type SupplierSortColumn } from "@/lib/admin/suppliers";
import SuppliersClient from "./SuppliersClient";

export const metadata: Metadata = { title: "Suppliers" };

function parseSort(v: string | undefined): SupplierSortColumn {
  return (SUPPLIER_SORTABLE_COLUMNS as readonly string[]).includes(v ?? "")
    ? (v as SupplierSortColumn)
    : "name";
}

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
  const sp = await searchParams;
  const active = sp.active === "1" ? true : sp.active === "0" ? false : "all";

  const result = await listSuppliers({
    search: sp.q ?? "",
    active,
    sort: parseSort(sp.sort),
    dir: sp.dir === "desc" ? "desc" : "asc",
    page: Math.max(1, Number(sp.page) || 1),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Inventory"
        title="Suppliers"
        description="Manage vendor contacts for purchase orders."
        actions={
          <Link
            href="/admin/suppliers/new"
            className="inline-flex h-12 items-center gap-2 rounded-3xl bg-green-500 px-6 font-medium text-cream-50 shadow-clay transition-colors hover:bg-green-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500 focus-visible:ring-offset-2"
          >
            <Icon name="plus" size={18} />
            Add Supplier
          </Link>
        }
      />
      <SuppliersClient
        rows={result.rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        pageCount={result.pageCount}
        filters={{ search: sp.q ?? "", active }}
        sort={parseSort(sp.sort)}
        dir={sp.dir === "desc" ? "desc" : "asc"}
      />
    </div>
  );
}
