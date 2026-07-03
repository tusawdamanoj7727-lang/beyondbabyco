"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import MediaThumb from "@/components/admin/MediaThumb";
import Icon from "@/components/admin/Icon";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/admin/LoadingState";
import { Input, Select, fieldControlClasses } from "@/components/admin/FormField";
import { cn } from "@/lib/utils";
import { readImageMeta } from "@/lib/media/image-meta";
import {
  MEDIA_BUCKETS,
  mediaKind,
  type MediaItem,
  type MediaFolderItem,
  type MediaBucket,
  type MediaType,
  type MediaSort,
} from "@/lib/admin/media-types";
import {
  bulkDeleteMedia,
  deleteMedia,
  duplicateMedia,
  logMediaDownload,
  moveMedia,
  renameMedia,
  replaceMedia,
  syncMediaLibrary,
  createMediaFolder,
} from "@/lib/admin/media-library-actions";

export interface MediaClientProps {
  rows: MediaItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  folders: MediaFolderItem[];
  selectedFolderId: string;
  filters: { search: string; bucket: MediaBucket | "all"; type: MediaType | "all"; productId?: string };
  sort: MediaSort;
  view: "grid" | "list";
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function MediaClient(props: MediaClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState(props.filters.search);

  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [renameTarget, setRenameTarget] = useState<MediaItem | null>(null);
  const [moveTargets, setMoveTargets] = useState<string[] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);

  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<MediaItem | null>(null);

  const customFolders = props.folders.filter((f) => !f.isSystem);
  const folderNameById = new Map(props.folders.map((f) => [f.id, f.name]));

