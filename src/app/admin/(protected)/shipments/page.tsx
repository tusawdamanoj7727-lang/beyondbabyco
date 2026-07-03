import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import Icon from "@/components/admin/Icon";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getOrderFilterOptions, listShipments } from "@/lib/admin/orders";
import type { ShipmentStatus } from "@/lib/supabase/database.types";
import ShipmentsClient from "./ShipmentsClient";

export const metadata: Metadata = { title: "Shipments" };

const SHIPMENT_STATUSES = ["all", "pending", "label_created", "in_transit", "out_for_delivery", "delivered", "failed", "returned"] as const;

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.ORDERS_MANAGE);

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = (SHIPMENT_STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as ShipmentStatus | "all") : "all";

  const [result, options] = await Promise.all([
    listShipments({ search: sp.q ?? "", status, warehouseId: sp.warehouse, page }),
    getOrderFilterOptions(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Sales"
        title="Shipments"
        description="Track outbound shipments and delivery status"
        actions={
          <Link
            href="/admin/orders"
            className="inline-flex h-12 items-center gap-2 rounded-3xl border border-green-200 bg-cream-50 px-5 font-medium text-green-800 transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500"
          >
            <Icon name="orders" size={18} />
            All Orders
          </Link>
        }
      />
      <ShipmentsClient
        rows={result.rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        pageCount={result.pageCount}
        warehouses={options.warehouses}
        filters={{ search: sp.q ?? "", status, warehouseId: sp.warehouse ?? "" }}
      />
    </div>
  );
}
