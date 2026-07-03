import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import Icon from "@/components/admin/Icon";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  getInventoryDashboard,
  getProductOptions,
  getVariantOptions,
  listInventory,
  listPurchaseOrders,
} from "@/lib/admin/inventory";
import { getWarehouseOptions } from "@/lib/admin/warehouses";
import { getSupplierOptions } from "@/lib/admin/suppliers";
import {
  INVENTORY_SORTABLE_COLUMNS,
  STOCK_STATUSES,
  type InventorySortColumn,
  type StockStatusFilter,
} from "@/lib/admin/inventory-types";
import InventoryClient from "./InventoryClient";

export const metadata: Metadata = { title: "Inventory" };

function parseStock(v: string | undefined): StockStatusFilter {
  return (STOCK_STATUSES as readonly string[]).includes(v ?? "") ? (v as StockStatusFilter) : "all";
}

function parseSort(v: string | undefined): InventorySortColumn {
  return (INVENTORY_SORTABLE_COLUMNS as readonly string[]).includes(v ?? "")
    ? (v as InventorySortColumn)
    : "updated_at";
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
  const sp = await searchParams;

  const [result, dashboard, purchaseOrders, warehouses, products, variants, suppliers] = await Promise.all([
    listInventory({
      search: sp.q ?? "",
      warehouseId: sp.warehouse,
      productId: sp.product,
      stockStatus: parseStock(sp.stock),
      sort: parseSort(sp.sort),
      dir: sp.dir === "asc" ? "asc" : "desc",
      page: Math.max(1, Number(sp.page) || 1),
    }),
    getInventoryDashboard(),
    listPurchaseOrders({ status: "all" }),
    getWarehouseOptions(),
    getProductOptions(),
    getVariantOptions(),
    getSupplierOptions(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Inventory"
        title="Stock & Warehouse"
        description="Monitor levels, adjust stock, manage purchase orders and incoming shipments."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/inventory/adjustments" className="inline-flex h-10 items-center gap-2 rounded-3xl border border-cream-300 bg-cream-50 px-4 text-sm font-medium text-green-800 hover:bg-cream-100">
              <Icon name="audit" size={16} /> Adjustments
            </Link>
            <Link href="/admin/warehouses" className="inline-flex h-10 items-center gap-2 rounded-3xl border border-cream-300 bg-cream-50 px-4 text-sm font-medium text-green-800 hover:bg-cream-100">
              Warehouses
            </Link>
            <Link href="/admin/suppliers" className="inline-flex h-10 items-center gap-2 rounded-3xl border border-cream-300 bg-cream-50 px-4 text-sm font-medium text-green-800 hover:bg-cream-100">
              Suppliers
            </Link>
          </div>
        }
      />

      <InventoryClient
        rows={result.rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        pageCount={result.pageCount}
        dashboard={dashboard}
        purchaseOrders={purchaseOrders.rows}
        warehouses={warehouses}
        products={products}
        variants={variants}
        suppliers={suppliers}
        filters={{
          search: sp.q ?? "",
          warehouseId: sp.warehouse ?? "",
          productId: sp.product ?? "",
          stockStatus: parseStock(sp.stock),
        }}
        sort={parseSort(sp.sort)}
        dir={sp.dir === "asc" ? "asc" : "desc"}
      />
    </div>
  );
}
