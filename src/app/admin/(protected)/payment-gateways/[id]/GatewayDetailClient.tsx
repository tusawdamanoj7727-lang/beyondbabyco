"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import ConfirmDialog from "@/components/admin/ConfirmDialog";
import DeleteDialog from "@/components/admin/DeleteDialog";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import Card from "@/components/ui/Card";
import { fieldControlClasses } from "@/components/admin/FormField";
import { GATEWAY_PROVIDER_LABELS, formatMoney, type GatewayDetail } from "@/lib/admin/payment-types";
import type { SettlementSummary } from "@/lib/admin/payment-types";
import {
  archivePaymentGateway,
  deletePaymentGateway,
  disablePaymentGateway,
  enablePaymentGateway,
  syncSettlement,
} from "@/lib/admin/payment-actions";
import GatewayForm from "../GatewayForm";

export default function GatewayDetailClient(props: {
  gateway: GatewayDetail;
  settlement: SettlementSummary;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().slice(0, 10));
  const g = props.gateway;

  function run(action: () => Promise<{ ok: boolean; error: string | null }>) {
    startTransition(async () => {
      const res = await action();
      notifyActionResult(toast, res);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-cream-200 bg-cream-50 p-4">
        <span className="font-heading text-lg font-bold text-green-900">{g.displayName}</span>
        <Badge variant="info" size="sm">{GATEWAY_PROVIDER_LABELS[g.provider]}</Badge>
        <Badge variant={g.sandbox ? "warning" : "success"} size="sm">{g.sandbox ? "Sandbox" : "Production"}</Badge>
        <Badge variant={g.isEnabled ? "success" : "default"} size="sm">{g.isEnabled ? "Enabled" : "Disabled"}</Badge>
        <div className="ml-auto flex flex-wrap gap-2">
          {g.isEnabled ? (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => disablePaymentGateway(g.id))}>Disable</Button>
          ) : (
            <Button size="sm" disabled={pending} onClick={() => run(() => enablePaymentGateway(g.id))}>Enable</Button>
          )}
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setArchiveOpen(true)}>Archive</Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setDeleteOpen(true)}>Delete</Button>
        </div>
      </div>

      <GatewayForm mode="edit" initial={g} />

      <Card padding="md" radius="3xl" variant="outline">
        <h2 className="font-heading text-sm font-bold text-green-900">Settlement sync</h2>
        <p className="mt-1 text-sm text-green-700/60">Sync daily settlement from gateway adapter (placeholder until API connected).</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-green-700/60">Settlement date</span>
            <input type="date" value={settlementDate} onChange={(e) => setSettlementDate(e.target.value)} className={fieldControlClasses} aria-label="Settlement date" />
          </label>
          <Button size="sm" disabled={pending} onClick={() => run(() => syncSettlement({ gateway_id: g.id, settlement_date: settlementDate }))}>
            Sync Settlement
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4 text-sm">
          <div><p className="text-green-700/60">Total expected</p><p className="font-semibold">{formatMoney(props.settlement.totalExpected)}</p></div>
          <div><p className="text-green-700/60">Total received</p><p className="font-semibold">{formatMoney(props.settlement.totalReceived)}</p></div>
          <div><p className="text-green-700/60">Difference</p><p className="font-semibold">{formatMoney(props.settlement.totalDifference)}</p></div>
          <div><p className="text-green-700/60">Mismatches</p><p className="font-semibold">{props.settlement.mismatchCount}</p></div>
        </div>

        {props.settlement.recent.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-200 text-left text-green-700/60">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Expected</th>
                  <th className="pb-2 pr-4 font-medium">Received</th>
                  <th className="pb-2 pr-4 font-medium">Diff</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {props.settlement.recent.map((s) => (
                  <tr key={s.id} className="border-b border-cream-100">
                    <td className="py-2 pr-4">{s.settlementDate}</td>
                    <td className="py-2 pr-4">{formatMoney(s.expectedAmount)}</td>
                    <td className="py-2 pr-4">{formatMoney(s.receivedAmount)}</td>
                    <td className="py-2 pr-4">{formatMoney(s.difference)}</td>
                    <td className="py-2"><Badge variant={s.status === "matched" ? "success" : s.status === "mismatch" ? "warning" : "default"} size="sm">{s.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog open={archiveOpen} onOpenChange={setArchiveOpen} title="Archive this gateway?" confirmLabel="Archive" loading={pending} onConfirm={() => { run(() => archivePaymentGateway(g.id)); setArchiveOpen(false); }} />
      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} itemName={g.displayName} loading={pending} onConfirm={() => { run(() => deletePaymentGateway(g.id)); setDeleteOpen(false); router.push("/admin/payment-gateways"); }} />
    </div>
  );
}
