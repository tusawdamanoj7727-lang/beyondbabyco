import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import Icon from "@/components/admin/Icon";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listWarehouses, WAREHOUSE_SORTABLE_COLUMNS, type WarehouseSortColumn } from "@/lib/admin/warehouses";
import type { WarehouseStatus } from "@/lib/admin/inventory-types";
import WarehousesClient from "./WarehousesClient";

export const metadata: Metadata = { title: "Warehouses" };

const STATUSES = ["all", "active", "inactive"] as const;

function parseStatus(v: string | undefined): WarehouseStatus | "all" {
  return (STATUSES as readonly string[]).includes(v ?? "") ? (v as WarehouseStatus | "all") : "all";
}

function parseSort(v: string | undefined): WarehouseSortColumn {
  return (WAREHOUSE_SORTABLE_COLUMNS as readonly string[]).includes(v ?? "")
    ? (v as WarehouseSortColumn)
    : "name";
}

export default async function WarehousesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
  const sp = await searchParams;

  const result = await listWarehouses({
    search: sp.q ?? "",
    status: parseStatus(sp.status),
    sort: parseSort(sp.sort),
    dir: sp.dir === "desc" ? "desc" : "asc",
    page: Math.max(1, Number(sp.page) || 1),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Inventory"
        title="Warehouses"
        description="Manage stock locations, defaults and contact details."
        actions={
          <Link
            href="/admin/warehouses/new"
            className="inline-flex h-12 items-center gap-2 rounded-3xl bg-green-500 px-6 font-medium text-cream-50 shadow-clay transition-colors hover:bg-green-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500 focus-visible:ring-offset-2"
          >
            <Icon name="plus" size={18} />
            Add Warehouse
          </Link>
        }
      />
      <WarehousesClient
        rows={result.rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        pageCount={result.pageCount}
        filters={{ search: sp.q ?? "", status: parseStatus(sp.status) }}
        sort={parseSort(sp.sort)}
        dir={sp.dir === "desc" ? "desc" : "asc"}
      />
    </div>
  );
}
