"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Filters, { type ProductFiltersValue } from "@/components/admin/Filters";
import Pagination from "@/components/admin/Pagination";
import BulkActions from "@/components/admin/BulkActions";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import DeleteDialog from "@/components/admin/DeleteDialog";
import Icon from "@/components/admin/Icon";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "@/lib/admin/products";
import type { ProductStatus } from "@/lib/supabase/database.types";
import {
  bulkSoftDelete,
  bulkUpdateStatus,
  duplicateProduct,
  restoreProduct,
  softDeleteProduct,
} from "@/lib/admin/product-actions";

interface Option {
  id: string;
  name: string;
}

export interface ProductsClientProps {
  rows: ProductListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  brands: Option[];
  categories: Option[];
  filters: ProductFiltersValue;
  sort: string;
  dir: "asc" | "desc";
  trash: boolean;
}

function money(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ProductsClient(props: ProductsClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [rowDeleteTarget, setRowDeleteTarget] = useState<ProductListItem | null>(null);

  // Clear selection whenever the result set changes.
  useEffect(() => setSelectedIds([]), [props.rows]);

  function pushParams(patch: Record<string, string | null>, resetPage = true) {
    const sp = new URLSearchParams();
    const base: Record<string, string> = {
      q: props.filters.search,
      status: props.filters.status,
      brand: props.filters.brandId,
      category: props.filters.categoryId,
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
    router.push(`/admin/products?${sp.toString()}`);
  }

  function onFilterChange(patch: Partial<ProductFiltersValue>) {
    pushParams({
      ...(patch.search !== undefined ? { q: patch.search } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.brandId !== undefined ? { brand: patch.brandId } : {}),
      ...(patch.categoryId !== undefined ? { category: patch.categoryId } : {}),
      ...(patch.featured !== undefined ? { featured: patch.featured ? "1" : "" } : {}),
    });
  }

  function onSort(key: string) {
    const nextDir = props.sort === key && props.dir === "asc" ? "desc" : "asc";
    pushParams({ sort: key, dir: nextDir });
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? props.rows.map((r) => r.id) : []);
  }

  function runBulkStatus(status: ProductStatus) {
    startTransition(async () => {
      await bulkUpdateStatus(selectedIds, status);
      setSelectedIds([]);
      router.refresh();
    });
  }
  function runBulkDelete() {
    startTransition(async () => {
      await bulkSoftDelete(selectedIds);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      router.refresh();
    });
  }

  function runRowDelete() {
    if (!rowDeleteTarget) return;
    const id = rowDeleteTarget.id;
    startTransition(async () => {
      await softDeleteProduct(id);
      setRowDeleteTarget(null);
      router.refresh();
    });
  }

  const columns: Column<ProductListItem>[] = [
    {
      key: "thumbnail",
      header: "",
      headerClassName: "w-14",
      render: (p) => (
        <div className="h-11 w-11 overflow-hidden rounded-xl bg-cream-100 ring-1 ring-cream-200">
          {p.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-green-700/30">
              <Icon name="products" size={18} />
            </span>
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (p) => (
        <button
          type="button"
          onClick={() => router.push(`/admin/products/${p.id}`)}
          className="text-left font-semibold text-green-900 hover:text-green-700 focus-visible:outline-none focus-visible:underline"
        >
          {p.name}
        </button>
      ),
    },
    { key: "sku", header: "SKU", render: (p) => <span className="text-green-700/70">{p.sku ?? "—"}</span> },
    { key: "category", header: "Category", render: (p) => <span className="text-green-700/70">{p.categoryName ?? "—"}</span> },
    { key: "brand", header: "Brand", render: (p) => <span className="text-green-700/70">{p.brandName ?? "—"}</span> },
    {
      key: "price",
      header: "Price",
      sortable: true,
      align: "right",
      render: (p) =>
        p.salePrice != null ? (
          <span className="whitespace-nowrap">
            <span className="font-semibold text-green-900">{money(p.salePrice)}</span>{" "}
            <span className="text-xs text-green-700/40 line-through">{money(p.price)}</span>
          </span>
        ) : (
          <span className="font-semibold text-green-900">{money(p.price)}</span>
        ),
    },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
      align: "right",
      render: (p) => {
        const out = p.stock <= 0;
        const low = !out && p.stock <= p.lowStockThreshold;
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 font-medium",
              out ? "text-terra-600" : low ? "text-cream-700" : "text-green-800",
            )}
          >
            {p.stock}
            {out && <span className="rounded-full bg-terra-50 px-1.5 text-[10px] font-semibold uppercase">Out</span>}
            {low && <span className="rounded-full bg-cream-200 px-1.5 text-[10px] font-semibold uppercase">Low</span>}
          </span>
        );
      },
    },
    { key: "status", header: "Status", sortable: true, render: (p) => <StatusBadge status={p.status} /> },
    {
      key: "featured",
      header: "Featured",
      align: "center",
      render: (p) =>
        p.isFeatured ? (
          <span className="text-terra-500" aria-label="Featured">
            <Icon name="reviews" size={18} />
          </span>
        ) : (
          <span className="text-green-700/20" aria-label="Not featured">—</span>
        ),
    },
    { key: "updated", header: "Updated", sortable: true, sortKey: "updated_at", render: (p) => <span className="whitespace-nowrap text-green-700/60">{formatDate(p.updatedAt)}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => (
        <RowActions
          isTrash={props.trash}
          onView={() => router.push(`/admin/products/${p.id}`)}
          onEdit={() => router.push(`/admin/products/${p.id}`)}
          onDuplicate={() => startTransition(() => duplicateProduct(p.id))}
          onArchive={() =>
            startTransition(async () => {
              await bulkUpdateStatus([p.id], "archived");
              router.refresh();
            })
          }
          onRestore={() =>
            startTransition(async () => {
              await restoreProduct(p.id);
              router.refresh();
            })
          }
          onDelete={() => setRowDeleteTarget(p)}
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

      <Filters value={props.filters} brands={props.brands} categories={props.categories} onChange={onFilterChange} />

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
        rows={props.rows}
        getRowId={(p) => p.id}
        selectable
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        sort={{ key: props.sort, dir: props.dir }}
        onSort={onSort}
        empty={
          <EmptyState
            mascot
            title={props.trash ? "Trash is empty" : "No products found"}
            description={
              props.trash
                ? "Deleted products will appear here and can be restored."
                : "Try adjusting your filters, or add your first product to get started."
            }
            action={
              !props.trash ? (
                <Button variant="primary" size="md" onClick={() => router.push("/admin/products/new")}>
                  Add Product
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
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-2xl border border-cream-300 bg-white p-1.5 shadow-clay"
        >
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