  useEffect(() => setSelectedIds([]), [props.rows]);
  useEffect(() => setSearch(props.filters.search), [props.filters.search]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== props.filters.search) pushParams({ q: search });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function pushParams(patch: Record<string, string | null>, resetPage = true) {
    const sp = new URLSearchParams();
    const base: Record<string, string> = {
      q: props.filters.search,
      bucket: props.filters.bucket,
      type: props.filters.type,
      product: props.filters.productId ?? "",
      sort: props.sort,
      folder: props.selectedFolderId,
      view: props.view,
      page: String(props.page),
    };
    const merged = { ...base, ...patch };
    if (resetPage && !("page" in patch)) merged.page = "1";
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") sp.set(k, v);
    }
    router.push(`/admin/media?${sp.toString()}`);
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? props.rows.map((r) => r.id) : []);
  }

  function refresh() {
    router.refresh();
  }

  function download(item: MediaItem) {
    if (!item.url) return;
    const a = document.createElement("a");
    a.href = item.url;
    a.download = item.originalName ?? item.path.split("/").pop() ?? "download";
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    startTransition(() => logMediaDownload(item.id));
  }

  async function copyUrl(item: MediaItem) {
    if (!item.url) return;
    try {
      await navigator.clipboard.writeText(item.url);
    } catch {
      /* clipboard may be unavailable */
    }
  }

  function triggerReplace(item: MediaItem) {
    replaceTargetRef.current = item;
    replaceInputRef.current?.click();
  }

  async function onReplaceFile(file: File | undefined) {
    const target = replaceTargetRef.current;
    if (!target || !file) return;
    const fd = new FormData();
    fd.append("file", file);
    const meta = await readImageMeta(file);
    if (meta) {
      fd.append("width", String(meta.width));
      fd.append("height", String(meta.height));
      if (meta.blur) fd.append("blur", meta.blur);
    }
    startTransition(async () => {
      await replaceMedia(target.id, fd);
      replaceTargetRef.current = null;
      refresh();
    });
  }

  function runDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    startTransition(async () => {
      await deleteMedia(id);
      setDeleteTarget(null);
      refresh();
    });
  }
  function runBulkDelete() {
    startTransition(async () => {
      await bulkDeleteMedia(selectedIds);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      refresh();
    });
  }
  function runMove(folderId: string | null) {
    const ids = moveTargets;
    if (!ids) return;
    startTransition(async () => {
      await moveMedia(ids, folderId);
      setMoveTargets(null);
      setSelectedIds([]);
      refresh();
    });
  }
  function bulkDownload() {
    for (const id of selectedIds) {
      const item = props.rows.find((r) => r.id === id);
      if (item) download(item);
    }
  }

  function itemActions(item: MediaItem): ActionItem[] {
    return [
      { label: "View", icon: "reviews", onClick: () => setPreview(item) },
      { label: "Rename", icon: "blog", onClick: () => setRenameTarget(item) },
      { label: "Move", icon: "categories", onClick: () => setMoveTargets([item.id]) },
      { label: "Duplicate", icon: "products", onClick: () => startTransition(async () => { await duplicateMedia(item.id); refresh(); }) },
      { label: "Download", icon: "external", onClick: () => download(item) },
      { label: "Copy URL", icon: "external", onClick: () => copyUrl(item) },
      { label: "Replace", icon: "media", onClick: () => triggerReplace(item) },
      { label: "Delete", icon: "close", tone: "danger", onClick: () => setDeleteTarget(item) },
    ];
  }

  const allSelected = props.rows.length > 0 && props.rows.every((r) => selectedIds.includes(r.id));

  const listColumns: Column<MediaItem>[] = [
    {
      key: "thumb",
      header: "",
      headerClassName: "w-14",
      render: (m) => (
        <div className="h-11 w-11 overflow-hidden rounded-xl ring-1 ring-cream-200">
          <MediaThumb url={m.url} mime={m.mimeType} alt={m.alt} />
        </div>
      ),
    },
    {
      key: "name",
      header: "Filename",
      render: (m) => (
        <button type="button" onClick={() => setPreview(m)} className="max-w-[220px] truncate text-left font-semibold text-green-900 hover:text-green-700 focus-visible:outline-none focus-visible:underline">
          {m.originalName ?? m.path.split("/").pop()}
        </button>
      ),
    },
    { key: "folder", header: "Folder", render: (m) => <span className="text-green-700/70">{m.folderId ? folderNameById.get(m.folderId) ?? "—" : "—"}</span> },
    { key: "bucket", header: "Bucket", render: (m) => <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs font-medium text-green-700">{m.bucket}</span> },
    { key: "size", header: "Size", align: "right", render: (m) => <span className="text-green-700/70">{formatBytes(m.sizeBytes)}</span> },
    { key: "dim", header: "Dimensions", align: "right", render: (m) => <span className="text-green-700/70">{m.width && m.height ? `${m.width}×${m.height}` : "—"}</span> },
    { key: "uploaded", header: "Uploaded", render: (m) => <span className="whitespace-nowrap text-green-700/60">{formatDate(m.createdAt)}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (m) => <ActionsMenu items={itemActions(m)} />,
    },
  ];

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-60 lg:shrink-0">
        <nav aria-label="Media folders" className="rounded-3xl border border-cream-300 bg-white p-2">
          <FolderButton
            label="All media"
            icon="media"
            active={!props.selectedFolderId}
            onClick={() => pushParams({ folder: "" })}
          />
          <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-green-700/40">Folders</p>
          {props.folders.filter((f) => f.isSystem).map((f) => (
            <FolderButton
              key={f.id}
              label={f.name}
              icon={(f.icon as never) ?? "media"}
              active={props.selectedFolderId === f.id}
              onClick={() => pushParams({ folder: f.id })}
            />
          ))}
          {customFolders.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-green-700/40">Custom</p>
              {customFolders.map((f) => (
                <FolderButton
                  key={f.id}
                  label={f.name}
                  icon="categories"
                  active={props.selectedFolderId === f.id}
                  onClick={() => pushParams({ folder: f.id })}
                />
              ))}
            </>
          )}
          <button
            type="button"
            onClick={() => setNewFolderOpen(true)}
            className="mt-2 flex w-full items-center gap-2 rounded-2xl border border-dashed border-cream-300 px-3 py-2 text-sm font-medium text-green-700/70 transition-colors hover:border-green-300 hover:text-green-900 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
          >
            <Icon name="plus" size={16} /> New folder
          </button>
        </nav>
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-green-600">
              <Icon name="search" size={18} />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search media…"
              aria-label="Search media"
              className={cn(fieldControlClasses, "pl-11")}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
            <Select aria-label="Filter by bucket" value={props.filters.bucket} onChange={(e) => pushParams({ bucket: e.target.value })} className="lg:w-32">
              <option value="all">All buckets</option>
              {MEDIA_BUCKETS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Select>
            <Select aria-label="Filter by type" value={props.filters.type} onChange={(e) => pushParams({ type: e.target.value })} className="lg:w-32">
              <option value="all">All types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="pdf">PDFs</option>
              <option value="other">Other</option>
            </Select>
            <input
              type="text"
              defaultValue={props.filters.productId ?? ""}
              placeholder="Product ID…"
              aria-label="Filter by product ID"
              className={cn(fieldControlClasses, "lg:w-36 text-sm")}
              onBlur={(e) => pushParams({ product: e.target.value.trim() || null })}
            />
            <Select aria-label="Sort by" value={props.sort} onChange={(e) => pushParams({ sort: e.target.value })} className="lg:w-36">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="largest">Largest</option>
              <option value="smallest">Smallest</option>
              <option value="name">Name</option>
            </Select>
            <div className="inline-flex rounded-2xl border border-cream-300 bg-cream-50 p-1" role="group" aria-label="View mode">
              <button type="button" aria-pressed={props.view === "grid"} aria-label="Grid view" onClick={() => pushParams({ view: "grid" }, false)} className={cn("grid h-9 w-9 place-items-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50", props.view === "grid" ? "bg-green-500 text-cream-50" : "text-green-700/70 hover:text-green-900")}>
                <Icon name="dashboard" size={16} />
              </button>
              <button type="button" aria-pressed={props.view === "list"} aria-label="List view" onClick={() => pushParams({ view: "list" }, false)} className={cn("grid h-9 w-9 place-items-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50", props.view === "list" ? "bg-green-500 text-cream-50" : "text-green-700/70 hover:text-green-900")}>
                <Icon name="menu" size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => startTransition(async () => { await syncMediaLibrary(); refresh(); })}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-cream-300 bg-white px-3 py-2.5 text-sm font-semibold text-green-700 transition-colors hover:bg-cream-100 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
            >
              {isPending ? <Spinner size={15} /> : <Icon name="activity" size={15} />} Sync
            </button>
          </div>
        </div>

        {/* Bulk bar */}
        {selectedIds.length > 0 && (
          <div role="region" aria-label="Bulk actions" className="flex flex-wrap items-center gap-2 rounded-3xl border border-green-200 bg-green-50 px-3 py-2.5">
            <span className="mr-1 flex items-center gap-2 text-sm font-semibold text-green-800">
              <span className="grid h-6 min-w-6 place-items-center rounded-full bg-green-500 px-1.5 text-xs text-cream-50">{selectedIds.length}</span>
              selected
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-1">
              <BulkBtn icon="categories" label="Move" onClick={() => setMoveTargets(selectedIds)} disabled={isPending} />
              <BulkBtn icon="external" label="Download" onClick={bulkDownload} disabled={isPending} />
              <BulkBtn icon="close" label="Delete" tone="danger" onClick={() => setBulkDeleteOpen(true)} disabled={isPending} />
              <BulkBtn label="Clear" onClick={() => setSelectedIds([])} disabled={isPending} />
            </div>
          </div>
        )}

        {/* Content */}
        {props.rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-cream-300 bg-cream-50/60 px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cream-100 text-green-600 ring-1 ring-cream-300">
              <Icon name="media" size={26} />
            </span>
            <h3 className="mt-4 font-heading text-lg font-bold text-green-900">No media found</h3>
            <p className="mt-1.5 max-w-md text-sm text-green-700/70">Upload assets or run a sync to index files already in your storage buckets.</p>
            <div className="mt-5 flex gap-2">
              <Button variant="primary" size="md" onClick={() => router.push("/admin/media/upload")}>Upload</Button>
              <Button variant="ghost" size="md" onClick={() => startTransition(async () => { await syncMediaLibrary(); refresh(); })}>Sync storage</Button>
            </div>
          </div>
        ) : props.view === "grid" ? (
          <>
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                aria-label="Select all"
                checked={allSelected}
                onChange={(e) => toggleAll(e.target.checked)}
                className="h-4 w-4 rounded border-cream-300 accent-green-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
              />
              <span className="text-xs text-green-700/60">Select all on page</span>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {props.rows.map((m) => (
                <MediaCard
                  key={m.id}
                  item={m}
                  selected={selectedIds.includes(m.id)}
                  onToggle={() => toggleRow(m.id)}
                  onOpen={() => setPreview(m)}
                  actions={itemActions(m)}
                  folderName={m.folderId ? folderNameById.get(m.folderId) ?? null : null}
                />
              ))}
            </ul>
          </>
        ) : (
          <DataTable
            columns={listColumns}
            rows={props.rows}
            getRowId={(m) => m.id}
            selectable
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
          />
        )}

        <Pagination
          page={props.page}
          pageCount={props.pageCount}
          total={props.total}
          perPage={props.perPage}
          onPageChange={(p) => pushParams({ page: String(p) }, false)}
        />
      </div>

      {/* Hidden replace input */}
      <input ref={replaceInputRef} type="file" className="sr-only" onChange={(e) => onReplaceFile(e.target.files?.[0])} />

      {/* Preview dialog */}
      <PreviewDialog item={preview} folderName={preview?.folderId ? folderNameById.get(preview.folderId) ?? null : null} onClose={() => setPreview(null)} onDownload={download} />

      {/* Rename dialog */}
      <RenameDialog
        item={renameTarget}
        loading={isPending}
        onClose={() => setRenameTarget(null)}
        onSave={(name) => {
          const id = renameTarget?.id;
          if (!id) return;
          startTransition(async () => {
            await renameMedia(id, name);
            setRenameTarget(null);
            refresh();
          });
        }}
      />

      {/* Move dialog */}
      <MoveDialog
        open={moveTargets !== null}
        count={moveTargets?.length ?? 0}
        folders={customFolders}
        loading={isPending}
        onClose={() => setMoveTargets(null)}
        onMove={runMove}
      />

      {/* New folder dialog */}
      <NewFolderDialog
        open={newFolderOpen}
        loading={isPending}
        onClose={() => setNewFolderOpen(false)}
        onCreate={(name) =>
          startTransition(async () => {
            await createMediaFolder(name);
            setNewFolderOpen(false);
            refresh();
          })
        }
      />

      {/* Delete confirms */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        tone="danger"
        title="Delete file?"
        description="This permanently removes the file from storage and the media library. This cannot be undone."
        confirmLabel={isPending ? "Deleting…" : "Delete"}
        loading={isPending}
        onConfirm={runDelete}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        tone="danger"
        title={`Delete ${selectedIds.length} file${selectedIds.length === 1 ? "" : "s"}?`}
        description="This permanently removes the selected files from storage and the media library."
        confirmLabel={isPending ? "Deleting…" : "Delete"}
        loading={isPending}
        onConfirm={runBulkDelete}
      />
    </div>
  );
}

