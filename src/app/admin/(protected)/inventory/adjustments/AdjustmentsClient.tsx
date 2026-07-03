"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import FormField, { Input, Select, Textarea, fieldControlClasses } from "@/components/admin/FormField";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/admin/LoadingState";
import {
  ADJUSTMENT_REASONS,
  MOVEMENT_TYPE_LABELS,
  type MovementType,
  type StockMovementItem,
} from "@/lib/admin/inventory-types";
import { adjustStock, initInventoryRecord, previewAdjustment } from "@/lib/admin/inventory-actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdjustmentsClient(props: {
  movements: StockMovementItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  filters: { search: string; type: MovementType | "all" };
  warehouses: { id: string; name: string }[];
  variants: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState(props.filters.search);
  const [variantId, setVariantId] = useState(props.variants[0]?.id ?? "");
  const [warehouseId, setWarehouseId] = useState(props.warehouses[0]?.id ?? "");
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<string>(ADJUSTMENT_REASONS[0]);
  const [note, setNote] = useState("");
  const [inventoryId, setInventoryId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ currentQuantity: number; nextQuantity: number; valid: boolean } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== props.filters.search) push({ q: search });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (!variantId || !warehouseId) return;
    startTransition(async () => {
      const res = await initInventoryRecord(variantId, warehouseId);
      if (res.ok && res.id) setInventoryId(res.id);
    });
  }, [variantId, warehouseId]);

  useEffect(() => {
    if (!inventoryId) return;
    previewAdjustment(inventoryId, direction, quantity).then((p) => {
      if (p) setPreview({ currentQuantity: p.currentQuantity, nextQuantity: p.nextQuantity, valid: p.valid });
    });
  }, [inventoryId, direction, quantity]);

  function push(patch: Record<string, string | null>, resetPage = true) {
    const sp = new URLSearchParams();
    const base = { q: props.filters.search, type: props.filters.type, page: String(props.page) };
    const merged = { ...base, ...patch };
    if (resetPage && !("page" in patch)) merged.page = "1";
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") sp.set(k, v);
    }
    router.push(`/admin/inventory/adjustments?${sp.toString()}`);
  }

  const columns: Column<StockMovementItem>[] = [
    { key: "when", header: "Timestamp", render: (m) => formatDate(m.createdAt) },
    { key: "type", header: "Type", render: (m) => MOVEMENT_TYPE_LABELS[m.type] ?? m.type },
    { key: "product", header: "Product", render: (m) => m.productName },
    { key: "variant", header: "Variant", render: (m) => m.variantName },
    { key: "warehouse", header: "Warehouse", render: (m) => m.warehouseName },
    { key: "qty", header: "Qty", align: "right", render: (m) => (m.type === "adjustment" && m.quantity < 0 ? m.quantity : m.quantity) },
    { key: "reason", header: "Reason", render: (m) => m.reason ?? m.note ?? "—" },
    { key: "user", header: "User", render: (m) => m.userName ?? "—" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <section className="rounded-4xl border border-cream-300 bg-white p-5 shadow-card lg:sticky lg:top-6 lg:self-start">
        <h2 className="font-heading text-lg font-bold text-green-900">Manual adjustment</h2>
        <p className="mt-1 text-sm text-green-700/60">Preview the new quantity before saving.</p>

        <div className="mt-5 space-y-4">
          <FormField label="Variant">
            <Select value={variantId} onChange={(e) => setVariantId(e.target.value)}>
              {props.variants.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Warehouse">
            <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              {props.warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
          </FormField>
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
            <div className="rounded-2xl border border-cream-300 bg-cream-50 p-3 text-sm" aria-live="polite">
              <p>Current: <strong>{preview.currentQuantity}</strong></p>
              <p className="mt-1">After: <strong className={preview.valid ? "text-green-700" : "text-terra-600"}>{preview.nextQuantity}</strong></p>
            </div>
          )}

          {formError && <p role="alert" className="text-sm font-medium text-terra-600">{formError}</p>}

          <Button
            fullWidth
            disabled={pending || !inventoryId || !preview?.valid}
            leftIcon={pending ? <Spinner size={16} className="border-white/50 border-t-white" /> : undefined}
            onClick={() => {
              if (!inventoryId) return;
              setFormError(null);
              startTransition(async () => {
                const res = await adjustStock({ inventoryId, direction, quantity, reason, note: note || null });
                if (!res.ok) setFormError(res.error);
                else router.refresh();
              });
            }}
          >
            Save adjustment
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search movements…" aria-label="Search movements" className={fieldControlClasses + " flex-1"} />
          <Select aria-label="Movement type" value={props.filters.type} onChange={(e) => push({ type: e.target.value })} className="sm:w-44">
            <option value="all">All types</option>
            {Object.entries(MOVEMENT_TYPE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </Select>
        </div>

        <DataTable columns={columns} rows={props.movements} getRowId={(m) => m.id} />
        <Pagination page={props.page} pageCount={props.pageCount} total={props.total} perPage={props.perPage} onPageChange={(p) => push({ page: String(p) }, false)} />
      </section>
    </div>
  );
}
