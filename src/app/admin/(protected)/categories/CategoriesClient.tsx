"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import BulkActions from "@/components/admin/BulkActions";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import DeleteDialog from "@/components/admin/DeleteDialog";
import Icon from "@/components/admin/Icon";
import { Select, fieldControlClasses } from "@/components/admin/FormField";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { CategoryListItem } from "@/lib/admin/categories";
import type { CatalogStatus, ProductStatus } from "@/lib/supabase/database.types";
import {
  bulkSoftDeleteCategories,
  bulkUpdateCategoryStatus,
  duplicateCategory,
  reorderCategories,
  restoreCategory,
  softDeleteCategory,
} from "@/lib/admin/category-actions";

interface Option {
  id: string;
  name: string;
}

export interface CategoryFiltersValue {
  search: string;
  status: CatalogStatus | "all";
  parentId: string;
  featured: boolean;
}

export interface CategoriesClientProps {
  rows: CategoryListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  parents: Option[];
  filters: CategoryFiltersValue;
  sort: string;
  dir: "asc" | "desc";
  trash: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function CategoriesClient(props: CategoriesClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [rowDeleteTarget, setRowDeleteTarget] = useState<CategoryListItem | null>(null);
  const [search, setSearch] = useState(props.filters.search);
  const [orderedRows, setOrderedRows] = useState(props.rows);

  useEffect(() => setSelectedIds([]), [props.rows]);
  useEffect(() => setOrderedRows(props.rows), [props.rows]);
  useEffect(() => setSearch(props.filters.search), [props.filters.search]);

  // Debounce free-text search.
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
      status: props.filters.status,
      parent: props.filters.parentId,
      featured: props.filters.featured ? "1" : "",
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
    router.push(`/admin/categories?${sp.toString()}`);
  }