// --------------------------- Sub-components ---------------------------

interface ActionItem {
  label: string;
  icon: Parameters<typeof Icon>[0]["name"];
  onClick: () => void;
  tone?: "danger";
}

function FolderButton({ label, icon, active, onClick }: { label: string; icon: Parameters<typeof Icon>[0]["name"]; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50",
        active ? "bg-green-500 text-cream-50" : "text-green-700/80 hover:bg-cream-100 hover:text-green-900",
      )}
    >
      <Icon name={icon} size={17} />
      <span className="truncate">{label}</span>
    </button>
  );
}

function BulkBtn({ icon, label, onClick, disabled, tone }: { icon?: ActionItem["icon"]; label: string; onClick: () => void; disabled?: boolean; tone?: "danger" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50",
        tone === "danger" ? "text-terra-600 hover:bg-terra-100" : "text-green-700 hover:bg-green-100",
      )}
    >
      {icon && <Icon name={icon} size={16} />} {label}
    </button>
  );
}

function ActionsMenu({ items }: { items: ActionItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const itemClass =
    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50";

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Media actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-xl border border-cream-300 bg-white text-green-700 transition-colors hover:bg-cream-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
      >
        <span className="text-lg leading-none">⋯</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-2xl border border-cream-300 bg-white p-1.5 shadow-clay">
          {items.map((it) => (
            <button
              key={it.label}
              role="menuitem"
              onClick={() => { setOpen(false); it.onClick(); }}
              className={cn(itemClass, it.tone === "danger" ? "text-terra-600 hover:bg-terra-50" : "text-green-800 hover:bg-green-50")}
            >
              <Icon name={it.icon} size={16} /> {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MediaCard({
  item,
  selected,
  onToggle,
  onOpen,
  actions,
  folderName,
}: {
  item: MediaItem;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
  actions: ActionItem[];
  folderName: string | null;
}) {
  return (
    <li className={cn("group relative overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-card", selected ? "border-green-500 ring-2 ring-green-500/30" : "border-cream-300")}>
      <div className="absolute left-2 top-2 z-10">
        <input
          type="checkbox"
          aria-label={`Select ${item.originalName ?? "file"}`}
          checked={selected}
          onChange={onToggle}
          className="h-4 w-4 rounded border-cream-300 bg-white/90 accent-green-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
        />
      </div>
      <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <ActionsMenu items={actions} />
      </div>
      <button type="button" onClick={onOpen} aria-label={`Preview ${item.originalName ?? "file"}`} className="block aspect-square w-full overflow-hidden focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">
        <MediaThumb url={item.url} mime={item.mimeType} alt={item.alt} className="transition-transform group-hover:scale-[1.03]" />
      </button>
      <div className="space-y-0.5 p-2.5">
        <p className="truncate text-sm font-semibold text-green-900" title={item.originalName ?? undefined}>
          {item.originalName ?? item.path.split("/").pop()}
        </p>
        <p className="flex items-center justify-between gap-2 text-[11px] text-green-700/60">
          <span className="truncate">{folderName ?? item.bucket}</span>
          <span className="shrink-0">{formatBytes(item.sizeBytes)}</span>
        </p>
        <p className="text-[11px] text-green-700/40">
          {item.width && item.height ? `${item.width}×${item.height} · ` : ""}
          {formatDate(item.createdAt)}
        </p>
      </div>
    </li>
  );
}

function ModalShell({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-green-900/40 backdrop-blur-sm" />
        <Dialog.Content className={cn("fixed left-1/2 top-1/2 z-[120] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-4xl border border-cream-300 bg-white p-6 shadow-clay focus:outline-none", wide ? "max-w-3xl" : "max-w-md")}>
          <Dialog.Title className="font-heading text-lg font-bold text-green-900">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PreviewDialog({ item, folderName, onClose, onDownload }: { item: MediaItem | null; folderName: string | null; onClose: () => void; onDownload: (m: MediaItem) => void }) {
  return (
    <ModalShell open={item !== null} onClose={onClose} title={item?.originalName ?? "Preview"} wide>
      {item && (
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_240px]">
          <div className="aspect-video overflow-hidden rounded-2xl border border-cream-300 bg-cream-50">
            <MediaThumb url={item.url} mime={item.mimeType} alt={item.alt} full />
          </div>
          <dl className="space-y-2 text-sm">
            <Meta label="Type" value={mediaKind(item.mimeType)} />
            <Meta label="Mime" value={item.mimeType ?? "—"} />
            <Meta label="Bucket" value={item.bucket} />
            <Meta label="Folder" value={folderName ?? "—"} />
            <Meta label="Size" value={formatBytes(item.sizeBytes)} />
            <Meta label="Dimensions" value={item.width && item.height ? `${item.width}×${item.height}` : "—"} />
            <Meta label="Uploaded" value={formatDate(item.createdAt)} />
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="primary" size="sm" onClick={() => onDownload(item)}>Download</Button>
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm">Close</Button>
              </Dialog.Close>
            </div>
          </dl>
        </div>
      )}
    </ModalShell>
  );
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-cream-200 pb-2">
      <dt className="text-green-700/60">{label}</dt>
      <dd className="max-w-[60%] truncate text-right font-medium text-green-900">{value}</dd>
    </div>
  );
}

function RenameDialog({ item, loading, onClose, onSave }: { item: MediaItem | null; loading: boolean; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState("");
  useEffect(() => {
    if (item) setName(item.originalName ?? "");
  }, [item]);

  return (
    <ModalShell open={item !== null} onClose={onClose} title="Rename file">
      <div className="mt-4 space-y-4">
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-label="File name" />
        <div className="flex justify-end gap-2.5">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={() => onSave(name)} disabled={loading || !name.trim()}>Save</Button>
        </div>
      </div>
    </ModalShell>
  );
}

function MoveDialog({ open, count, folders, loading, onClose, onMove }: { open: boolean; count: number; folders: MediaFolderItem[]; loading: boolean; onClose: () => void; onMove: (folderId: string | null) => void }) {
  const [folderId, setFolderId] = useState<string>("");

  return (
    <ModalShell open={open} onClose={onClose} title={`Move ${count} file${count === 1 ? "" : "s"}`}>
      <div className="mt-4 space-y-4">
        <Select aria-label="Target folder" value={folderId} onChange={(e) => setFolderId(e.target.value)}>
          <option value="">No folder</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </Select>
        <p className="text-xs text-green-700/60">Custom folders only. System folders are mapped to storage buckets.</p>
        <div className="flex justify-end gap-2.5">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={() => onMove(folderId || null)} disabled={loading}>Move</Button>
        </div>
      </div>
    </ModalShell>
  );
}

function NewFolderDialog({ open, loading, onClose, onCreate }: { open: boolean; loading: boolean; onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  useEffect(() => {
    if (open) setName("");
  }, [open]);

  return (
    <ModalShell open={open} onClose={onClose} title="New folder">
      <div className="mt-4 space-y-4">
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Folder name" aria-label="Folder name" />
        <div className="flex justify-end gap-2.5">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={() => onCreate(name)} disabled={loading || !name.trim()}>Create</Button>
        </div>
      </div>
    </ModalShell>
  );
}
