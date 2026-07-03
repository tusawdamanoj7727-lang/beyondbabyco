"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import DeleteDialog from "@/components/admin/DeleteDialog";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import FormField, { Input, Checkbox } from "@/components/admin/FormField";
import type { ZoneListItem } from "@/lib/admin/shipping-types";
import { createZone, deleteZone, updateZone } from "@/lib/admin/shipping-actions";

export default function ZonesClient({ zones }: { zones: ZoneListItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<ZoneListItem | null>(null);
  const [editing, setEditing] = useState<ZoneListItem | null>(null);
  const [form, setForm] = useState({ name: "", country: "India", state: "", city: "", postal_from: "", postal_to: "", priority: 0, is_active: true });

  function resetForm() {
    setForm({ name: "", country: "India", state: "", city: "", postal_from: "", postal_to: "", priority: 0, is_active: true });
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

  const columns: Column<ZoneListItem>[] = [
    { key: "name", header: "Name", render: (z) => z.name },
    { key: "country", header: "Country", render: (z) => z.country },
    { key: "state", header: "State", render: (z) => z.state ?? "—" },
    { key: "city", header: "City", render: (z) => z.city ?? "—" },
    { key: "postal", header: "Postal Range", render: (z) => (z.postalFrom || z.postalTo ? `${z.postalFrom ?? "*"} – ${z.postalTo ?? "*"}` : "—") },
    { key: "priority", header: "Priority", align: "right", render: (z) => z.priority },
    { key: "status", header: "Status", render: (z) => <Badge variant={z.isActive ? "success" : "default"} size="sm">{z.isActive ? "Active" : "Inactive"}</Badge> },
    {
      key: "actions",
      header: "",
      render: (z) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => { setEditing(z); setForm({ name: z.name, country: z.country, state: z.state ?? "", city: z.city ?? "", postal_from: z.postalFrom ?? "", postal_to: z.postalTo ?? "", priority: z.priority, is_active: z.isActive }); }} className="rounded-lg px-2 py-1 text-sm text-green-700 hover:bg-green-50">Edit</button>
          <button type="button" onClick={() => setDeleteTarget(z)} className="rounded-lg px-2 py-1 text-sm text-terra-600 hover:bg-terra-50">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <form className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4" onSubmit={(e) => { e.preventDefault(); if (editing) run(() => updateZone(editing.id, form)); else run(() => createZone(form)); }}>
        <h2 className="font-heading text-sm font-bold text-green-900">{editing ? "Edit zone" : "Add zone"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required aria-label="Zone name" /></FormField>
          <FormField label="Country"><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} aria-label="Country" /></FormField>
          <FormField label="State"><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} aria-label="State" /></FormField>
          <FormField label="City"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} aria-label="City" /></FormField>
          <FormField label="Postal from"><Input value={form.postal_from} onChange={(e) => setForm({ ...form, postal_from: e.target.value })} aria-label="Postal from" /></FormField>
          <FormField label="Postal to"><Input value={form.postal_to} onChange={(e) => setForm({ ...form, postal_to: e.target.value })} aria-label="Postal to" /></FormField>
          <FormField label="Priority"><Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) || 0 })} aria-label="Priority" /></FormField>
          <Checkbox checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} label="Active" />
        </div>
        <div className="flex gap-2"><Button type="submit" disabled={pending}>{editing ? "Save" : "Create"}</Button>{editing && <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>}</div>
      </form>
      <DataTable columns={columns} rows={zones} getRowId={(z) => z.id} empty="No zones defined." />
      <DeleteDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} itemName={deleteTarget?.name} loading={pending} onConfirm={() => { if (deleteTarget) run(() => deleteZone(deleteTarget.id)); setDeleteTarget(null); }} />
    </div>
  );
}
