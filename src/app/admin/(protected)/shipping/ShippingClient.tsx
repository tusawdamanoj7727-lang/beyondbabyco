"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import StatsCard from "@/components/admin/StatsCard";
import ShipmentStatusBadge from "@/components/admin/ShipmentStatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import { Select, fieldControlClasses } from "@/components/admin/FormField";
import type { ShipmentStatus } from "@/lib/supabase/database.types";
import {
  NDR_REASON_LABELS,
  PICKUP_STATUS_LABELS,
  type NdrListItem,
  type PickupListItem,
  type ShipmentLogisticsItem,
  type ShippingDashboard,
} from "@/lib/admin/shipping-types";
import {
  cancelShippingShipment,
  createNdrEvent,
  generateShippingLabel,
  reprintShippingLabel,
  resolveNdrEvent,
  scheduleShipmentPickup,
} from "@/lib/admin/shipping-actions";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ShippingClient(props: {
  rows: ShipmentLogisticsItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  dashboard: ShippingDashboard;
  ndrs: NdrListItem[];
  pickups: PickupListItem[];
  carriers: { id: string; name: string; provider: string }[];
  warehouses: { id: string; name: string; code: string }[];
  filters: { search: string; status: ShipmentStatus | "all"; warehouseId: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState(props.filters.search);
  const [pending, startTransition] = useTransition();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [pickupCarrier, setPickupCarrier] = useState("");
  const [pickupWarehouse, setPickupWarehouse] = useState("");
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => setSearch(props.filters.search), [props.filters.search]);
  useEffect(() => {
    const t = setTimeout(() => { if (search !== props.filters.search) push({ q: search }); }, 350);
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
    router.push(`/admin/shipping?${sp.toString()}`);
  }

  function run(action: () => Promise<{ ok: boolean; error: string | null }>) {
    startTransition(async () => {
      const res = await action();
      notifyActionResult(toast, res);
      router.refresh();
    });
  }

  const columns: Column<ShipmentLogisticsItem>[] = [
    { key: "order", header: "Order", render: (r) => <Link href={`/admin/orders/${r.orderId}`} className="font-semibold text-green-800 hover:underline">{r.orderNumber}</Link> },
    { key: "customer", header: "Customer", render: (r) => r.customerName },
    { key: "carrier", header: "Carrier", render: (r) => r.carrier ?? "—" },
    { key: "tracking", header: "Tracking", render: (r) => r.trackingNumber ?? "—" },
    { key: "status", header: "Status", render: (r) => <ShipmentStatusBadge status={r.status} /> },
    { key: "warehouse", header: "Warehouse", render: (r) => r.warehouseName ?? "—" },
    { key: "eta", header: "Est. delivery", render: (r) => formatDate(r.estimatedDelivery) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {!r.labelUrl && r.status === "pending" && (
            <button type="button" onClick={() => run(() => generateShippingLabel(r.id, r.carrierId ?? undefined))} className="rounded-lg px-2 py-1 text-xs text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">Label</button>
          )}
          {r.labelUrl && (
            <a href={r.labelUrl} target="_blank" rel="noreferrer" className="rounded-lg px-2 py-1 text-xs text-green-700 hover:bg-green-50">Print</a>
          )}
          {r.trackingNumber && (
            <button type="button" onClick={() => run(() => reprintShippingLabel(r.id))} className="rounded-lg px-2 py-1 text-xs text-green-700/70 hover:bg-green-50">Reprint</button>
          )}
          {r.status !== "delivered" && r.status !== "returned" && (
            <button type="button" onClick={() => setCancelId(r.id)} className="rounded-lg px-2 py-1 text-xs text-terra-600 hover:bg-terra-50">Cancel</button>
          )}
          <button type="button" onClick={() => run(() => createNdrEvent({ shipment_id: r.id, reason: "customer_unavailable" }))} className="rounded-lg px-2 py-1 text-xs text-green-700/70 hover:bg-green-50">NDR</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <StatsCard label="Pending Shipments" value={String(props.dashboard.pendingShipments)} icon="orders" />
        <StatsCard label="Ready to Ship" value={String(props.dashboard.readyToShip)} icon="activity" />
        <StatsCard label="Missing AWB" value={String(props.dashboard.missingAwb)} icon="activity" />
        <StatsCard label="Today's Pickups" value={String(props.dashboard.todaysPickups)} icon="inventory" />
        <StatsCard label="Failed Deliveries" value={String(props.dashboard.failedDeliveries)} icon="reports" />
        <StatsCard label="Delivered" value={String(props.dashboard.deliveredShipments)} icon="orders" />
        <StatsCard label="NDR Count" value={String(props.dashboard.ndrCount)} icon="reviews" />
        <StatsCard label="RTO Count" value={String(props.dashboard.rtoCount)} icon="activity" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center" role="search" aria-label="Shipment filters">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, tracking…" aria-label="Search shipments" className={fieldControlClasses + " flex-1"} />
        <Select aria-label="Status filter" value={props.filters.status} onChange={(e) => push({ status: e.target.value })} className="lg:w-40">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="label_created">Label Created</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
          <option value="returned">Returned</option>
        </Select>
        <Select aria-label="Warehouse filter" value={props.filters.warehouseId || "all"} onChange={(e) => push({ warehouse: e.target.value === "all" ? null : e.target.value })} className="lg:w-44">
          <option value="all">All warehouses</option>
          {props.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </Select>
        <Button size="sm" onClick={() => setPickupOpen(true)}>Schedule Pickup</Button>
      </div>

      <DataTable columns={columns} rows={props.rows} getRowId={(r) => r.id} empty="No shipments found." />
      <Pagination page={props.page} pageCount={props.pageCount} total={props.total} perPage={props.perPage} onPageChange={(p) => push({ page: String(p) }, false)} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-cream-200 bg-white p-4" aria-labelledby="ndr-heading">
          <h2 id="ndr-heading" className="font-heading text-sm font-bold text-green-900">NDR Dashboard</h2>
          {props.ndrs.length === 0 ? (
            <p className="mt-2 text-sm text-green-700/60">No NDR events.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {props.ndrs.map((n) => (
                <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>{n.orderNumber} · {NDR_REASON_LABELS[n.reason]}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={n.status === "open" ? "warning" : "default"} size="sm">{n.status}</Badge>
                    {n.status === "open" && (
                      <button type="button" onClick={() => run(() => resolveNdrEvent({ id: n.id, status: "resolved" }))} className="text-green-700 hover:underline text-xs">Resolve</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-cream-200 bg-white p-4" aria-labelledby="pickups-heading">
          <h2 id="pickups-heading" className="font-heading text-sm font-bold text-green-900">Pickup Requests</h2>
          {props.pickups.length === 0 ? (
            <p className="mt-2 text-sm text-green-700/60">No pickup requests.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {props.pickups.map((p) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <span>{p.carrierName ?? "—"} · {p.warehouseName ?? "—"} · {formatDate(p.pickupDate)}</span>
                  <Badge variant="info" size="sm">{PICKUP_STATUS_LABELS[p.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)} title="Cancel this shipment?" confirmLabel="Cancel shipment" tone="danger" loading={pending} onConfirm={() => { if (cancelId) run(() => cancelShippingShipment(cancelId)); setCancelId(null); }} />
      <ConfirmDialog
        open={pickupOpen}
        onOpenChange={setPickupOpen}
        title="Schedule carrier pickup"
        confirmLabel="Schedule"
        loading={pending}
        description={
          <div className="mt-3 space-y-3">
            <Select aria-label="Carrier" value={pickupCarrier} onChange={(e) => setPickupCarrier(e.target.value)}>
              <option value="">Select carrier</option>
              {props.carriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select aria-label="Warehouse" value={pickupWarehouse} onChange={(e) => setPickupWarehouse(e.target.value)}>
              <option value="">Select warehouse</option>
              {props.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
            <input type="date" aria-label="Pickup date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className={fieldControlClasses} />
          </div>
        }
        onConfirm={() => {
          run(() => scheduleShipmentPickup({ carrier_id: pickupCarrier || null, warehouse_id: pickupWarehouse || null, pickup_date: pickupDate }));
          setPickupOpen(false);
        }}
      />
    </div>
  );
}
