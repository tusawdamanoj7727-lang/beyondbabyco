"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import ShipmentStatusBadge from "@/components/admin/ShipmentStatusBadge";
import { Select, fieldControlClasses } from "@/components/admin/FormField";
import type { ShipmentListItem } from "@/lib/admin/order-types";
import type { ShipmentStatus } from "@/lib/supabase/database.types";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ShipmentsClient(props: {
  rows: ShipmentListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  warehouses: { id: string; name: string; code: string }[];
  filters: { search: string; status: ShipmentStatus | "all"; warehouseId: string };
}) {
  const router = useRouter();
  const [search, setSearch] = useState(props.filters.search);

  useEffect(() => setSearch(props.filters.search), [props.filters.search]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== props.filters.search) push({ q: search });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function push(patch: Record<string, string | null>, resetPage = true) {
    const sp = new URLSearchParams();
    const base: Record<string, string> = {
      q: props.filters.search,
      status: props.filters.status,
      warehouse: props.filters.warehouseId,
      page: String(props.page),
    };
    const merged = { ...base, ...patch };
    if (resetPage && !("page" in patch)) merged.page = "1";
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") sp.set(k, v);
    }
    router.push(`/admin/shipments?${sp.toString()}`);
  }

  const columns: Column<ShipmentListItem>[] = [
    {
      key: "order",
      header: "Order",
      render: (r) => (
        <Link href={`/admin/orders/${r.orderId}`} className="font-semibold text-green-800 hover:underline">
          {r.orderNumber}
        </Link>
      ),
    },
    { key: "customer", header: "Customer", render: (r) => r.customerName },
    { key: "carrier", header: "Courier", render: (r) => r.carrier ?? "—" },
    { key: "tracking", header: "Tracking", render: (r) => r.trackingNumber ?? "—" },
    { key: "status", header: "Status", render: (r) => <ShipmentStatusBadge status={r.status} /> },
    { key: "warehouse", header: "Warehouse", render: (r) => r.warehouseName ?? "—" },
    { key: "shipped", header: "Shipped", render: (r) => formatDate(r.shippedAt) },
    { key: "delivered", header: "Delivered", render: (r) => formatDate(r.deliveredAt) },
    { key: "eta", header: "Est. delivery", render: (r) => formatDate(r.estimatedDelivery) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Link href={`/admin/orders/${r.orderId}`} className="rounded-lg px-2 py-1 text-sm font-medium text-green-700 hover:bg-green-50">
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center" role="search" aria-label="Shipment filters">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order, tracking, carrier…"
          aria-label="Search shipments"
          className={fieldControlClasses + " flex-1"}
        />
        <Select aria-label="Status filter" value={props.filters.status} onChange={(e) => push({ status: e.target.value })} className="lg:w-40">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="returned">Returned</option>
        </Select>
        <Select aria-label="Warehouse filter" value={props.filters.warehouseId || "all"} onChange={(e) => push({ warehouse: e.target.value === "all" ? null : e.target.value })} className="lg:w-44">
          <option value="all">All warehouses</option>
          {props.warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </Select>
      </div>

      <DataTable columns={columns} rows={props.rows} getRowId={(r) => r.id} empty="No shipments found." />
      <Pagination page={props.page} pageCount={props.pageCount} total={props.total} perPage={props.perPage} onPageChange={(p) => push({ page: String(p) }, false)} />
    </div>
  );
}
