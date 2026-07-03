"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import DeleteDialog from "@/components/admin/DeleteDialog";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import FormField, { Input, Select, Checkbox } from "@/components/admin/FormField";
import type { RateListItem, ZoneListItem } from "@/lib/admin/shipping-types";
import { createRate, deleteRate, updateRate } from "@/lib/admin/shipping-actions";

export default function RatesClient({ rates, zones }: { rates: RateListItem[]; zones: ZoneListItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<RateListItem | null>(null);
  const [editing, setEditing] = useState<RateListItem | null>(null);
  const [form, setForm] = useState({ zone_id: zones[0]?.id ?? "", name: "", weight_min_grams: 0, weight_max_grams: "", price: 0, free_shipping_threshold: "", cod_charge: 0, is_active: true });

  function resetForm() {
    setForm({ zone_id: zones[0]?.id ?? "", name: "", weight_min_grams: 0, weight_max_grams: "", price: 0, free_shipping_threshold: "", cod_charge: 0, is_active: true });
    setEditing(null);
  }

  function run(action: () => Promise<{ ok: boolean; error: string | null }>) {
    startTransition(async () => {
      const res = await action();
      notifyActionResult(toast, res);
      resetForm();
      router.refresh();
    });
  }

  function payload() {
    return {
      zone_id: form.zone_id,
      name: form.name,
      weight_min_grams: form.weight_min_grams,
      weight_max_grams: form.weight_max_grams ? Number(form.weight_max_grams) : null,
      price: form.price,
      free_shipping_threshold: form.free_shipping_threshold ? Number(form.free_shipping_threshold) : null,
      cod_charge: form.cod_charge,
      is_active: form.is_active,
    };
  }

  const columns: Column<RateListItem>[] = [
    { key: "name", header: "Name", render: (r) => r.name },
    { key: "zone", header: "Zone", render: (r) => r.zoneName },
    { key: "weight", header: "Weight (g)", render: (r) => `${r.weightMinGrams}${r.weightMaxGrams != null ? `–${r.weightMaxGrams}` : "+"}` },
    { key: "price", header: "Price", render: (r) => `₹${r.price}` },
    { key: "free", header: "Free ship ≥", render: (r) => (r.freeShippingThreshold != null ? `₹${r.freeShippingThreshold}` : "—") },
    { key: "cod", header: "COD", render: (r) => `₹${r.codCharge}` },
    { key: "status", header: "Status", render: (r) => <Badge variant={r.isActive ? "success" : "default"} size="sm">{r.isActive ? "Active" : "Inactive"}</Badge> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => { setEditing(r); setForm({ zone_id: r.zoneId, name: r.name, weight_min_grams: r.weightMinGrams, weight_max_grams: r.weightMaxGrams != null ? String(r.weightMaxGrams) : "", price: r.price, free_shipping_threshold: r.freeShippingThreshold != null ? String(r.freeShippingThreshold) : "", cod_charge: r.codCharge, is_active: r.isActive }); }} className="rounded-lg px-2 py-1 text-sm text-green-700 hover:bg-green-50">Edit</button>
          <button type="button" onClick={() => setDeleteTarget(r)} className="rounded-lg px-2 py-1 text-sm text-terra-600 hover:bg-terra-50">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <form className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4" onSubmit={(e) => { e.preventDefault(); if (editing) run(() => updateRate(editing.id, payload())); else run(() => createRate(payload())); }}>
        <h2 className="font-heading text-sm font-bold text-green-900">{editing ? "Edit rate" : "Add rate"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Zone">
            <Select value={form.zone_id} onChange={(e) => setForm({ ...form, zone_id: e.target.value })} aria-label="Zone">
              {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required aria-label="Rate name" /></FormField>
          <FormField label="Min weight (g)"><Input type="number" min={0} value={form.weight_min_grams} onChange={(e) => setForm({ ...form, weight_min_grams: Number(e.target.value) || 0 })} aria-label="Min weight" /></FormField>
          <FormField label="Max weight (g)"><Input type="number" min={0} value={form.weight_max_grams} onChange={(e) => setForm({ ...form, weight_max_grams: e.target.value })} aria-label="Max weight" /></FormField>
          <FormField label="Price"><Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })} aria-label="Price" /></FormField>
          <FormField label="Free shipping threshold"><Input type="number" min={0} value={form.free_shipping_threshold} onChange={(e) => setForm({ ...form, free_shipping_threshold: e.target.value })} aria-label="Free shipping threshold" /></FormField>
          <FormField label="COD charge"><Input type="number" min={0} value={form.cod_charge} onChange={(e) => setForm({ ...form, cod_charge: Number(e.target.value) || 0 })} aria-label="COD charge" /></FormField>
          <Checkbox checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} label="Active" />
        </div>
        <div className="flex gap-2"><Button type="submit" disabled={pending}>{editing ? "Save" : "Create"}</Button>{editing && <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>}</div>
      </form>
      <DataTable columns={columns} rows={rates} getRowId={(r) => r.id} empty="No rates defined." />
      <DeleteDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} itemName={deleteTarget?.name} loading={pending} onConfirm={() => { if (deleteTarget) run(() => deleteRate(deleteTarget.id)); setDeleteTarget(null); }} />
    </div>
  );
}
