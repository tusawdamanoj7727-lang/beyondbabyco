"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import PaymentStatusBadge from "@/components/admin/PaymentStatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import FormField, { Input, Textarea } from "@/components/admin/FormField";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import Card from "@/components/ui/Card";
import { Spinner } from "@/components/admin/LoadingState";
import type { AuditLogRow } from "@/lib/admin/payments";
import {
  formatMoney,
  displayPaymentStatus,
  type PaymentDetail,
} from "@/lib/admin/payment-types";
import {
  manualCapturePayment,
  manualRefundPayment,
  markWebhookProcessed,
  replayPaymentWebhook,
} from "@/lib/admin/payment-actions";
import { cn } from "@/lib/utils";

type Tab = "overview" | "transactions" | "refunds" | "webhooks" | "settlement" | "logs" | "audit";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "transactions", label: "Transactions" },
  { id: "refunds", label: "Refunds" },
  { id: "webhooks", label: "Webhooks" },
  { id: "settlement", label: "Settlement" },
  { id: "logs", label: "Logs" },
  { id: "audit", label: "Audit" },
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function PaymentDetailClient(props: { payment: PaymentDetail; audit: AuditLogRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState(String(props.payment.amount));
  const [refundReason, setRefundReason] = useState("");
  const [pending, startTransition] = useTransition();
  const p = props.payment;

  function run(action: () => Promise<{ ok: boolean; error: string | null }>) {
    startTransition(async () => {
      const res = await action();
      notifyActionResult(toast, res);
      router.refresh();
    });
  }

  const canCapture = p.status === "authorized" || p.status === "pending";
  const canRefund = ["paid", "captured", "partially_refunded"].includes(p.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-cream-200 bg-cream-50 p-4">
        <span className="font-heading text-lg font-bold text-green-900">{p.paymentRef ?? p.id.slice(0, 8)}</span>
        <PaymentStatusBadge status={p.status} size="md" />
        <span className="text-sm font-medium text-green-900">{formatMoney(p.amount, p.currency)}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          {canCapture && (
            <Button size="sm" disabled={pending} onClick={() => setCaptureOpen(true)}>Manual Capture</Button>
          )}
          {canRefund && (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setRefundOpen(true)}>Manual Refund</Button>
          )}
        </div>
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-cream-200 pb-1" aria-label="Payment detail tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-t-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50",
              tab === t.id ? "bg-white text-green-900 shadow-sm" : "text-green-700/70 hover:text-green-900",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Panel title="Payment summary">
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                <div><dt className="text-green-700/60">Status</dt><dd className="font-medium">{displayPaymentStatus(p.status)}</dd></div>
                <div><dt className="text-green-700/60">Method</dt><dd className="font-medium capitalize">{p.method ?? "—"}</dd></div>
                <div><dt className="text-green-700/60">Gateway</dt><dd className="font-medium">{p.gatewayName ?? p.provider ?? "—"}</dd></div>
                <div><dt className="text-green-700/60">Transaction ID</dt><dd className="font-medium font-mono text-xs">{p.gatewayTxnId ?? "—"}</dd></div>
                <div><dt className="text-green-700/60">Fees</dt><dd className="font-medium">{formatMoney(p.fees, p.currency)}</dd></div>
                <div><dt className="text-green-700/60">Tax</dt><dd className="font-medium">{formatMoney(p.tax, p.currency)}</dd></div>
                <div><dt className="text-green-700/60">Created</dt><dd className="font-medium">{formatDateTime(p.createdAt)}</dd></div>
                {p.capturedAt && <div><dt className="text-green-700/60">Captured</dt><dd className="font-medium">{formatDateTime(p.capturedAt)}</dd></div>}
                {p.failedReason && <div className="sm:col-span-2"><dt className="text-green-700/60">Failure reason</dt><dd className="font-medium text-terra-700">{p.failedReason}</dd></div>}
              </dl>
            </Panel>

            {p.reconciliation.length > 0 && (
              <Panel title="Reconciliation">
                <ul className="space-y-2 text-sm">
                  {p.reconciliation.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-cream-200 p-3">
                      <Badge variant={r.status === "matched" ? "success" : "warning"} size="sm">{r.status}</Badge>
                      <span>Expected {formatMoney(r.expectedAmount)} · Actual {formatMoney(r.actualAmount)}</span>
                      {r.notes && <span className="text-green-700/60">· {r.notes}</span>}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>

          <aside className="space-y-4">
            <Panel title="Customer">
              {p.customerId ? (
                <Link href={`/admin/customers/${p.customerId}`} className="font-semibold text-green-800 hover:underline">{p.customerName}</Link>
              ) : (
                <p className="font-semibold">{p.customerName}</p>
              )}
              {p.customerEmail && <p className="text-xs text-green-700/60">{p.customerEmail}</p>}
            </Panel>
            <Panel title="Order">
              <Link href={`/admin/orders/${p.orderId}`} className="font-semibold text-green-800 hover:underline">{p.orderNumber}</Link>
            </Panel>
            {p.gatewayId && (
              <Panel title="Gateway">
                <Link href={`/admin/payment-gateways/${p.gatewayId}`} className="font-semibold text-green-800 hover:underline">{p.gatewayName}</Link>
              </Panel>
            )}
          </aside>
        </div>
      )}

      {tab === "transactions" && (
        <Card padding="md" radius="3xl" variant="outline">
          {p.transactions.length === 0 ? (
            <p className="text-sm text-green-700/60">No transactions recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-200 text-left text-green-700/60">
                    <th className="pb-2 pr-4 font-medium">Gateway Txn ID</th>
                    <th className="pb-2 pr-4 font-medium">Reference</th>
                    <th className="pb-2 pr-4 font-medium">Amount</th>
                    <th className="pb-2 pr-4 font-medium">Fees</th>
                    <th className="pb-2 pr-4 font-medium">Tax</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {p.transactions.map((t) => (
                    <tr key={t.id} className="border-b border-cream-100">
                      <td className="py-2 pr-4 font-mono text-xs">{t.gatewayTxnId ?? "—"}</td>
                      <td className="py-2 pr-4">{t.reference ?? t.txnRef ?? "—"}</td>
                      <td className="py-2 pr-4">{formatMoney(t.amount, p.currency)}</td>
                      <td className="py-2 pr-4">{formatMoney(t.fees, p.currency)}</td>
                      <td className="py-2 pr-4">{formatMoney(t.tax, p.currency)}</td>
                      <td className="py-2 pr-4"><PaymentStatusBadge status={t.status} /></td>
                      <td className="py-2">{formatDateTime(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "refunds" && (
        <Card padding="md" radius="3xl" variant="outline">
          {p.refunds.length === 0 ? (
            <p className="text-sm text-green-700/60">No refunds for this payment.</p>
          ) : (
            <ul className="space-y-3">
              {p.refunds.map((r) => (
                <li key={r.id} className="rounded-2xl border border-cream-200 p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <PaymentStatusBadge status={r.status} />
                    <span className="font-semibold">{formatMoney(r.amount, p.currency)}</span>
                    <span className="text-green-700/60">{formatDateTime(r.createdAt)}</span>
                  </div>
                  {r.reason && <p className="mt-1 text-green-700/70">Reason: {r.reason}</p>}
                  {r.notes && <p className="mt-1 text-green-700/60">{r.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "webhooks" && (
        <Card padding="md" radius="3xl" variant="outline">
          {p.webhooks.length === 0 ? (
            <p className="text-sm text-green-700/60">No webhooks linked to this payment.</p>
          ) : (
            <ul className="space-y-3">
              {p.webhooks.map((w) => (
                <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cream-200 p-4 text-sm">
                  <div>
                    <p className="font-medium">{w.eventType}</p>
                    <p className="text-xs text-green-700/60">{formatDateTime(w.createdAt)}</p>
                    {w.error && <p className="text-xs text-terra-600">{w.error}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={w.processed ? "success" : "warning"} size="sm">{w.processed ? "Processed" : "Pending"}</Badge>
                    {!w.processed && (
                      <button type="button" disabled={pending} onClick={() => run(() => markWebhookProcessed(w.id))} className="text-xs text-green-700 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50 rounded px-1">Mark processed</button>
                    )}
                    <button type="button" disabled={pending} onClick={() => run(() => replayPaymentWebhook(w.id))} className="text-xs text-green-700 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50 rounded px-1">Replay</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "settlement" && (
        <Card padding="md" radius="3xl" variant="outline">
          {p.settlements.length === 0 ? (
            <p className="text-sm text-green-700/60">No settlement records for this gateway.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-200 text-left text-green-700/60">
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 pr-4 font-medium">Expected</th>
                    <th className="pb-2 pr-4 font-medium">Received</th>
                    <th className="pb-2 pr-4 font-medium">Difference</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 font-medium">Bank Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {p.settlements.map((s) => (
                    <tr key={s.id} className="border-b border-cream-100">
                      <td className="py-2 pr-4">{s.settlementDate}</td>
                      <td className="py-2 pr-4">{formatMoney(s.expectedAmount, p.currency)}</td>
                      <td className="py-2 pr-4">{formatMoney(s.receivedAmount, p.currency)}</td>
                      <td className={cn("py-2 pr-4 font-medium", s.difference !== 0 && "text-terra-700")}>{formatMoney(s.difference, p.currency)}</td>
                      <td className="py-2 pr-4"><Badge variant={s.status === "matched" ? "success" : s.status === "mismatch" ? "warning" : "default"} size="sm">{s.status}</Badge></td>
                      <td className="py-2">{s.bankReference ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "logs" && (
        <Card padding="md" radius="3xl" variant="outline">
          {p.logs.length === 0 ? (
            <p className="text-sm text-green-700/60">No logs for this payment.</p>
          ) : (
            <ul className="space-y-2 font-mono text-xs">
              {p.logs.map((l) => (
                <li key={l.id} className="rounded-xl bg-cream-50 p-3">
                  <span className={cn("uppercase", l.level === "error" && "text-terra-600", l.level === "warn" && "text-amber-700")}>[{l.level}]</span>{" "}
                  {l.message}
                  <span className="ml-2 text-green-700/50">{formatDateTime(l.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "audit" && (
        <Card padding="md" radius="3xl" variant="outline">
          {props.audit.length === 0 ? (
            <p className="text-sm text-green-700/60">No audit entries.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {props.audit.map((a) => (
                <li key={a.id} className="flex flex-wrap gap-2 border-b border-cream-100 py-2">
                  <Badge variant="info" size="sm">{a.action}</Badge>
                  <span className="text-green-700/60">{a.tableName}</span>
                  <span className="ml-auto text-green-700/50">{formatDateTime(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" aria-live="polite">
          <Spinner />
        </div>
      )}

      <ConfirmDialog
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        title="Manual capture"
        description="Capture authorized payment via gateway adapter. Requires live gateway credentials."
        confirmLabel="Capture"
        loading={pending}
        onConfirm={() => { run(() => manualCapturePayment(p.id)); setCaptureOpen(false); }}
      />

      <ConfirmDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        title="Manual refund"
        description={
          <div className="space-y-3 text-left">
            <FormField label="Amount">
              <Input type="number" min={0.01} step={0.01} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} aria-label="Refund amount" />
            </FormField>
            <FormField label="Reason">
              <Textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} rows={2} aria-label="Refund reason" />
            </FormField>
          </div>
        }
        confirmLabel="Refund"
        tone="danger"
        loading={pending}
        onConfirm={() => {
          run(() => manualRefundPayment({ payment_id: p.id, amount: Number(refundAmount), reason: refundReason, full: Number(refundAmount) >= p.amount }));
          setRefundOpen(false);
        }}
      />
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card padding="md" radius="3xl" variant="outline">
      <h3 className="font-heading text-sm font-bold text-green-900">{title}</h3>
      <div className="mt-3">{children}</div>
    </Card>
  );
}
