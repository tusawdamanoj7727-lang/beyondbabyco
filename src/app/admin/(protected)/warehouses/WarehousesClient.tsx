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
import type { WarehouseListItem } from "@/lib/admin/warehouses";
import type { WarehouseStatus } from "@/lib/admin/inventory-types";
import { bulkDeleteWarehouses, deleteWarehouse } from "@/lib/admin/warehouse-actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function WarehousesClient(props: {
  rows: WarehouseListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  filters: { search: string; status: WarehouseStatus | "all" };
  sort: string;
  dir: "asc" | "desc";
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState(props.filters.search);
  const [deleteTarget, setDeleteTarget] = useState<WarehouseListItem | null>(null);
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
      status: props.filters.status,
      sort: props.sort,
      dir: props.dir,
      page: String(props.page),
    };
    const merged = { ...base, ...patch };
    if (resetPage && !("page" in patch)) merged.page = "1";
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") sp.set(k, v);
    }
    router.push(`/admin/warehouses?${sp.toString()}`);
  }

  const columns: Column<WarehouseListItem>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortKey: "name",
      render: (r) => (
        <div>
          <Link href={`/admin/warehouses/${r.id}`} className="font-semibold text-green-900 hover:underline">
            {r.name}
          </Link>
          {r.isDefault && (
            <Badge variant="info" size="sm" className="ml-2">
              Default
            </Badge>
          )}
        </div>
      ),
    },
    { key: "code", header: "Code", sortable: true, sortKey: "code", render: (r) => <span className="font-mono text-sm">{r.code}</span> },
    { key: "city", header: "City", sortable: true, sortKey: "city", render: (r) => r.city ?? "—" },
    { key: "contact", header: "Contact", render: (r) => r.contactPerson ?? r.phone ?? "—" },
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
          <Link href={`/admin/warehouses/${r.id}`} className="rounded-lg p-1.5 text-green-700/60 hover:bg-cream-100" aria-label={`Edit ${r.name}`}>
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
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search warehouses…"
          aria-label="Search warehouses"
          className={fieldControlClasses + " flex-1"}
        />
        <Select aria-label="Filter by status" value={props.filters.status} onChange={(e) => push({ status: e.target.value })} className="sm:w-40">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      <BulkActions
        count={selectedIds.length}
        loading={pending}
        onDelete={() => setBulkDeleteOpen(true)}
        onClear={() => setSelectedIds([])}
      />

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
            title="No warehouses yet"
            description="Add a warehouse to manage inventory and fulfilment locations."
          />
        }
      />

      <Pagination page={props.page} pageCount={props.pageCount} total={props.total} perPage={props.perPage} onPageChange={(p) => push({ page: String(p) }, false)} />

      <DeleteDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} itemName={deleteTarget?.name} loading={pending} onConfirm={() => deleteTarget && startTransition(async () => { await deleteWarehouse(deleteTarget.id); setDeleteTarget(null); router.refresh(); })} />
      <DeleteDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedIds.length} loading={pending} onConfirm={() => startTransition(async () => { await bulkDeleteWarehouses(selectedIds); setBulkDeleteOpen(false); setSelectedIds([]); router.refresh(); })} />
    </div>
  );
}
