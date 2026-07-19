"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import StatsCard from "@/components/admin/StatsCard";
import DeleteDialog from "@/components/admin/DeleteDialog";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import CouponDisplayBadge, { CouponTypeBadge } from "@/components/admin/CouponStatusBadge";
import { Select, fieldControlClasses } from "@/components/admin/FormField";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import {
  COUPON_LIFECYCLE,
  COUPON_LIFECYCLE_LABELS,
  COUPON_TYPES,
  COUPON_TYPE_LABELS,
  type CouponDashboard,
  type CouponDisplayStatus,
  type CouponLifecycle,
  type CouponListItem,
  type CouponType,
  type GiftCardListItem,
} from "@/lib/admin/coupon-types";
import {
  activateCoupon,
  bulkActivateCoupons,
  bulkArchiveCoupons,
  bulkDeleteCoupons,
  createGiftCard,
  deactivateCoupon,
  deactivateGiftCard,
  deleteCoupon,
  duplicateCoupon,
} from "@/lib/admin/coupon-actions";

const DISPLAY_FILTERS: { value: CouponDisplayStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expired", label: "Expired" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatValue(row: CouponListItem) {
  if (row.promoType === "percentage" || row.promoType === "automatic") return `${row.value}%`;
  if (row.promoType === "free_shipping") return "Free ship";
  return `₹${row.value}`;
}

