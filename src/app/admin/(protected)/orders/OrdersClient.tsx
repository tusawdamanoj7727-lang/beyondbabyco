"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import BulkActions from "@/components/admin/BulkActions";
import StatsCard from "@/components/admin/StatsCard";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import PaymentStatusBadge from "@/components/admin/PaymentStatusBadge";
import ShipmentStatusBadge from "@/components/admin/ShipmentStatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Select, fieldControlClasses } from "@/components/admin/FormField";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderDashboard,
  type OrderListItem,
} from "@/lib/admin/order-types";
import type { OrderStatus, PaymentStatus, ShipmentStatus } from "@/lib/supabase/database.types";
import { bulkCancelOrders } from "@/lib/admin/order-actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatMoney(n: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export default function OrdersClient(props: {
  rows: OrderListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  dashboard: OrderDashboard;
  warehouses: { id: string; name: string; code: string }[];
  customers: { id: string; name: string }[];
  filters: {
    search: string;
    status: OrderStatus | "all";
    payment: PaymentStatus | "all";
    shipment: ShipmentStatus | "all";
    warehouseId: string;
    customerId: string;
    dateFrom: string;
    dateTo: string;
  };
  sort: string;
  dir: "asc" | "desc";
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState(props.filters.search);
  const [bulkCancelOpen, setBulkCancelOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => setSelectedIds([]), [props.rows]);
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
      payment: props.filters.payment,
      shipment: props.filters.shipment,
      warehouse: props.filters.warehouseId,
      customer: props.filters.customerId,
      from: props.filters.dateFrom,
      to: props.filters.dateTo,
      sort: props.sort,
      dir: props.dir,
      page: String(props.page),
    };
    const merged = { ...base, ...patch };
    if (resetPage && !("page" in patch)) merged.page = "1";
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") sp.set(k, v);
    }
    router.push(`/admin/orders?${sp.toString()}`);
  }

  function onSort(key: string) {
    const nextDir = props.sort === key && props.dir === "asc" ? "desc" : "asc";
    push({ sort: key, dir: nextDir });
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? props.rows.map((r) => r.id) : []);
  }

  const columns: Column<OrderListItem>[] = [
    {
      key: "order_number",
      header: "Order",
      sortable: true,
      sortKey: "order_number",
      render: (r) => (
        <Link href={`/admin/orders/${r.id}`} className="font-semibold text-green-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500">
          {r.orderNumber}
        </Link>
      ),
    },
    { key: "customer", header: "Customer", render: (r) => r.customerName },
    { key: "items", header: "Items", align: "right", render: (r) => r.itemCount },
    { key: "payment", header: "Payment", render: (r) => <PaymentStatusBadge status={r.paymentStatus} /> },
    { key: "order_status", header: "Order", render: (r) => <OrderStatusBadge status={r.orderStatus} /> },
    {
      key: "shipment",
      header: "Shipment",
      render: (r) => (r.shipmentStatus ? <ShipmentStatusBadge status={r.shipmentStatus} /> : "—"),
    },
    { key: "warehouse", header: "Warehouse", render: (r) => r.warehouseName ?? "—" },
    {
      key: "total",
      header: "Total",
      sortable: true,
      sortKey: "grand_total",
      align: "right",
      render: (r) => formatMoney(r.total, r.currency),
    },
    { key: "created", header: "Created", sortable: true, sortKey: "created_at", render: (r) => formatDate(r.createdAt) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Link href={`/admin/orders/${r.id}`} className="rounded-lg px-2 py-1 text-sm font-medium text-green-700 hover:bg-green-50" aria-label={`View ${r.orderNumber}`}>
            View
          </Link>
          <a href={`/admin/orders/${r.id}/documents/invoice`} target="_blank" rel="noreferrer" className="rounded-lg px-2 py-1 text-sm text-green-700/70 hover:bg-green-50">
            Invoice
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <StatsCard label="Today's orders" value={String(props.dashboard.todayOrders)} icon="orders" />
        <StatsCard label="Pending" value={String(props.dashboard.pending)} icon="activity" />
        <StatsCard label="Packed" value={String(props.dashboard.packed)} icon="inventory" />
        <StatsCard label="Shipped" value={String(props.dashboard.shipped)} icon="orders" />
        <StatsCard label="Returns" value={String(props.dashboard.returns)} icon="audit" />
        <StatsCard label="Revenue (today)" value={formatMoney(props.dashboard.revenue)} icon="revenue" />
        <StatsCard label="Avg order value" value={formatMoney(props.dashboard.averageOrderValue)} icon="revenue" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center" role="search" aria-label="Order filters">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order # or customer…"
          aria-label="Search orders"
          className={fieldControlClasses + " flex-1 min-w-[200px]"}
        />
        <Select aria-label="Status filter" value={props.filters.status} onChange={(e) => push({ status: e.target.value })} className="lg:w-36">
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </Select>
        <Select aria-label="Payment filter" value={props.filters.payment} onChange={(e) => push({ payment: e.target.value })} className="lg:w-36">
          <option value="all">All payments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
          <option value="partially_refunded">Partially Refunded</option>
        </Select>
        <Select aria-label="Shipment filter" value={props.filters.shipment} onChange={(e) => push({ shipment: e.target.value })} className="lg:w-36">
          <option value="all">All shipments</option>
          <option value="pending">Pending</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
        </Select>
        <Select aria-label="Warehouse filter" value={props.filters.warehouseId || "all"} onChange={(e) => push({ warehouse: e.target.value === "all" ? null : e.target.value })} className="lg:w-40">
          <option value="all">All warehouses</option>
          {props.warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </Select>
        <Select aria-label="Customer filter" value={props.filters.customerId || "all"} onChange={(e) => push({ customer: e.target.value === "all" ? null : e.target.value })} className="lg:w-44">
          <option value="all">All customers</option>
          {props.customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <input type="date" aria-label="From date" value={props.filters.dateFrom} onChange={(e) => push({ from: e.target.value || null })} className={fieldControlClasses + " lg:w-40"} />
        <input type="date" aria-label="To date" value={props.filters.dateTo} onChange={(e) => push({ to: e.target.value || null })} className={fieldControlClasses + " lg:w-40"} />
      </div>

      <BulkActions
        count={selectedIds.length}
        loading={pending}
        onDelete={() => setBulkCancelOpen(true)}
        deleteLabel="Cancel orders"
        onClear={() => setSelectedIds([])}
      />

      <DataTable
        columns={columns}
        rows={props.rows}
        getRowId={(r) => r.id}
        selectable
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        sort={{ key: props.sort, dir: props.dir }}
        onSort={onSort}
        empty="No orders match your filters."
      />

      <Pagination page={props.page} pageCount={props.pageCount} total={props.total} perPage={props.perPage} onPageChange={(p) => push({ page: String(p) }, false)} />

      <ConfirmDialog
        open={bulkCancelOpen}
        onOpenChange={setBulkCancelOpen}
        title="Cancel selected orders?"
        description="This will release reserved stock for orders not yet shipped."
        confirmLabel="Cancel orders"
        tone="danger"
        onConfirm={() => {
          startTransition(async () => {
            await bulkCancelOrders(selectedIds, "Bulk cancellation");
            setSelectedIds([]);
            setBulkCancelOpen(false);
            router.refresh();
          });
        }}
      />
    </div>
  );
}
