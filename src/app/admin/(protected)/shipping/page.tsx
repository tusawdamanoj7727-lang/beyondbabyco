import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  getShippingDashboard,
  getShippingFilterOptions,
  listNdrEvents,
  listPickups,
  listShippingShipments,
} from "@/lib/admin/shipping";
import type { ShipmentStatus } from "@/lib/supabase/database.types";
import ShippingClient from "./ShippingClient";

export const metadata: Metadata = { title: "Shipping & Logistics" };

const STATUSES = ["all", "pending", "label_created", "in_transit", "out_for_delivery", "delivered", "failed", "returned"] as const;

export default async function ShippingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.SHIPPING_MANAGE);

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = (STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as ShipmentStatus | "all") : "all";

  const [result, dashboard, options, ndrs, pickups] = await Promise.all([
    listShippingShipments({ search: sp.q ?? "", status, warehouseId: sp.warehouse, page }),
    getShippingDashboard(),
    getShippingFilterOptions(),
    listNdrEvents(20),
    listPickups(20),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Operations"
        title="Shipping & Logistics"
        description="Manage carriers, shipments, pickups, tracking and NDR"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/shipping/carriers" className="inline-flex h-11 items-center rounded-3xl border border-green-200 px-4 text-sm font-medium text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">Carriers</Link>
            <Link href="/admin/shipping/zones" className="inline-flex h-11 items-center rounded-3xl border border-green-200 px-4 text-sm font-medium text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">Zones</Link>
            <Link href="/admin/shipping/rates" className="inline-flex h-11 items-center rounded-3xl border border-green-200 px-4 text-sm font-medium text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">Rates</Link>
          </div>
        }
      />
      <ShippingClient
        rows={result.rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        pageCount={result.pageCount}
        dashboard={dashboard}
        ndrs={ndrs}
        pickups={pickups}
        carriers={options.carriers}
        warehouses={options.warehouses}
        filters={{ search: sp.q ?? "", status, warehouseId: sp.warehouse ?? "" }}
      />
    </div>
  );
}
