"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import BulkActions from "@/components/admin/BulkActions";
import DeleteDialog from "@/components/admin/DeleteDialog";
import EmptyState from "@/components/admin/EmptyState";
import Icon from "@/components/admin/Icon";
import Badge from "@/components/ui/Badge";
import { Select, fieldControlClasses } from "@/components/admin/FormField";
import type { SupplierListItem } from "@/lib/admin/suppliers";
import { bulkDeleteSuppliers, deleteSupplier } from "@/lib/admin/supplier-actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function SuppliersClient(props: {
  rows: SupplierListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  filters: { search: string; active: boolean | "all" };
  sort: string;
  dir: "asc" | "desc";
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState(props.filters.search);
  const [deleteTarget, setDeleteTarget] = useState<SupplierListItem | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
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
      active: props.filters.active === "all" ? "" : props.filters.active ? "1" : "0",
      sort: props.sort,
      dir: props.dir,
      page: String(props.page),
    };
    const merged = { ...base, ...patch };
    if (resetPage && !("page" in patch)) merged.page = "1";
    for (const [k, v] of Object.entries(merged)) {
      if (v !== "" && v !== null) sp.set(k, v);
    }
    router.push(`/admin/suppliers?${sp.toString()}`);
  }

  const columns: Column<SupplierListItem>[] = [
    {
      key: "name",
      header: "Company",
      sortable: true,
      sortKey: "name",
      render: (r) => (
        <Link href={`/admin/suppliers/${r.id}`} className="font-semibold text-green-900 hover:underline">
          {r.name}
        </Link>
      ),
    },
    { key: "contact", header: "Contact", render: (r) => r.contactName ?? "—" },
    { key: "email", header: "Email", render: (r) => r.email ?? "—" },
    { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
    { key: "gstin", header: "GST", render: (r) => r.gstin ?? "—" },
    { key: "country", header: "Country", sortable: true, sortKey: "country", render: (r) => r.country ?? "—" },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={r.isActive ? "success" : "default"} size="sm">
          {r.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    { key: "updated_at", header: "Updated", sortable: true, sortKey: "updated_at", render: (r) => formatDate(r.updatedAt) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <Link href={`/admin/suppliers/${r.id}`} className="rounded-lg p-1.5 text-green-700/60 hover:bg-cream-100" aria-label={`Edit ${r.name}`}>
            <Icon name="settings" size={16} />
          </Link>
          <button type="button" onClick={() => setDeleteTarget(r)} className="rounded-lg p-1.5 text-terra-600 hover:bg-terra-50" aria-label={`Delete ${r.name}`}>
            <Icon name="close" size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers…" aria-label="Search suppliers" className={fieldControlClasses + " flex-1"} />
        <Select
          aria-label="Filter by status"
          value={props.filters.active === "all" ? "all" : props.filters.active ? "active" : "inactive"}
          onChange={(e) => {
            const v = e.target.value;
            push({ active: v === "all" ? null : v === "active" ? "1" : "0" });
          }}
          className="sm:w-40"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      <BulkActions count={selectedIds.length} loading={pending} onDelete={() => setBulkDeleteOpen(true)} onClear={() => setSelectedIds([])} />

      <DataTable
        columns={columns}
        rows={props.rows}
        getRowId={(r) => r.id}
        selectable
        selectedIds={selectedIds}
        onToggleRow={(id) => setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
        onToggleAll={(checked) => setSelectedIds(checked ? props.rows.map((r) => r.id) : [])}
        sort={{ key: props.sort, dir: props.dir }}
        onSort={(k) => push({ sort: k, dir: props.sort === k && props.dir === "asc" ? "desc" : "asc" })}
        loading={pending}
        empty={
          <EmptyState
            icon="inventory"
            title="No suppliers yet"
            description="Add suppliers to track purchase orders and vendor relationships."
          />
        }
      />

      <Pagination page={props.page} pageCount={props.pageCount} total={props.total} perPage={props.perPage} onPageChange={(p) => push({ page: String(p) }, false)} />

      <DeleteDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} itemName={deleteTarget?.name} loading={pending} onConfirm={() => deleteTarget && startTransition(async () => { await deleteSupplier(deleteTarget.id); setDeleteTarget(null); router.refresh(); })} />
      <DeleteDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedIds.length} loading={pending} onConfirm={() => startTransition(async () => { await bulkDeleteSuppliers(selectedIds); setBulkDeleteOpen(false); setSelectedIds([]); router.refresh(); })} />
    </div>
  );
}
