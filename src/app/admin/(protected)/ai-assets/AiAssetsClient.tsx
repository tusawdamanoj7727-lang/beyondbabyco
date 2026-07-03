"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import StatsCard from "@/components/admin/StatsCard";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Badge from "@/components/ui/Badge";
import { Select, fieldControlClasses } from "@/components/admin/FormField";
import {
  AI_ASSET_STATUSES,
  AI_ASSET_STATUS_LABELS,
  AI_ASSIGNABLE_SLOTS,
  AI_COMPARE_DIMENSIONS,
  AI_COMPARE_LABELS,
  type AiAssetDashboard,
  type AiAssetListItem,
  type AiAssetStatus,
} from "@/lib/admin/ai-asset-types";
import {
  approveAiAsset,
  assignApprovedAssetToSlot,
  bulkUpdateAiAssetStatus,
  compareAiAssets,
  deleteAiAsset,
  exportSelectedAiAssets,
  rejectAiAsset,
  uploadPackagingReference,
} from "@/lib/admin/ai-asset-actions";

function statusVariant(status: AiAssetStatus): "default" | "success" | "warning" {
  if (status === "approved") return "success";
  if (status === "rejected") return "warning";
  return "default";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AiAssetsClient(props: {
  rows: AiAssetListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  dashboard: AiAssetDashboard;
  filters: { search: string; status: AiAssetStatus | "all"; category: string };
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState(props.filters.search);
  const [detail, setDetail] = useState<AiAssetListItem | null>(null);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [assignSlot, setAssignSlot] = useState<string>(AI_ASSIGNABLE_SLOTS[0]);
  const [bulkAction, setBulkAction] = useState<AiAssetStatus | "export" | "delete" | null>(null);
  const [pending, startTransition] = useTransition();
  const [packagingLine, setPackagingLine] = useState("baby-wipes");

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
    if (props.filters.search) sp.set("q", props.filters.search);
    if (props.filters.status !== "all") sp.set("status", props.filters.status);
    if (props.filters.category !== "all") sp.set("category", props.filters.category);
    if (!resetPage) sp.set("page", String(props.page));
    for (const [k, v] of Object.entries(patch)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    router.push(`/admin/ai-assets?${sp.toString()}`);
  }

  const compareRows = useMemo(() => {
    if (!compareA || !compareB) return null;
    return [props.rows.find((r) => r.assetId === compareA), props.rows.find((r) => r.assetId === compareB)].filter(Boolean) as AiAssetListItem[];
  }, [compareA, compareB, props.rows]);

  const columns: Column<AiAssetListItem>[] = [
    {
      key: "preview",
      header: "Preview",
      render: (row) => (
        <button type="button" onClick={() => setDetail(row)} className="relative block h-14 w-20 overflow-hidden rounded-xl bg-cream-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={row.previewUrl} alt="" className="h-full w-full object-cover" />
        </button>
      ),
    },
    { key: "category", header: "Category", render: (row) => row.category },
    { key: "score", header: "Score", render: (row) => <span className="font-medium">{row.score.toFixed(1)}</span> },
    { key: "scene", header: "Scene", render: (row) => row.scene ?? "—" },
    { key: "product", header: "Product", render: (row) => row.productLine ?? "—" },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={statusVariant(row.status)}>{AI_ASSET_STATUS_LABELS[row.status]}</Badge>,
    },
    {
      key: "prompt",
      header: "Prompt",
      render: (row) => (
        <span className="line-clamp-2 max-w-xs text-sm text-green-800/70">{row.prompt?.slice(0, 80) ?? "—"}</span>
      ),
    },
    { key: "created", header: "Created", render: (row) => formatDate(row.createdAt) },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <button type="button" className="rounded-lg px-2 py-1 text-xs text-green-700 hover:bg-green-100" onClick={() => setDetail(row)}>
            View
          </button>
          <a href={`/images/generated/${row.category}/${row.slug}.png`} download className="rounded-lg px-2 py-1 text-xs text-green-700 hover:bg-green-100">
            Download
          </a>
        </div>
      ),
    },
  ];

  function toggleRow(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? props.rows.map((r) => r.assetId) : []);
  }

  function runBulk(status: AiAssetStatus | "export" | "delete") {
    startTransition(async () => {
      if (status === "export") {
        await exportSelectedAiAssets(selectedIds);
      } else if (status === "delete") {
        for (const id of selectedIds) await deleteAiAsset(id);
      } else {
        await bulkUpdateAiAssetStatus(selectedIds, status);
      }
      setBulkAction(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total assets" value={String(props.dashboard.total)} icon="media" />
        <StatsCard label="Pending review" value={String(props.dashboard.pending)} icon="activity" />
        <StatsCard label="Approved (live-eligible)" value={String(props.dashboard.approved)} icon="products" />
        <StatsCard label="Acceptance rate" value={`${props.dashboard.acceptanceRate}%`} icon="reviews" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-cream-200 bg-cream-50/80 p-5">
          <h3 className="font-medium text-green-900">Quality dashboard</h3>
          <dl className="mt-3 grid gap-2 text-sm text-green-800/80">
            <div className="flex justify-between"><dt>Average score</dt><dd>{props.dashboard.averageScore}</dd></div>
            <div className="flex justify-between"><dt>Slot coverage</dt><dd>{props.dashboard.coverage.slotsAssigned}/{props.dashboard.coverage.slotsTotal}</dd></div>
            <div className="flex justify-between"><dt>Rejected</dt><dd>{props.dashboard.rejected}</dd></div>
          </dl>
          {props.dashboard.rejectionReasons.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-green-800/70">
              {props.dashboard.rejectionReasons.slice(0, 5).map((r) => (
                <li key={r.reason}>{r.reason}: {r.count}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-cream-200 bg-cream-50/80 p-5">
          <h3 className="font-medium text-green-900">Approved media library</h3>
          <p className="mt-1 text-sm text-green-800/70">Approved assets appear here and in Media Library → Generated filter.</p>
          <Link href="/admin/media?source=generated" className="mt-3 inline-block text-sm font-medium text-green-700 underline">
            Open generated assets in Media Library
          </Link>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Generated", "Editorial", "Hero", "Product", "Science"].map((tag) => (
              <Badge key={tag} variant="default">{tag}</Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-3xl border border-cream-200 bg-white p-4">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-sm">
          Search
          <input className={fieldControlClasses} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Category, scene, prompt…" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Status
          <Select value={props.filters.status} onChange={(e) => push({ status: e.target.value === "all" ? null : e.target.value })}>
            <option value="all">All</option>
            {AI_ASSET_STATUSES.map((s) => (
              <option key={s} value={s}>{AI_ASSET_STATUS_LABELS[s]}</option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Upload packaging PNG
          <div className="flex gap-2">
            <Select value={packagingLine} onChange={(e) => setPackagingLine(e.target.value)}>
              <option value="baby-wipes">Baby Wipes</option>
              <option value="baby-wash">Baby Wash</option>
              <option value="baby-lotion">Baby Lotion</option>
            </Select>
            <input
              type="file"
              accept="image/png"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const fd = new FormData();
                fd.set("file", f);
                startTransition(async () => {
                  await uploadPackagingReference(packagingLine, fd);
                  router.refresh();
                });
              }}
            />
          </div>
        </label>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-green-900/5 px-4 py-3 text-sm">
          <span>{selectedIds.length} selected</span>
          <button type="button" className="rounded-xl bg-green-600 px-3 py-1.5 text-cream-50" onClick={() => setBulkAction("approved")}>Approve</button>
          <button type="button" className="rounded-xl bg-terra-500 px-3 py-1.5 text-cream-50" onClick={() => setBulkAction("rejected")}>Reject</button>
          <button type="button" className="rounded-xl border px-3 py-1.5" onClick={() => setBulkAction("archived")}>Archive</button>
          <button type="button" className="rounded-xl border px-3 py-1.5" onClick={() => setBulkAction("export")}>Export</button>
          <button type="button" className="rounded-xl border border-red-200 px-3 py-1.5 text-red-700" onClick={() => setBulkAction("delete")}>Delete</button>
        </div>
      )}

      <div className="rounded-3xl border border-cream-200 bg-white p-2">
        <div className="mb-3 flex flex-wrap items-center gap-2 px-2 pt-2 text-sm">
          <span className="text-green-800/70">Compare:</span>
          <Select value={compareA ?? ""} onChange={(e) => setCompareA(e.target.value || null)}>
            <option value="">Select A</option>
            {props.rows.map((r) => <option key={r.assetId} value={r.assetId}>{r.assetId}</option>)}
          </Select>
          <Select value={compareB ?? ""} onChange={(e) => setCompareB(e.target.value || null)}>
            <option value="">Select B</option>
            {props.rows.map((r) => <option key={r.assetId} value={r.assetId}>{r.assetId}</option>)}
          </Select>
        </div>

        <DataTable
          columns={columns}
          rows={props.rows}
          getRowId={(r) => r.assetId}
          selectable
          selectedIds={selectedIds}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
        />
        <Pagination
          page={props.page}
          pageCount={props.pageCount}
          total={props.total}
          perPage={props.perPage}
          onPageChange={(p) => push({ page: String(p) }, false)}
        />
      </div>

      {compareRows && compareRows.length === 2 && (
        <div className="rounded-3xl border border-cream-200 bg-cream-50 p-5">
          <h3 className="font-medium text-green-900">Image comparison</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {compareRows.map((row) => (
              <div key={row.assetId} className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={row.previewUrl} alt="" className="w-full rounded-2xl object-cover" />
                <p className="text-sm font-medium">{row.assetId} — {row.score.toFixed(1)}</p>
                <ul className="text-xs text-green-800/70">
                  {AI_COMPARE_DIMENSIONS.map((dim) => {
                    const key = dim === "brandConsistency" ? "brandConsistency" : dim === "faceQuality" ? "faceQuality" : dim;
                    const val = (row.scoreBreakdown as Record<string, number> | undefined)?.[key];
                    return <li key={dim}>{AI_COMPARE_LABELS[dim]}: {val ?? "—"}</li>;
                  })}
                </ul>
                <button
                  type="button"
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm text-cream-50"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await compareAiAssets(compareRows[0].assetId, compareRows[1].assetId, row.assetId);
                      router.refresh();
                    })
                  }
                >
                  Choose winner
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-950/40 p-4" onClick={() => setDetail(null)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-4">
              <div className="relative h-48 w-64 shrink-0 overflow-hidden rounded-2xl bg-cream-100">
                <Image src={detail.previewUrl} alt="" fill className="object-cover" unoptimized />
              </div>
              <div className="min-w-0 flex-1 space-y-2 text-sm">
                <h2 className="text-lg font-medium text-green-900">{detail.assetId}</h2>
                <p>Score: {detail.score.toFixed(1)} · {AI_ASSET_STATUS_LABELS[detail.status]}</p>
                <p className="line-clamp-4 text-green-800/70">{detail.prompt ?? "No prompt recorded"}</p>
                {detail.generation && (
                  <dl className="grid grid-cols-2 gap-1 text-xs text-green-800/60">
                    {detail.generation.seed != null && <><dt>Seed</dt><dd>{detail.generation.seed}</dd></>}
                    {detail.generation.steps != null && <><dt>Steps</dt><dd>{detail.generation.steps}</dd></>}
                    {detail.generation.width != null && <><dt>Resolution</dt><dd>{detail.generation.width}×{detail.generation.height}</dd></>}
                    {detail.generation.fluxVersion && <><dt>FLUX</dt><dd>{detail.generation.fluxVersion}</dd></>}
                  </dl>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button type="button" className="rounded-xl bg-green-600 px-3 py-1.5 text-cream-50" disabled={pending} onClick={() => startTransition(async () => { await approveAiAsset(detail.assetId); setDetail(null); router.refresh(); })}>Approve</button>
                  <button type="button" className="rounded-xl bg-terra-500 px-3 py-1.5 text-cream-50" disabled={pending} onClick={() => startTransition(async () => { await rejectAiAsset(detail.assetId); setDetail(null); router.refresh(); })}>Reject</button>
                  <a href={`/images/generated/${detail.category}/${detail.slug}.png`} target="_blank" rel="noreferrer" className="rounded-xl border px-3 py-1.5">Open original</a>
                </div>
                {detail.status === "approved" && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Select value={assignSlot} onChange={(e) => setAssignSlot(e.target.value)}>
                      {AI_ASSIGNABLE_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <button
                      type="button"
                      className="rounded-xl border border-green-600 px-3 py-1.5 text-green-800"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await assignApprovedAssetToSlot(detail.assetId, assignSlot);
                          router.refresh();
                        })
                      }
                    >
                      Assign to slot
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={bulkAction !== null}
        onOpenChange={(open) => !open && setBulkAction(null)}
        title="Confirm bulk action"
        description={`Apply ${bulkAction} to ${selectedIds.length} assets?`}
        confirmLabel="Confirm"
        onConfirm={() => bulkAction && runBulk(bulkAction)}
      />
    </div>
  );
}