  function onSort(key: string) {
    const nextDir = props.sort === key && props.dir === "asc" ? "desc" : "asc";
    pushParams({ sort: key, dir: nextDir });
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? orderedRows.map((r) => r.id) : []);
  }

  function runBulkStatus(status: CatalogStatus) {
    startTransition(async () => {
      await bulkUpdateCategoryStatus(selectedIds, status);
      setSelectedIds([]);
      router.refresh();
    });
  }
  function runBulkDelete() {
    startTransition(async () => {
      await bulkSoftDeleteCategories(selectedIds);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      router.refresh();
    });
  }
  function runRowDelete() {
    if (!rowDeleteTarget) return;
    const id = rowDeleteTarget.id;
    startTransition(async () => {
      await softDeleteCategory(id);
      setRowDeleteTarget(null);
      router.refresh();
    });
  }

  // Drag-and-drop ordering: only meaningful in the default, unfiltered view.
  const canReorder =
    !props.trash &&
    props.sort === "position" &&
    !props.filters.search &&
    props.filters.status === "all" &&
    !props.filters.parentId &&
    !props.filters.featured;

  function onReorder(orderedIds: string[]) {
    const map = new Map(orderedRows.map((r) => [r.id, r]));
    setOrderedRows(orderedIds.map((id) => map.get(id)!).filter(Boolean));
    startTransition(async () => {
      await reorderCategories(orderedIds);
      router.refresh();
    });
  }

  const hasFilters =
    props.filters.search ||
    props.filters.status !== "all" ||
    props.filters.parentId ||
    props.filters.featured;

  const columns: Column<CategoryListItem>[] = [
    {
      key: "image",
      header: "",
      headerClassName: "w-14",
      render: (c) => (
        <div className="h-11 w-11 overflow-hidden rounded-xl bg-cream-100 ring-1 ring-cream-200">
          {c.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-green-700/30">
              <Icon name="categories" size={18} />
            </span>
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (c) => (
        <button
          type="button"
          onClick={() => router.push(`/admin/categories/${c.id}`)}
          className="text-left font-semibold text-green-900 hover:text-green-700 focus-visible:outline-none focus-visible:underline"
        >
          {c.name}
        </button>
      ),
    },
    { key: "slug", header: "Slug", render: (c) => <span className="text-green-700/70">/{c.slug}</span> },
    { key: "parent", header: "Parent", render: (c) => <span className="text-green-700/70">{c.parentName ?? "—"}</span> },
    {
      key: "products",
      header: "Products",
      align: "right",
      render: (c) => <span className="font-medium text-green-800">{c.productCount}</span>,
    },
    {
      key: "featured",
      header: "Featured",
      align: "center",
      render: (c) =>
        c.isFeatured ? (
          <span className="text-terra-500" aria-label="Featured">
            <Icon name="sparkles" size={18} />
          </span>
        ) : (
          <span className="text-green-700/20" aria-label="Not featured">—</span>
        ),
    },
    { key: "status", header: "Status", sortable: true, render: (c) => <StatusBadge status={c.status as ProductStatus} /> },
    { key: "updated", header: "Updated", sortable: true, sortKey: "updated_at", render: (c) => <span className="whitespace-nowrap text-green-700/60">{formatDate(c.updatedAt)}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => (
        <RowActions
          isTrash={props.trash}
          onView={() => router.push(`/admin/categories/${c.id}`)}
          onEdit={() => router.push(`/admin/categories/${c.id}`)}
          onDuplicate={() => startTransition(() => duplicateCategory(c.id))}
          onArchive={() =>
            startTransition(async () => {
              await bulkUpdateCategoryStatus([c.id], "archived");
              router.refresh();
            })
          }
          onRestore={() =>
            startTransition(async () => {
              await restoreCategory(c.id);
              router.refresh();
            })
          }
          onDelete={() => setRowDeleteTarget(c)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* View switch */}
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-2xl border border-cream-300 bg-cream-50 p-1">
          <button
            type="button"
            onClick={() => pushParams({ trash: "" })}
            className={cn(
              "rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors",
              !props.trash ? "bg-green-500 text-cream-50" : "text-green-700/70 hover:text-green-900",
            )}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => pushParams({ trash: "1" })}
            className={cn(
              "rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors",
              props.trash ? "bg-green-500 text-cream-50" : "text-green-700/70 hover:text-green-900",
            )}
          >
            Trash
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-green-600">
            <Icon name="search" size={18} />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or slug…"
            aria-label="Search categories"
            className={cn(fieldControlClasses, "pl-11")}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
          <Select
            aria-label="Filter by status"
            value={props.filters.status}
            onChange={(e) => pushParams({ status: e.target.value })}
            className="lg:w-36"
          >
            <option value="all">All statuses</option>
            <option value="active">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </Select>
          <Select
            aria-label="Filter by parent"
            value={props.filters.parentId}
            onChange={(e) => pushParams({ parent: e.target.value })}
            className="lg:w-44"
          >
            <option value="">All parents</option>
            {props.parents.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
          <label
            className={cn(
              "flex cursor-pointer items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors",
              props.filters.featured
                ? "border-green-500 bg-green-50 text-green-800"
                : "border-cream-300 bg-cream-50 text-green-700/70 hover:border-green-300",
            )}
          >
            <input
              type="checkbox"
              checked={props.filters.featured}
              onChange={(e) => pushParams({ featured: e.target.checked ? "1" : "" })}
              className="h-4 w-4 rounded border-cream-300 accent-green-600"
            />
            Featured
          </label>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => pushParams({ q: "", status: "all", parent: "", featured: "" })}
            className="flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-medium text-terra-600 transition-colors hover:bg-terra-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
          >
            <Icon name="close" size={16} /> Clear
          </button>
        )}
      </div>

      {canReorder && orderedRows.length > 1 && (
        <p className="text-xs text-green-700/60">
          Tip: drag the handle to reorder categories. The order is saved automatically.
        </p>
      )}

      <BulkActions
        count={selectedIds.length}
        loading={isPending}
        onPublish={() => runBulkStatus("active")}
        onUnpublish={() => runBulkStatus("draft")}
        onArchive={() => runBulkStatus("archived")}
        onDelete={() => setBulkDeleteOpen(true)}
        onClear={() => setSelectedIds([])}
      />

      <DataTable
        columns={columns}
        rows={orderedRows}
        getRowId={(c) => c.id}
        selectable
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        sort={{ key: props.sort, dir: props.dir }}
        onSort={onSort}
        reorderable={canReorder}
        onReorder={onReorder}
        empty={
          <EmptyState
            mascot
            title={props.trash ? "Trash is empty" : "No categories yet"}
            description={
              props.trash
                ? "Deleted categories will appear here and can be restored."
                : "Create your first category to organise your catalog."
            }
            action={
              !props.trash ? (
                <Button variant="primary" size="md" onClick={() => router.push("/admin/categories/new")}>
                  Add Category
                </Button>
              ) : undefined
            }
          />
        }
      />

      <Pagination
        page={props.page}
        pageCount={props.pageCount}
        total={props.total}
        perPage={props.perPage}
        onPageChange={(p) => pushParams({ page: String(p) }, false)}
      />

      <DeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={selectedIds.length}
        loading={isPending}
        onConfirm={runBulkDelete}
      />
      <DeleteDialog
        open={rowDeleteTarget !== null}
        onOpenChange={(o) => !o && setRowDeleteTarget(null)}
        itemName={rowDeleteTarget?.name}
        loading={isPending}
        onConfirm={runRowDelete}
      />
    </div>
  );
}

function RowActions({
  isTrash,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
}: {
  isTrash: boolean;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const item =
    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50";

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-xl border border-cream-300 bg-white text-green-700 transition-colors hover:bg-cream-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
      >
        <span className="text-lg leading-none">⋯</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-2xl border border-cream-300 bg-white p-1.5 shadow-clay">
          {isTrash ? (
            <button role="menuitem" className={cn(item, "text-green-800 hover:bg-green-50")} onClick={() => { setOpen(false); onRestore(); }}>
              <Icon name="external" size={16} /> Restore
            </button>
          ) : (
            <>
              <button role="menuitem" className={cn(item, "text-green-800 hover:bg-green-50")} onClick={() => { setOpen(false); onView(); }}>
                <Icon name="reviews" size={16} /> View
              </button>
              <button role="menuitem" className={cn(item, "text-green-800 hover:bg-green-50")} onClick={() => { setOpen(false); onEdit(); }}>
                <Icon name="blog" size={16} /> Edit
              </button>
              <button role="menuitem" className={cn(item, "text-green-800 hover:bg-green-50")} onClick={() => { setOpen(false); onDuplicate(); }}>
                <Icon name="categories" size={16} /> Duplicate
              </button>
              <button role="menuitem" className={cn(item, "text-green-800 hover:bg-green-50")} onClick={() => { setOpen(false); onArchive(); }}>
                <Icon name="audit" size={16} /> Archive
              </button>
              <div className="my-1 border-t border-cream-200" />
              <button role="menuitem" className={cn(item, "text-terra-600 hover:bg-terra-50")} onClick={() => { setOpen(false); onDelete(); }}>
                <Icon name="close" size={16} /> Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
