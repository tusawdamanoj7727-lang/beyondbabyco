"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import StatsCard from "@/components/admin/StatsCard";
import ReviewStatusBadge from "@/components/admin/ReviewStatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Badge from "@/components/ui/Badge";
import { Select, fieldControlClasses } from "@/components/admin/FormField";
import {
  REVIEW_STATUSES,
  REVIEW_STATUS_LABELS,
  starsLabel,
  type ReviewDashboard,
  type ReviewListItem,
  type ReviewStatus,
} from "@/lib/admin/review-types";
import {
  approveReview,
  bulkApproveReviews,
  bulkDeleteReviews,
  bulkHideReviews,
  bulkRejectReviews,
  featureReview,
  rejectReview,
} from "@/lib/admin/review-actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReviewsClient(props: {
  rows: ReviewListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  dashboard: ReviewDashboard;
  products: { id: string; name: string }[];
  customers: { id: string; name: string }[];
  filters: {
    search: string;
    rating: number | "all";
    status: ReviewStatus | "all";
    verified: boolean;
    productId: string;
    customerId: string;
    hasImages: boolean;
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
  const [bulkAction, setBulkAction] = useState<"approve" | "reject" | "hide" | "delete" | null>(null);
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
      rating: props.filters.rating === "all" ? "" : String(props.filters.rating),
      status: props.filters.status,
      verified: props.filters.verified ? "1" : "",
      product: props.filters.productId,
      customer: props.filters.customerId,
      images: props.filters.hasImages ? "1" : "",
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
    router.push(`/admin/reviews?${sp.toString()}`);
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
      if (bulkAction === "approve") await bulkApproveReviews(selectedIds);
      if (bulkAction === "reject") await bulkRejectReviews(selectedIds);
      if (bulkAction === "hide") await bulkHideReviews(selectedIds);
      if (bulkAction === "delete") await bulkDeleteReviews(selectedIds);
      setSelectedIds([]);
      setBulkAction(null);
      router.refresh();
    });
  }

  const columns: Column<ReviewListItem>[] = [
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      sortKey: "rating",
      render: (r) => <span className="text-terra-600" aria-label={`${r.rating} out of 5 stars`}>{starsLabel(r.rating)}</span>,
    },
    {
      key: "product",
      header: "Product",
      sortable: true,
      sortKey: "product",
      render: (r) => (
        <div>
          <p className="font-semibold text-green-900">{r.productName}</p>
          {r.productSku && <p className="text-xs text-green-700/50">{r.productSku}</p>}
        </div>
      ),
    },
    { key: "customer", header: "Customer", render: (r) => r.customerName },
    {
      key: "verified",
      header: "Verified",
      render: (r) => (r.verifiedPurchase ? <Badge variant="success" size="sm">Verified</Badge> : "—"),
    },
    { key: "status", header: "Status", render: (r) => <ReviewStatusBadge status={r.status} /> },
    {
      key: "images",
      header: "Images",
      align: "right",
      render: (r) => (r.imageCount ? r.imageCount : "—"),
    },
    { key: "created", header: "Created", sortable: true, sortKey: "created_at", render: (r) => formatDate(r.createdAt) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex flex-wrap items-center gap-1">
          <Link href={`/admin/reviews/${r.id}`} className="rounded-lg px-2 py-1 text-sm font-medium text-green-700 hover:bg-green-50">View</Link>
          {r.status === "pending" && (
            <button type="button" onClick={() => startTransition(async () => { await approveReview(r.id); router.refresh(); })} className="rounded-lg px-2 py-1 text-sm text-green-700/70 hover:bg-green-50">Approve</button>
          )}
          {r.status !== "rejected" && (
            <button type="button" onClick={() => startTransition(async () => { await rejectReview(r.id); router.refresh(); })} className="rounded-lg px-2 py-1 text-sm text-green-700/70 hover:bg-green-50">Reject</button>
          )}
          <button type="button" onClick={() => startTransition(async () => { await featureReview(r.id, !r.isFeatured); router.refresh(); })} className="rounded-lg px-2 py-1 text-sm text-green-700/70 hover:bg-green-50">
            {r.isFeatured ? "Unfeature" : "Feature"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatsCard label="Pending" value={String(props.dashboard.pendingReviews)} icon="reviews" />
        <StatsCard label="Approved" value={String(props.dashboard.approvedReviews)} icon="sparkles" />
        <StatsCard label="Average rating" value={String(props.dashboard.averageRating)} icon="activity" />
        <StatsCard label="This month" value={String(props.dashboard.reviewsThisMonth)} icon="plus" />
        <StatsCard label="Featured" value={String(props.dashboard.featuredReviews)} icon="reviews" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center" role="search" aria-label="Review filters">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product, customer, title…" aria-label="Search reviews" className={fieldControlClasses + " flex-1 min-w-[200px]"} />
        <Select aria-label="Rating filter" value={props.filters.rating === "all" ? "all" : String(props.filters.rating)} onChange={(e) => push({ rating: e.target.value === "all" ? null : e.target.value })} className="lg:w-28">
          <option value="all">All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
        </Select>
        <Select aria-label="Status filter" value={props.filters.status} onChange={(e) => push({ status: e.target.value })} className="lg:w-32">
          <option value="all">All statuses</option>
          {REVIEW_STATUSES.map((s) => <option key={s} value={s}>{REVIEW_STATUS_LABELS[s]}</option>)}
        </Select>
        <Select aria-label="Product filter" value={props.filters.productId || "all"} onChange={(e) => push({ product: e.target.value === "all" ? null : e.target.value })} className="lg:w-44">
          <option value="all">All products</option>
          {props.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select aria-label="Customer filter" value={props.filters.customerId || "all"} onChange={(e) => push({ customer: e.target.value === "all" ? null : e.target.value })} className="lg:w-44">
          <option value="all">All customers</option>
          {props.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <label className="flex items-center gap-2 text-sm text-green-800">
          <input type="checkbox" checked={props.filters.verified} onChange={(e) => push({ verified: e.target.checked ? "1" : null })} className="rounded border-green-300" />
          Verified purchase
        </label>
        <label className="flex items-center gap-2 text-sm text-green-800">
          <input type="checkbox" checked={props.filters.hasImages} onChange={(e) => push({ images: e.target.checked ? "1" : null })} className="rounded border-green-300" />
          Has images
        </label>
        <input type="date" aria-label="From date" value={props.filters.dateFrom} onChange={(e) => push({ from: e.target.value || null })} className={fieldControlClasses + " lg:w-40"} />
        <input type="date" aria-label="To date" value={props.filters.dateTo} onChange={(e) => push({ to: e.target.value || null })} className={fieldControlClasses + " lg:w-40"} />
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-3xl border border-green-200 bg-green-50 px-4 py-3" role="region" aria-label="Bulk review actions">
          <span className="text-sm font-semibold text-green-800">{selectedIds.length} selected</span>
          <button type="button" onClick={() => setBulkAction("approve")} className="rounded-xl px-3 py-1 text-sm font-medium text-green-700 hover:bg-green-100">Approve</button>
          <button type="button" onClick={() => setBulkAction("reject")} className="rounded-xl px-3 py-1 text-sm font-medium text-green-700 hover:bg-green-100">Reject</button>
          <button type="button" onClick={() => setBulkAction("hide")} className="rounded-xl px-3 py-1 text-sm font-medium text-green-700 hover:bg-green-100">Hide</button>
          <button type="button" onClick={() => setBulkAction("delete")} className="rounded-xl px-3 py-1 text-sm font-medium text-terra-600 hover:bg-terra-50">Delete</button>
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
        empty="No reviews match your filters."
      />

      <Pagination page={props.page} pageCount={props.pageCount} total={props.total} perPage={props.perPage} onPageChange={(p) => push({ page: String(p) }, false)} />

      <ConfirmDialog
        open={!!bulkAction}
        onOpenChange={(o) => !o && setBulkAction(null)}
        title={`${bulkAction ? bulkAction.charAt(0).toUpperCase() + bulkAction.slice(1) : ""} ${selectedIds.length} reviews?`}
        confirmLabel={bulkAction ?? "Confirm"}
        tone={bulkAction === "delete" ? "danger" : "default"}
        loading={pending}
        onConfirm={runBulk}
      />
    </div>
  );
}
