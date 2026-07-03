"use client";

import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import DeleteDialog from "@/components/admin/DeleteDialog";
import Badge from "@/components/ui/Badge";
import {
  GATEWAY_PROVIDER_LABELS,
  type GatewayListItem,
} from "@/lib/admin/payment-types";
import {
  bulkDeletePaymentGateways,
  deletePaymentGateway,
  disablePaymentGateway,
  enablePaymentGateway,
} from "@/lib/admin/payment-actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function PaymentGatewaysClient({ gateways }: { gateways: GatewayListItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GatewayListItem | null>(null);

  function run(action: () => Promise<{ ok: boolean; error: string | null }>) {
    startTransition(async () => {
      const res = await action();
      notifyActionResult(toast, res);
      router.refresh();
    });
  }

  const columns: Column<GatewayListItem>[] = [
    {
      key: "name",
      header: "Display Name",
      render: (g) => (
        <Link href={`/admin/payment-gateways/${g.id}`} className="font-semibold text-green-800 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50 rounded">
          {g.displayName}
        </Link>
      ),
    },
    { key: "provider", header: "Provider", render: (g) => GATEWAY_PROVIDER_LABELS[g.provider] },
    {
      key: "mode",
      header: "Mode",
      render: (g) => <Badge variant={g.sandbox ? "warning" : "success"} size="sm">{g.sandbox ? "Sandbox" : "Production"}</Badge>,
    },
    { key: "currency", header: "Currency", render: (g) => g.currency },
    { key: "priority", header: "Priority", render: (g) => g.priority },
    {
      key: "status",
      header: "Status",
      render: (g) => (
        <Badge variant={g.isEnabled ? "success" : "default"} size="sm">
          {g.lifecycleStatus === "archived" ? "Archived" : g.isEnabled ? "Enabled" : "Disabled"}
        </Badge>
      ),
    },
    { key: "updated", header: "Updated", render: (g) => formatDate(g.updatedAt) },
    {
      key: "actions",
      header: "",
      render: (g) => (
        <div className="flex flex-wrap gap-1">
          <Link href={`/admin/payment-gateways/${g.id}`} className="rounded-lg px-2 py-1 text-sm text-green-700 hover:bg-green-50">Edit</Link>
          {g.isEnabled ? (
            <button type="button" onClick={() => run(() => disablePaymentGateway(g.id))} className="rounded-lg px-2 py-1 text-sm text-green-700/70 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">Disable</button>
          ) : (
            <button type="button" onClick={() => run(() => enablePaymentGateway(g.id))} className="rounded-lg px-2 py-1 text-sm text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">Enable</button>
          )}
          <button type="button" onClick={() => setDeleteTarget(g)} className="rounded-lg px-2 py-1 text-sm text-terra-600 hover:bg-terra-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {selectedIds.length > 0 && (
        <div className="flex gap-2 rounded-3xl border border-green-200 bg-green-50 px-4 py-3" role="region" aria-label="Bulk gateway actions">
          <span className="text-sm font-semibold text-green-800">{selectedIds.length} selected</span>
          <button type="button" onClick={() => setBulkDeleteOpen(true)} className="text-sm text-terra-600 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50 rounded px-1">Delete</button>
          <button type="button" onClick={() => setSelectedIds([])} className="ml-auto text-sm text-green-700/60">Clear</button>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={gateways}
        getRowId={(g) => g.id}
        selectable
        selectedIds={selectedIds}
        onToggleRow={(id) => setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
        onToggleAll={(checked) => setSelectedIds(checked ? gateways.map((g) => g.id) : [])}
        empty="No payment gateways configured."
      />

      <DeleteDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} itemName={deleteTarget?.displayName} loading={pending} onConfirm={() => { if (deleteTarget) run(() => deletePaymentGateway(deleteTarget.id)); setDeleteTarget(null); }} />
      <DeleteDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedIds.length} loading={pending} onConfirm={() => { run(async () => { await bulkDeletePaymentGateways(selectedIds); setSelectedIds([]); setBulkDeleteOpen(false); return { ok: true, error: null }; }); }} />
    </div>
  );
}
