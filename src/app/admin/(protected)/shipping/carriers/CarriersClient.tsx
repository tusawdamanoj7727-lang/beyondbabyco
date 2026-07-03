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
import {
  CARRIER_PROVIDERS,
  CARRIER_PROVIDER_LABELS,
  type CarrierListItem,
  type CarrierProvider,
} from "@/lib/admin/shipping-types";
import { bulkDeleteCarriers, createCarrier, deleteCarrier, updateCarrier } from "@/lib/admin/shipping-actions";

export default function CarriersClient({ carriers }: { carriers: CarrierListItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<CarrierListItem | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<CarrierListItem | null>(null);
  const [form, setForm] = useState({ name: "", provider: "delhivery" as CarrierProvider, api_key: "", api_secret: "", sandbox: true, is_active: true });

  function resetForm() {
    setForm({ name: "", provider: "delhivery", api_key: "", api_secret: "", sandbox: true, is_active: true });
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

  const columns: Column<CarrierListItem>[] = [
    { key: "name", header: "Name", render: (c) => c.name },
    { key: "provider", header: "Provider", render: (c) => CARRIER_PROVIDER_LABELS[c.provider] },
    { key: "mode", header: "Mode", render: (c) => <Badge variant={c.sandbox ? "warning" : "success"} size="sm">{c.sandbox ? "Sandbox" : "Production"}</Badge> },
    { key: "status", header: "Status", render: (c) => <Badge variant={c.isActive ? "success" : "default"} size="sm">{c.isActive ? "Active" : "Inactive"}</Badge> },
    {
      key: "actions",
      header: "",
      render: (c) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => { setEditing(c); setForm({ name: c.name, provider: c.provider, api_key: "", api_secret: "", sandbox: c.sandbox, is_active: c.isActive }); }} className="rounded-lg px-2 py-1 text-sm text-green-700 hover:bg-green-50">Edit</button>
          <button type="button" onClick={() => setDeleteTarget(c)} className="rounded-lg px-2 py-1 text-sm text-terra-600 hover:bg-terra-50">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <form
        className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (editing) run(() => updateCarrier(editing.id, form));
          else run(() => createCarrier(form));
        }}
      >
        <h2 className="font-heading text-sm font-bold text-green-900">{editing ? "Edit carrier" : "Add carrier"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required aria-label="Carrier name" /></FormField>
          <FormField label="Provider">
            <Select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value as CarrierProvider })} aria-label="Provider">
              {CARRIER_PROVIDERS.filter((p) => p !== "custom").map((p) => <option key={p} value={p}>{CARRIER_PROVIDER_LABELS[p]}</option>)}
            </Select>
          </FormField>
          <FormField label="API Key"><Input value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} type="password" autoComplete="off" aria-label="API key" placeholder={editing ? "Leave blank to keep" : ""} /></FormField>
          <FormField label="API Secret"><Input value={form.api_secret} onChange={(e) => setForm({ ...form, api_secret: e.target.value })} type="password" autoComplete="off" aria-label="API secret" placeholder={editing ? "Leave blank to keep" : ""} /></FormField>
          <Checkbox checked={form.sandbox} onChange={(e) => setForm({ ...form, sandbox: e.target.checked })} label="Sandbox mode" />
          <Checkbox checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} label="Active" />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>{editing ? "Save" : "Create"}</Button>
          {editing && <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>}
        </div>
      </form>

      {selectedIds.length > 0 && (
        <div className="flex gap-2 rounded-3xl border border-green-200 bg-green-50 px-4 py-3" role="region" aria-label="Bulk carrier actions">
          <span className="text-sm font-semibold text-green-800">{selectedIds.length} selected</span>
          <button type="button" onClick={() => setBulkDeleteOpen(true)} className="text-sm text-terra-600 hover:underline">Delete</button>
          <button type="button" onClick={() => setSelectedIds([])} className="ml-auto text-sm text-green-700/60">Clear</button>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={carriers}
        getRowId={(c) => c.id}
        selectable
        selectedIds={selectedIds}
        onToggleRow={(id) => setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
        onToggleAll={(checked) => setSelectedIds(checked ? carriers.map((c) => c.id) : [])}
        empty="No carriers configured."
      />

      <DeleteDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} itemName={deleteTarget?.name} loading={pending} onConfirm={() => { if (deleteTarget) run(() => deleteCarrier(deleteTarget.id)); setDeleteTarget(null); }} />
      <DeleteDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedIds.length} loading={pending} onConfirm={() => { run(async () => { await bulkDeleteCarriers(selectedIds); setSelectedIds([]); setBulkDeleteOpen(false); return { ok: true, error: null }; }); }} />
    </div>
  );
}
