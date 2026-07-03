"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import BulkActions from "@/components/admin/BulkActions";
import StatsCard from "@/components/admin/StatsCard";
import InventoryStatusBadge from "@/components/admin/InventoryStatusBadge";
import PoStatusBadge from "@/components/admin/PoStatusBadge";
import Icon from "@/components/admin/Icon";
import EmptyState from "@/components/admin/EmptyState";
import Button from "@/components/ui/Button";
import FormField, { Input, Select, Textarea, fieldControlClasses } from "@/components/admin/FormField";
import { Spinner } from "@/components/admin/LoadingState";
import {
  ADJUSTMENT_REASONS,
  INVENTORY_SORTABLE_COLUMNS,
  STOCK_STATUSES,
  type InventoryListItem,
  type InventoryDashboard,
  type PurchaseOrderListItem,
  type StockStatusFilter,
} from "@/lib/admin/inventory-types";
import type { VariantOption } from "@/lib/admin/inventory";
import {
  adjustStock,
  bulkUpdateReorderLevel,
  cancelPurchaseOrder,
  createPurchaseOrder,
  fetchPurchaseOrder,
  previewAdjustment,
  receivePurchaseOrder,
  updatePurchaseOrderStatus,
} from "@/lib/admin/inventory-actions";

interface PoDetail {
  id: string;
  poNumber: string;
  items: {
    id: string;
    productName: string;
    variantName: string;
    quantity: number;
    quantityReceived: number;
  }[];
}
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function InventoryClient(props: {
  rows: InventoryListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  dashboard: InventoryDashboard;
  purchaseOrders: PurchaseOrderListItem[];
  warehouses: { id: string; name: string; code: string }[];
  products: { id: string; name: string }[];
  variants: VariantOption[];
  suppliers: { id: string; name: string }[];
  filters: {
    search: string;
    warehouseId: string;
    productId: string;
    stockStatus: StockStatusFilter;
  };
  sort: string;
  dir: "asc" | "desc";
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"stock" | "po">("stock");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState(props.filters.search);
  const [adjustTarget, setAdjustTarget] = useState<InventoryListItem | null>(null);
  const [poOpen, setPoOpen] = useState(false);
  const [receivePo, setReceivePo] = useState<string | null>(null);
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
      warehouse: props.filters.warehouseId,
      product: props.filters.productId,
      stock: props.filters.stockStatus,
      sort: props.sort,
      dir: props.dir,
      page: String(props.page),
    };
    const merged = { ...base, ...patch };
    if (resetPage && !("page" in patch)) merged.page = "1";
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") sp.set(k, v);
    }
    router.push(`/admin/inventory?${sp.toString()}`);
  }

  const columns: Column<InventoryListItem>[] = [
    {
      key: "product",
      header: "Product",
      sortable: true,
      sortKey: "product",
      render: (r) => (
        <div>
          <p className="font-semibold text-green-900">{r.productName}</p>
          {r.sku && <p className="text-xs text-green-700/50">{r.sku}</p>}
        </div>
      ),
    },
    { key: "variant", header: "Variant", sortable: true, sortKey: "variant", render: (r) => r.variantName },
    { key: "warehouse", header: "Warehouse", sortable: true, sortKey: "warehouse", render: (r) => r.warehouseName },
    { key: "available", header: "Available", sortable: true, sortKey: "quantity", align: "right", render: (r) => r.available },
    { key: "reserved", header: "Reserved", align: "right", render: (r) => r.reserved },
    { key: "incoming", header: "Incoming", align: "right", render: (r) => r.incoming || "—" },
    { key: "reorder", header: "Low limit", align: "right", render: (r) => r.reorderLevel },
    { key: "status", header: "Status", render: (r) => <InventoryStatusBadge status={r.status} /> },
    { key: "updated_at", header: "Updated", sortable: true, sortKey: "updated_at", render: (r) => formatDate(r.updatedAt) },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button type="button" onClick={() => setAdjustTarget(r)} className="rounded-lg px-2 py-1 text-sm font-medium text-green-700 hover:bg-green-50">
          Adjust
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatsCard label="Total stock value" value={formatMoney(props.dashboard.totalStockValue)} icon="revenue" />
        <StatsCard label="Low stock" value={String(props.dashboard.lowStockCount)} icon="activity" hint="At or below reorder level" />
        <StatsCard label="Out of stock" value={String(props.dashboard.outOfStockCount)} icon="inventory" />
        <StatsCard label="Incoming shipments" value={String(props.dashboard.incomingShipments)} icon="orders" />
        <StatsCard label="Recent adjustments" value={String(props.dashboard.recentAdjustments.length)} icon="audit" hint="Latest manual changes" />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-cream-200 pb-2" role="tablist" aria-label="Inventory views">
        {(["stock", "po"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-2xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50",
              tab === t ? "bg-green-500 text-cream-50" : "text-green-800 hover:bg-green-50",
            )}
          >
            {t === "stock" ? "Stock levels" : "Purchase orders"}
          </button>
        ))}
      </div>

      {tab === "stock" ? (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product or SKU…" aria-label="Search inventory" className={fieldControlClasses + " flex-1"} />
            <Select aria-label="Warehouse filter" value={props.filters.warehouseId || "all"} onChange={(e) => push({ warehouse: e.target.value === "all" ? null : e.target.value })} className="lg:w-44">
              <option value="all">All warehouses</option>
              {props.warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
            <Select aria-label="Product filter" value={props.filters.productId || "all"} onChange={(e) => push({ product: e.target.value === "all" ? null : e.target.value })} className="lg:w-44">
              <option value="all">All products</option>
              {props.products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
            <Select aria-label="Stock level filter" value={props.filters.stockStatus} onChange={(e) => push({ stock: e.target.value })} className="lg:w-40">
              {STOCK_STATUSES.map((s) => (
                <option key={s} value={s}>{s === "all" ? "All levels" : s.replace(/_/g, " ")}</option>
              ))}
            </Select>
          </div>

          <BulkActions
            count={selectedIds.length}
            loading={pending}
            onPublish={() => {
              const level = prompt("Set reorder level for selected rows:", "5");
              if (level === null) return;
              startTransition(async () => {
                await bulkUpdateReorderLevel(selectedIds, Number(level) || 0);
                setSelectedIds([]);
                router.refresh();
              });
            }}
            publishLabel="Set reorder level"
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
            onSort={(k) => {
              if (!(INVENTORY_SORTABLE_COLUMNS as readonly string[]).includes(k)) return;
              push({ sort: k, dir: props.sort === k && props.dir === "asc" ? "desc" : "asc" });
            }}
            loading={pending}
            empty={
              <EmptyState
                icon="inventory"
                title="No inventory rows"
                description="Adjust filters or add products with stock to see inventory here."
              />
            }
          />

          <Pagination page={props.page} pageCount={props.pageCount} total={props.total} perPage={props.perPage} onPageChange={(p) => push({ page: String(p) }, false)} />
        </>
      ) : (
        <PurchaseOrdersPanel
          rows={props.purchaseOrders}
          suppliers={props.suppliers}
          warehouses={props.warehouses}
          variants={props.variants}
          onCreate={() => setPoOpen(true)}
          onReceive={(id) => setReceivePo(id)}
          onSend={(id) => startTransition(async () => { await updatePurchaseOrderStatus(id, "sent"); router.refresh(); })}
          onCancel={(id) => startTransition(async () => { await cancelPurchaseOrder(id); router.refresh(); })}
        />
      )}

      {adjustTarget && (
        <AdjustDialog
          row={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onSaved={() => { setAdjustTarget(null); router.refresh(); }}
        />
      )}

      {poOpen && (
        <CreatePoDialog
          suppliers={props.suppliers}
          warehouses={props.warehouses}
          variants={props.variants}
          onClose={() => setPoOpen(false)}
          onSaved={() => { setPoOpen(false); router.refresh(); }}
        />
      )}

      {receivePo && (
        <ReceivePoDialog
          poId={receivePo}
          onClose={() => setReceivePo(null)}
          onSaved={() => { setReceivePo(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

function AdjustDialog({ row, onClose, onSaved }: { row: InventoryListItem; onClose: () => void; onSaved: () => void }) {
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<string>(ADJUSTMENT_REASONS[0]);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<{ currentQuantity: number; available: number; nextQuantity: number; valid: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      previewAdjustment(row.id, direction, quantity).then(setPreview);
    }, 150);
    return () => clearTimeout(t);
  }, [row.id, direction, quantity]);

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-green-900/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[120] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-4xl border border-cream-300 bg-white p-6 shadow-clay focus:outline-none">
          <Dialog.Title className="font-heading text-lg font-bold text-green-900">Adjust stock</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-green-700/60">
            {row.productName} · {row.variantName} · {row.warehouseName}
          </Dialog.Description>

          <div className="mt-5 space-y-4">
            <FormField label="Direction">
              <Select value={direction} onChange={(e) => setDirection(e.target.value as "increase" | "decrease")}>
                <option value="increase">Increase</option>
                <option value="decrease">Decrease</option>
              </Select>
            </FormField>
            <FormField label="Quantity">
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 1)} />
            </FormField>
            <FormField label="Reason">
              <Select value={reason} onChange={(e) => setReason(e.target.value)}>
                {ADJUSTMENT_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Notes">
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </FormField>

            {preview && (
              <div className="rounded-2xl border border-cream-300 bg-cream-50 p-4 text-sm" aria-live="polite">
                <p>Current on-hand: <strong>{preview.currentQuantity}</strong> (available {preview.available})</p>
                <p className="mt-1">After adjustment: <strong className={preview.valid ? "text-green-700" : "text-terra-600"}>{preview.nextQuantity}</strong></p>
              </div>
            )}

            {error && <p role="alert" className="text-sm font-medium text-terra-600">{error}</p>}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              size="sm"
              disabled={pending || !preview?.valid}
              leftIcon={pending ? <Spinner size={16} className="border-white/50 border-t-white" /> : undefined}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const res = await adjustStock({ inventoryId: row.id, direction, quantity, reason, note: note || null });
                  if (!res.ok) setError(res.error);
                  else onSaved();
                });
              }}
            >
              Save adjustment
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CreatePoDialog({
  suppliers,
  warehouses,
  variants,
  onClose,
  onSaved,
}: {
  suppliers: { id: string; name: string }[];
  warehouses: { id: string; name: string; code: string }[];
  variants: VariantOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [expectedAt, setExpectedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([{ variantId: variants[0]?.id ?? "", quantity: 1, unitCost: 0 }]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-green-900/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[120] max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-4xl border border-cream-300 bg-white p-6 shadow-clay focus:outline-none">
          <Dialog.Title className="font-heading text-lg font-bold text-green-900">Create purchase order</Dialog.Title>

          <div className="mt-5 space-y-4">
            <FormField label="Supplier">
              <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Select supplier…</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Warehouse">
              <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Expected date">
              <Input type="date" value={expectedAt} onChange={(e) => setExpectedAt(e.target.value)} />
            </FormField>
            <FormField label="Notes">
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </FormField>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-green-900">Line items</p>
              {lines.map((line, i) => (
                <div key={i} className="grid gap-2 rounded-2xl border border-cream-300 bg-cream-50 p-3 sm:grid-cols-[1fr_5rem_5rem]">
                  <Select value={line.variantId} onChange={(e) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, variantId: e.target.value } : l)))}>
                    {variants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                  </Select>
                  <Input type="number" min={1} value={line.quantity} onChange={(e) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, quantity: Number(e.target.value) || 1 } : l)))} placeholder="Qty" aria-label="Quantity" />
                  <Input type="number" min={0} step="0.01" value={line.unitCost} onChange={(e) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, unitCost: Number(e.target.value) || 0 } : l)))} placeholder="Cost" aria-label="Unit cost" />
                </div>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={() => setLines([...lines, { variantId: variants[0]?.id ?? "", quantity: 1, unitCost: 0 }])}>
                Add line
              </Button>
            </div>

            {error && <p role="alert" className="text-sm font-medium text-terra-600">{error}</p>}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" disabled={pending} onClick={() => {
              setError(null);
              startTransition(async () => {
                const res = await createPurchaseOrder({
                  supplierId: supplierId || null,
                  warehouseId: warehouseId || null,
                  expectedAt: expectedAt ? new Date(expectedAt).toISOString() : null,
                  notes: notes || null,
                  items: lines.map((l) => ({ productVariantId: l.variantId, quantity: l.quantity, unitCost: l.unitCost })),
                });
                if (!res.ok) setError(res.error);
                else onSaved();
              });
            }}>
              Create draft PO
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ReceivePoDialog({ poId, onClose, onSaved }: { poId: string; onClose: () => void; onSaved: () => void }) {
  const [detail, setDetail] = useState<PoDetail | null>(null);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    fetchPurchaseOrder(poId).then((d) => {
      if (!d) return;
      setDetail({ id: d.id, poNumber: d.poNumber, items: d.items });
      const init: Record<string, number> = {};
      for (const item of d.items) {
        init[item.id] = Math.max(0, item.quantity - item.quantityReceived);
      }
      setQtys(init);
    });
  }, [poId]);

  if (!detail) {
    return (
      <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[110] bg-green-900/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[120] grid place-items-center rounded-4xl bg-white p-12">
            <Spinner size={28} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-green-900/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[120] max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-4xl border border-cream-300 bg-white p-6 shadow-clay focus:outline-none">
          <Dialog.Title className="font-heading text-lg font-bold text-green-900">Receive goods — {detail.poNumber}</Dialog.Title>

          <ul className="mt-4 space-y-3">
            {detail.items.map((item) => {
              const remaining = item.quantity - item.quantityReceived;
              return (
                <li key={item.id} className="rounded-2xl border border-cream-300 bg-cream-50 p-3">
                  <p className="text-sm font-semibold text-green-900">{item.productName} · {item.variantName}</p>
                  <p className="text-xs text-green-700/60">Ordered {item.quantity} · Received {item.quantityReceived} · Remaining {remaining}</p>
                  <Input
                    type="number"
                    min={0}
                    max={remaining}
                    className="mt-2"
                    value={qtys[item.id] ?? 0}
                    onChange={(e) => setQtys((q) => ({ ...q, [item.id]: Number(e.target.value) || 0 }))}
                    aria-label={`Receive quantity for ${item.variantName}`}
                  />
                </li>
              );
            })}
          </ul>

          {error && <p role="alert" className="mt-3 text-sm font-medium text-terra-600">{error}</p>}

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" disabled={pending} onClick={() => {
              setError(null);
              startTransition(async () => {
                const res = await receivePurchaseOrder({
                  purchaseOrderId: poId,
                  lines: Object.entries(qtys).map(([itemId, quantity]) => ({ itemId, quantity })),
                });
                if (!res.ok) setError(res.error);
                else onSaved();
              });
            }}>
              Confirm receive
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PurchaseOrdersPanel({
  rows,
  suppliers,
  warehouses,
  variants,
  onCreate,
  onReceive,
  onSend,
  onCancel,
}: {
  rows: PurchaseOrderListItem[];
  suppliers: { id: string; name: string }[];
  warehouses: { id: string; name: string; code: string }[];
  variants: VariantOption[];
  onCreate: () => void;
  onReceive: (id: string) => void;
  onSend: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  void suppliers;
  void warehouses;
  void variants;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" leftIcon={<Icon name="plus" size={16} />} onClick={onCreate}>New purchase order</Button>
      </div>
      <div className="overflow-x-auto rounded-3xl border border-cream-300 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-cream-200 text-left text-xs font-semibold uppercase tracking-wide text-green-700/60">
              <th className="px-4 py-3">PO #</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Warehouse</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Expected</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-green-700/50">No purchase orders yet.</td></tr>
            ) : (
              rows.map((po) => (
                <tr key={po.id} className="border-b border-cream-100 last:border-0">
                  <td className="px-4 py-3 font-mono font-medium">{po.poNumber}</td>
                  <td className="px-4 py-3">{po.supplierName ?? "—"}</td>
                  <td className="px-4 py-3">{po.warehouseName ?? "—"}</td>
                  <td className="px-4 py-3"><PoStatusBadge status={po.status} /></td>
                  <td className="px-4 py-3">{po.expectedAt ? formatDate(po.expectedAt) : "—"}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(po.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {po.status === "draft" && (
                        <Button variant="ghost" size="sm" onClick={() => onSend(po.id)}>Send</Button>
                      )}
                      {(po.status === "sent" || po.status === "draft") && (
                        <Button variant="secondary" size="sm" onClick={() => onReceive(po.id)}>Receive</Button>
                      )}
                      {po.status !== "received" && po.status !== "cancelled" && (
                        <Button variant="ghost" size="sm" onClick={() => onCancel(po.id)}>Cancel</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
