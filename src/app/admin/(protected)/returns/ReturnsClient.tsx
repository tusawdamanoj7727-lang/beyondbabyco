"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import StatsCard from "@/components/admin/StatsCard";
import ReturnStatusBadge, { RefundStatusBadge } from "@/components/admin/ReturnStatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Select, fieldControlClasses } from "@/components/admin/FormField";
import {
  REFUND_STATUSES,
  REFUND_STATUS_LABELS,
  RETURN_REASONS,
  RETURN_REASON_LABELS,
  RETURN_STATUSES,
  RETURN_STATUS_LABELS,
  type RefundStatus,
  type ReturnDashboard,
  type ReturnListItem,
  type ReturnReason,
  type ReturnStatus,
} from "@/lib/admin/return-types";
import { bulkApproveReturns, bulkCloseReturns, bulkRejectReturns } from "@/lib/admin/return-actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReturnsClient(props: {
  rows: ReturnListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  dashboard: ReturnDashboard;
  warehouses: { id: string; name: string; code: string }[];
  customers: { id: string; name: string }[];
  filters: {
    search: string;
    status: ReturnStatus | "all";
    reason: ReturnReason | "all";
    refundStatus: RefundStatus | "all";
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
  const [bulkAction, setBulkAction] = useState<"approve" | "reject" | "close" | null>(null);
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
      reason: props.filters.reason,
      refund: props.filters.refundStatus,
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
    router.push(`/admin/returns?${sp.toString()}`);
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

  function runBulk() {
    if (!bulkAction || !selectedIds.length) return;
    startTransition(async () => {
      if (bulkAction === "approve") await bulkApproveReturns(selectedIds);
      if (bulkAction === "reject") await bulkRejectReturns(selectedIds);
      if (bulkAction === "close") await bulkCloseReturns(selectedIds);
      setSelectedIds([]);
      setBulkAction(null);
      router.refresh();
    });
  }

  const columns: Column<ReturnListItem>[] = [
    {
      key: "rma",
      header: "RMA Number",
      sortable: true,
      sortKey: "rma_number",
      render: (r) => (
        <Link href={`/admin/returns/${r.id}`} className="font-semibold text-green-800 hover:underline">
          {r.rmaNumber}
        </Link>
      ),
    },
    {
      key: "order",
      header: "Order Number",
      render: (r) => (
        <Link href={`/admin/orders/${r.orderId}`} className="text-green-700 hover:underline">
          {r.orderNumber}
        </Link>
      ),
    },
    { key: "customer", header: "Customer", render: (r) => r.customerName },
    { key: "items", header: "Items", align: "right", render: (r) => r.itemCount },
    { key: "reason", header: "Reason", sortable: true, sortKey: "reason", render: (r) => RETURN_REASON_LABELS[r.reason] },
    { key: "status", header: "Status", sortable: true, sortKey: "status", render: (r) => <ReturnStatusBadge status={r.status} /> },
    { key: "refund", header: "Refund Status", render: (r) => <RefundStatusBadge status={r.refundStatus} /> },
    { key: "warehouse", header: "Warehouse", render: (r) => r.warehouseName ?? "—" },
    { key: "created", header: "Created", sortable: true, sortKey: "created_at", render: (r) => formatDate(r.createdAt) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Link
          href={`/admin/returns/${r.id}`}
          className="rounded-lg px-2 py-1 text-sm font-medium text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatsCard label="Pending Returns" value={String(props.dashboard.pendingReturns)} icon="activity" />
        <StatsCard label="Awaiting Inspection" value={String(props.dashboard.awaitingInspection)} icon="inventory" />
        <StatsCard label="Refund Queue" value={String(props.dashboard.refundQueue)} icon="payments" />
        <StatsCard label="Completed Returns" value={String(props.dashboard.completedReturns)} icon="orders" />
        <StatsCard label="Return Rate" value={`${props.dashboard.returnRate}%`} icon="reports" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center" role="search" aria-label="Return filters">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search RMA, order, customer…"
          aria-label="Search returns"
          className={fieldControlClasses + " min-w-[200px] flex-1"}
        />
        <Select aria-label="Status filter" value={props.filters.status} onChange={(e) => push({ status: e.target.value })} className="lg:w-40">
          <option value="all">All statuses</option>
          {RETURN_STATUSES.map((s) => (
            <option key={s} value={s}>
              {RETURN_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select aria-label="Reason filter" value={props.filters.reason} onChange={(e) => push({ reason: e.target.value })} className="lg:w-44">
          <option value="all">All reasons</option>
          {RETURN_REASONS.map((s) => (
            <option key={s} value={s}>
              {RETURN_REASON_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select aria-label="Refund status filter" value={props.filters.refundStatus} onChange={(e) => push({ refund: e.target.value })} className="lg:w-40">
          <option value="all">All refund statuses</option>
          {REFUND_STATUSES.map((s) => (
            <option key={s} value={s}>
              {REFUND_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select aria-label="Warehouse filter" value={props.filters.warehouseId || "all"} onChange={(e) => push({ warehouse: e.target.value === "all" ? null : e.target.value })} className="lg:w-44">
          <option value="all">All warehouses</option>
          {props.warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Customer filter" value={props.filters.customerId || "all"} onChange={(e) => push({ customer: e.target.value === "all" ? null : e.target.value })} className="lg:w-44">
          <option value="all">All customers</option>
          {props.customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <input type="date" aria-label="From date" value={props.filters.dateFrom} onChange={(e) => push({ from: e.target.value || null })} className={fieldControlClasses + " lg:w-40"} />
        <input type="date" aria-label="To date" value={props.filters.dateTo} onChange={(e) => push({ to: e.target.value || null })} className={fieldControlClasses + " lg:w-40"} />
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-3xl border border-green-200 bg-green-50 px-4 py-3" role="region" aria-label="Bulk return actions">
          <span className="text-sm font-semibold text-green-800">{selectedIds.length} selected</span>
          <button type="button" onClick={() => setBulkAction("approve")} className="rounded-xl px-3 py-1 text-sm font-medium text-green-700 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">
            Approve
          </button>
          <button type="button" onClick={() => setBulkAction("reject")} className="rounded-xl px-3 py-1 text-sm font-medium text-green-700 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">
            Reject
          </button>
          <button type="button" onClick={() => setBulkAction("close")} className="rounded-xl px-3 py-1 text-sm font-medium text-green-700 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">
            Close
          </button>
          <button type="button" onClick={() => setSelectedIds([])} className="ml-auto rounded-xl px-3 py-1 text-sm text-green-700/60 hover:bg-green-100">
            Clear
          </button>
        </div>
      )}

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
        empty="No returns match your filters."
      />

      <Pagination page={props.page} pageCount={props.pageCount} total={props.total} perPage={props.perPage} onPageChange={(p) => push({ page: String(p) }, false)} />

      <ConfirmDialog
        open={!!bulkAction}
        onOpenChange={(o) => !o && setBulkAction(null)}
        title={`${bulkAction ? bulkAction.charAt(0).toUpperCase() + bulkAction.slice(1) : ""} ${selectedIds.length} returns?`}
        confirmLabel={bulkAction ?? "Confirm"}
        tone={bulkAction === "reject" ? "danger" : "default"}
        loading={pending}
        onConfirm={runBulk}
      />
    </div>
  );
}