export default function CouponsClient(props: {
  rows: CouponListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  dashboard: CouponDashboard;
  giftCards: GiftCardListItem[];
  customers: { id: string; name: string }[];
  filters: {
    search: string;
    promoType: CouponType | "all";
    lifecycle: CouponLifecycle | "all";
    displayStatus: CouponDisplayStatus | "all";
    customerId: string;
    dateFrom: string;
    dateTo: string;
  };
  sort: string;
  dir: "asc" | "desc";
  trash: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState(props.filters.search);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [rowDelete, setRowDelete] = useState<CouponListItem | null>(null);
  const [giftAmount, setGiftAmount] = useState("500");
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
      type: props.filters.promoType,
      lifecycle: props.filters.lifecycle,
      status: props.filters.displayStatus,
      customer: props.filters.customerId,
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
    router.push(`/admin/coupons?${sp.toString()}`);
  }

  function onSort(key: string) {
    push({ sort: key, dir: props.sort === key && props.dir === "asc" ? "desc" : "asc" });
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? props.rows.map((r) => r.id) : []);
  }

  function run(action: () => Promise<{ ok: boolean; error: string | null }>) {
    startTransition(async () => {
      const res = await action();
      notifyActionResult(toast, res);
      router.refresh();
    });
  }

  const columns: Column<CouponListItem>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      sortKey: "code",
      render: (r) => (
        <Link href={`/admin/coupons/${r.id}`} className="font-semibold text-green-800 hover:underline">
          {r.code}
        </Link>
      ),
    },
    { key: "name", header: "Name", sortable: true, sortKey: "name", render: (r) => r.name },
    { key: "type", header: "Type", sortable: true, sortKey: "promo_type", render: (r) => <CouponTypeBadge type={r.promoType} /> },
    { key: "value", header: "Value", sortable: true, sortKey: "value", render: formatValue },
    {
      key: "usage",
      header: "Usage",
      align: "right",
      render: (r) => (r.maxUses != null ? `${r.usageCount}/${r.maxUses}` : String(r.usageCount)),
    },
    { key: "status", header: "Status", render: (r) => <CouponDisplayBadge status={r.displayStatus} /> },
    { key: "start", header: "Start Date", sortable: true, sortKey: "starts_at", render: (r) => formatDate(r.startsAt) },
    { key: "end", header: "End Date", sortable: true, sortKey: "expires_at", render: (r) => formatDate(r.expiresAt) },
    { key: "updated", header: "Updated", sortable: true, sortKey: "updated_at", render: (r) => formatDate(r.updatedAt) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          <Link href={`/admin/coupons/${r.id}`} className="rounded-lg px-2 py-1 text-sm text-green-700 hover:bg-green-50">Edit</Link>
          <button type="button" onClick={() => run(() => duplicateCoupon(r.id))} className="rounded-lg px-2 py-1 text-sm text-green-700/70 hover:bg-green-50">Duplicate</button>
          {!r.isActive ? (
            <button type="button" onClick={() => run(() => activateCoupon(r.id))} className="rounded-lg px-2 py-1 text-sm text-green-700/70 hover:bg-green-50">Activate</button>
          ) : (
            <button type="button" onClick={() => run(() => deactivateCoupon(r.id))} className="rounded-lg px-2 py-1 text-sm text-green-700/70 hover:bg-green-50">Deactivate</button>
          )}
          <button type="button" onClick={() => setRowDelete(r)} className="rounded-lg px-2 py-1 text-sm text-terra-600 hover:bg-terra-50">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <StatsCard label="Active Coupons" value={String(props.dashboard.activeCoupons)} icon="coupons" />
        <StatsCard label="Scheduled" value={String(props.dashboard.scheduledCoupons)} icon="activity" />
        <StatsCard label="Expiring (7d)" value={String(props.dashboard.expiringSoon)} icon="activity" />
        <StatsCard label="Disabled" value={String(props.dashboard.disabledCoupons)} icon="close" />
        <StatsCard label="Expired" value={String(props.dashboard.expiredCoupons)} icon="reports" />
        <StatsCard label="Redemption Rate" value={`${props.dashboard.redemptionRate}%`} icon="orders" />
        <StatsCard label="Revenue Generated" value={`₹${props.dashboard.revenueGenerated.toLocaleString("en-IN")}`} icon="payments" />
      </div>

      {props.dashboard.topCoupons.length > 0 && (
        <div className="rounded-3xl border border-cream-200 bg-white p-4">
          <h3 className="font-heading text-sm font-bold text-green-900">Top Performing Coupons</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {props.dashboard.topCoupons.map((c) => (
              <li key={c.id} className="flex justify-between gap-2">
                <Link href={`/admin/coupons/${c.id}`} className="font-medium text-green-800 hover:underline">{c.code}</Link>
                <span className="text-green-700/60">{c.usageCount} uses · ₹{c.revenue.toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center" role="search" aria-label="Coupon filters">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code or name…" aria-label="Search coupons" className={fieldControlClasses + " min-w-[200px] flex-1"} />
        <Select aria-label="Type filter" value={props.filters.promoType} onChange={(e) => push({ type: e.target.value })} className="lg:w-40">
          <option value="all">All types</option>
          {COUPON_TYPES.map((t) => <option key={t} value={t}>{COUPON_TYPE_LABELS[t]}</option>)}
        </Select>
        <Select aria-label="Display status filter" value={props.filters.displayStatus} onChange={(e) => push({ status: e.target.value })} className="lg:w-36">
          {DISPLAY_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </Select>
        <Select aria-label="Lifecycle filter" value={props.filters.lifecycle} onChange={(e) => push({ lifecycle: e.target.value })} className="lg:w-32">
          <option value="all">All lifecycle</option>
          {COUPON_LIFECYCLE.map((s) => <option key={s} value={s}>{COUPON_LIFECYCLE_LABELS[s]}</option>)}
        </Select>
        <Select aria-label="Customer filter" value={props.filters.customerId || "all"} onChange={(e) => push({ customer: e.target.value === "all" ? null : e.target.value })} className="lg:w-44">
          <option value="all">All customers</option>
          {props.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <input type="date" aria-label="From date" value={props.filters.dateFrom} onChange={(e) => push({ from: e.target.value || null })} className={fieldControlClasses + " lg:w-40"} />
        <input type="date" aria-label="To date" value={props.filters.dateTo} onChange={(e) => push({ to: e.target.value || null })} className={fieldControlClasses + " lg:w-40"} />
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-3xl border border-green-200 bg-green-50 px-4 py-3" role="region" aria-label="Bulk coupon actions">
          <span className="text-sm font-semibold text-green-800">{selectedIds.length} selected</span>
          <button type="button" onClick={() => run(() => bulkActivateCoupons(selectedIds))} className="rounded-xl px-3 py-1 text-sm font-medium text-green-700 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">Activate</button>
          <button type="button" onClick={() => run(() => bulkArchiveCoupons(selectedIds))} className="rounded-xl px-3 py-1 text-sm font-medium text-green-700 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">Archive</button>
          <button type="button" onClick={() => setBulkDeleteOpen(true)} className="rounded-xl px-3 py-1 text-sm font-medium text-terra-600 hover:bg-terra-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">Delete</button>
          <button type="button" onClick={() => setSelectedIds([])} className="ml-auto rounded-xl px-3 py-1 text-sm text-green-700/60 hover:bg-green-100">Clear</button>
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
        empty="No coupons match your filters."
      />

      <Pagination page={props.page} pageCount={props.pageCount} total={props.total} perPage={props.perPage} onPageChange={(p) => push({ page: String(p) }, false)} />

      <section className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4" aria-labelledby="gift-cards-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="gift-cards-heading" className="font-heading text-lg font-bold text-green-900">Gift Cards</h2>
          <div className="flex items-center gap-2">
            <input type="number" min={1} value={giftAmount} onChange={(e) => setGiftAmount(e.target.value)} aria-label="Gift card amount" className={fieldControlClasses + " w-28"} />
            <Button size="sm" disabled={pending} onClick={() => run(() => createGiftCard({ amount: Number(giftAmount) || 500 }))}>Issue Gift Card</Button>
          </div>
        </div>
        {props.giftCards.length === 0 ? (
          <p className="text-sm text-green-700/60">No gift cards issued yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-cream-100 text-left text-green-700/60">
                  <th className="py-2 pr-4 font-semibold">Code</th>
                  <th className="py-2 pr-4 font-semibold">Balance</th>
                  <th className="py-2 pr-4 font-semibold">Customer</th>
                  <th className="py-2 pr-4 font-semibold">Expires</th>
                  <th className="py-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {props.giftCards.map((g) => (
                  <tr key={g.id} className="border-b border-cream-50">
                    <td className="py-2 pr-4 font-mono font-medium">{g.code}</td>
                    <td className="py-2 pr-4">₹{g.balance} / ₹{g.initialBalance}</td>
                    <td className="py-2 pr-4">{g.customerName ?? "—"}</td>
                    <td className="py-2 pr-4">{formatDate(g.expiresAt)}</td>
                    <td className="py-2">
                      {g.isActive && (
                        <button type="button" onClick={() => run(() => deactivateGiftCard(g.id))} className="text-terra-600 hover:underline">Deactivate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DeleteDialog open={!!rowDelete} onOpenChange={(o) => !o && setRowDelete(null)} itemName={rowDelete?.code} loading={pending} onConfirm={() => { if (rowDelete) run(() => deleteCoupon(rowDelete.id)); setRowDelete(null); }} />
      <ConfirmDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} title={`Delete ${selectedIds.length} coupons?`} confirmLabel="Delete" tone="danger" loading={pending} onConfirm={() => { run(async () => { await bulkDeleteCoupons(selectedIds); setSelectedIds([]); setBulkDeleteOpen(false); return { ok: true, error: null }; }); }} />
    </div>
  );
}
