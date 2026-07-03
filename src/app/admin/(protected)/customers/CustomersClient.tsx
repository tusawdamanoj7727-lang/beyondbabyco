"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import BulkActions from "@/components/admin/BulkActions";
import StatsCard from "@/components/admin/StatsCard";
import CustomerStatusBadge from "@/components/admin/CustomerStatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Badge from "@/components/ui/Badge";
import { Select, fieldControlClasses } from "@/components/admin/FormField";
import {
  CUSTOMER_STATUSES,
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_SEGMENT_LABELS,
  customerInitials,
  type CustomerDashboard,
  type CustomerListItem,
  type CustomerStatus,
} from "@/lib/admin/customer-types";
import { bulkDeactivateCustomers, deleteCustomer, mergeCustomers } from "@/lib/admin/customer-actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function CustomersClient(props: {
  rows: CustomerListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  dashboard: CustomerDashboard;
  filterOptions: { cities: string[]; states: string[]; countries: string[] };
  filters: {
    search: string;
    city: string;
    state: string;
    country: string;
    status: CustomerStatus | "all";
    newsletter: boolean;
    vip: boolean;
    dateFrom: string;
    dateTo: string;
  };
  sort: string;
  dir: "asc" | "desc";
  trash: boolean;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState(props.filters.search);
  const [bulkDeactivateOpen, setBulkDeactivateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomerListItem | null>(null);
  const [mergeSource, setMergeSource] = useState<CustomerListItem | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState("");
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
      city: props.filters.city,
      state: props.filters.state,
      country: props.filters.country,
      status: props.filters.status,
      newsletter: props.filters.newsletter ? "1" : "",
      vip: props.filters.vip ? "1" : "",
      from: props.filters.dateFrom,
      to: props.filters.dateTo,
      sort: props.sort,
      dir: props.dir,
      page: String(props.page),
      trash: props.trash ? "1" : "",
    };
    const merged = { ...base, ...patch };
    if (resetPage && !("page" in patch)) merged.page = "1";
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") sp.set(k, v);
    }
    router.push(`/admin/customers?${sp.toString()}`);
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

  function exportCsv() {
    const sp = new URLSearchParams();
    if (props.filters.search) sp.set("q", props.filters.search);
    if (props.filters.status !== "all") sp.set("status", props.filters.status);
    if (props.filters.vip) sp.set("vip", "1");
    window.open(`/admin/customers/export?${sp.toString()}`, "_blank");
  }

  const columns: Column<CustomerListItem>[] = [
    {
      key: "avatar",
      header: "",
      headerClassName: "w-12",
      render: (r) => (
        <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-green-100 text-sm font-bold text-green-800 ring-1 ring-green-200" aria-hidden={!!r.avatarUrl}>
          {r.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            customerInitials(r.fullName)
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Customer",
      sortable: true,
      sortKey: "full_name",
      render: (r) => (
        <div>
          <Link href={`/admin/customers/${r.id}`} className="font-semibold text-green-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500">
            {r.fullName}
          </Link>
          {r.isVip && <Badge variant="info" size="sm" className="ml-2">VIP</Badge>}
        </div>
      ),
    },
    { key: "email", header: "Email", sortable: true, sortKey: "email", render: (r) => r.email ?? "—" },
    { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
    { key: "city", header: "City", render: (r) => r.city ?? "—" },
    { key: "orders", header: "Orders", sortable: true, sortKey: "order_count", align: "right", render: (r) => r.orderCount },
    {
      key: "ltv",
      header: "Lifetime Value",
      sortable: true,
      sortKey: "lifetime_value",
      align: "right",
      render: (r) => formatMoney(r.lifetimeValue),
    },
    {
      key: "last_order",
      header: "Last Order",
      sortable: true,
      sortKey: "last_order_at",
      render: (r) => (r.lastOrderAt ? formatDate(r.lastOrderAt) : "—"),
    },
    { key: "status", header: "Status", render: (r) => <CustomerStatusBadge status={r.status} /> },
    { key: "segment", header: "Segment", render: (r) => <Badge variant="default" size="sm">{CUSTOMER_SEGMENT_LABELS[r.segment]}</Badge> },
    { key: "created", header: "Created", sortable: true, sortKey: "created_at", render: (r) => formatDate(r.createdAt) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Link href={`/admin/customers/${r.id}`} className="rounded-lg px-2 py-1 text-sm font-medium text-green-700 hover:bg-green-50">View</Link>
          <Link href={`/admin/customers/${r.id}?tab=edit`} className="rounded-lg px-2 py-1 text-sm text-green-700/70 hover:bg-green-50">Edit</Link>
          <button type="button" onClick={() => { setMergeSource(r); setMergeTargetId(""); }} className="rounded-lg px-2 py-1 text-sm text-green-700/70 hover:bg-green-50">Merge</button>
          <button type="button" onClick={() => setDeleteTarget(r)} className="rounded-lg px-2 py-1 text-sm text-terra-600 hover:bg-terra-50">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatsCard label="Total customers" value={String(props.dashboard.totalCustomers)} icon="customers" />
        <StatsCard label="Active" value={String(props.dashboard.activeCustomers)} icon="activity" />
        <StatsCard label="VIP" value={String(props.dashboard.vipCustomers)} icon="sparkles" />
        <StatsCard label="New this month" value={String(props.dashboard.newThisMonth)} icon="plus" />
        <StatsCard label="Avg lifetime value" value={formatMoney(props.dashboard.averageLifetimeValue)} icon="revenue" />
        <StatsCard label="Abandoned carts" value={String(props.dashboard.abandonedCarts)} icon="orders" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center" role="search" aria-label="Customer filters">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone…" aria-label="Search customers" className={fieldControlClasses + " flex-1 min-w-[200px]"} />
        <Select aria-label="City filter" value={props.filters.city || "all"} onChange={(e) => push({ city: e.target.value === "all" ? null : e.target.value })} className="lg:w-36">
          <option value="all">All cities</option>
          {props.filterOptions.cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select aria-label="State filter" value={props.filters.state || "all"} onChange={(e) => push({ state: e.target.value === "all" ? null : e.target.value })} className="lg:w-36">
          <option value="all">All states</option>
          {props.filterOptions.states.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select aria-label="Country filter" value={props.filters.country || "all"} onChange={(e) => push({ country: e.target.value === "all" ? null : e.target.value })} className="lg:w-36">
          <option value="all">All countries</option>
          {props.filterOptions.countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select aria-label="Status filter" value={props.filters.status} onChange={(e) => push({ status: e.target.value })} className="lg:w-32">
          <option value="all">All statuses</option>
          {CUSTOMER_STATUSES.map((s) => <option key={s} value={s}>{CUSTOMER_STATUS_LABELS[s]}</option>)}
        </Select>
        <label className="flex items-center gap-2 text-sm text-green-800">
          <input type="checkbox" checked={props.filters.newsletter} onChange={(e) => push({ newsletter: e.target.checked ? "1" : null })} className="rounded border-green-300" />
          Newsletter
        </label>
        <label className="flex items-center gap-2 text-sm text-green-800">
          <input type="checkbox" checked={props.filters.vip} onChange={(e) => push({ vip: e.target.checked ? "1" : null })} className="rounded border-green-300" />
          VIP
        </label>
        <input type="date" aria-label="From date" value={props.filters.dateFrom} onChange={(e) => push({ from: e.target.value || null })} className={fieldControlClasses + " lg:w-40"} />
        <input type="date" aria-label="To date" value={props.filters.dateTo} onChange={(e) => push({ to: e.target.value || null })} className={fieldControlClasses + " lg:w-40"} />
        <button type="button" onClick={exportCsv} className="rounded-2xl border border-green-200 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500">Export</button>
      </div>

      <BulkActions
        count={selectedIds.length}
        loading={pending}
        onArchive={() => setBulkDeactivateOpen(true)}
        archiveLabel="Deactivate"
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
        empty="No customers match your filters."
      />

      <Pagination page={props.page} pageCount={props.pageCount} total={props.total} perPage={props.perPage} onPageChange={(p) => push({ page: String(p) }, false)} />

      <ConfirmDialog
        open={bulkDeactivateOpen}
        onOpenChange={setBulkDeactivateOpen}
        title="Deactivate selected customers?"
        description="They will no longer be marked as active."
        confirmLabel="Deactivate"
        tone="danger"
        loading={pending}
        onConfirm={() => {
          startTransition(async () => {
            await bulkDeactivateCustomers(selectedIds);
            setSelectedIds([]);
            setBulkDeactivateOpen(false);
            router.refresh();
          });
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete customer?"
        description={deleteTarget ? `Soft-delete ${deleteTarget.fullName}?` : undefined}
        confirmLabel="Delete"
        tone="danger"
        loading={pending}
        onConfirm={() => {
          if (!deleteTarget) return;
          startTransition(async () => {
            await deleteCustomer(deleteTarget.id);
            setDeleteTarget(null);
            router.refresh();
          });
        }}
      />

      <ConfirmDialog
        open={!!mergeSource}
        onOpenChange={(o) => !o && setMergeSource(null)}
        title={`Merge ${mergeSource?.fullName}?`}
        description={
          <div className="mt-2 space-y-2">
            <p className="text-sm">Select the primary customer to keep. All data from the source will move to them.</p>
            <Select aria-label="Merge into customer" value={mergeTargetId} onChange={(e) => setMergeTargetId(e.target.value)} className="w-full">
              <option value="">Select target customer…</option>
              {props.rows.filter((r) => r.id !== mergeSource?.id).map((r) => (
                <option key={r.id} value={r.id}>{r.fullName} ({r.email ?? "no email"})</option>
              ))}
            </Select>
          </div>
        }
        confirmLabel="Merge"
        tone="danger"
        loading={pending}
        onConfirm={() => {
          if (!mergeSource || !mergeTargetId) return;
          startTransition(async () => {
            await mergeCustomers(mergeTargetId, mergeSource.id);
            setMergeSource(null);
            router.push(`/admin/customers/${mergeTargetId}`);
          });
        }}
      />
    </div>
  );
}
