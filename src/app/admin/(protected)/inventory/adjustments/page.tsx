import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import Icon from "@/components/admin/Icon";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listStockMovements, getVariantOptions } from "@/lib/admin/inventory";
import { getWarehouseOptions } from "@/lib/admin/warehouses";
import { MOVEMENT_TYPES, type MovementType } from "@/lib/admin/inventory-types";
import AdjustmentsClient from "./AdjustmentsClient";

export const metadata: Metadata = { title: "Stock Adjustments" };

function parseType(v: string | undefined): MovementType | "all" {
  return (MOVEMENT_TYPES as readonly string[]).includes(v ?? "") ? (v as MovementType) : "all";
}

export default async function AdjustmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
  const sp = await searchParams;

  const [movements, warehouses, variants] = await Promise.all([
    listStockMovements({
      search: sp.q ?? "",
      type: parseType(sp.type),
      page: Math.max(1, Number(sp.page) || 1),
    }),
    getWarehouseOptions(),
    getVariantOptions(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Inventory"
        title="Stock Adjustments"
        description="Manual adjustments and full movement history."
        actions={
          <Link href="/admin/inventory" className="inline-flex h-10 items-center gap-2 rounded-3xl border border-cream-300 bg-cream-50 px-4 text-sm font-medium text-green-800 hover:bg-cream-100">
            <Icon name="chevronLeft" size={16} /> Back to inventory
          </Link>
        }
      />
      <AdjustmentsClient
        movements={movements.movements}
        total={movements.total}
        page={movements.page}
        perPage={20}
        pageCount={movements.pageCount}
        filters={{ search: sp.q ?? "", type: parseType(sp.type) }}
        warehouses={warehouses}
        variants={variants.map((v) => ({ id: v.id, label: v.label }))}
      />
    </div>
  );
}
