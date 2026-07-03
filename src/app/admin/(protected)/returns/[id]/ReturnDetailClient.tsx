"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import ReturnStatusBadge, { RefundStatusBadge } from "@/components/admin/ReturnStatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import FormField, { Input, Select, Textarea } from "@/components/admin/FormField";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import { Spinner } from "@/components/admin/LoadingState";
import {
  DAMAGE_LEVELS,
  REFUND_TYPES,
  RESTOCK_DECISIONS,
  RESTOCK_LABELS,
  RETURN_REASON_LABELS,
  RETURN_STATUS_LABELS,
  type ReturnDetail,
  type ReturnItemRow,
  type ReturnStatus,
  type ReturnTimelineEvent,
} from "@/lib/admin/return-types";
import {
  approveReturn,
  closeReturn,
  processRefund,
  rejectReturn,
  saveInspection,
  updateReturnNotes,
  updateReturnStatus,
} from "@/lib/admin/return-actions";
import { cn } from "@/lib/utils";

type Tab = "overview" | "items" | "timeline" | "inspection" | "refund" | "documents";

const TIMELINE_STEPS = ["requested", "approved", "pickup_scheduled", "received", "inspection", "refund_approved", "refunded", "closed"] as const;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

export default function ReturnDetailClient(props: { ret: ReturnDetail; timeline: ReturnTimelineEvent[] }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [notes, setNotes] = useState(props.ret.internalNotes ?? "");
  const [rejectReason, setRejectReason] = useState("");
  const [confirmAction, setConfirmAction] = useState<"reject" | "close" | null>(null);
  const [inspectingItem, setInspectingItem] = useState<ReturnItemRow | null>(null);
  const [refundType, setRefundType] = useState<string>("full");
  const [refundAmount, setRefundAmount] = useState(String(props.ret.refundAmount || props.ret.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)));
  const [refundNotes, setRefundNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const r = props.ret;

  function run(action: () => Promise<{ ok: boolean; error: string | null }>) {
    startTransition(async () => {
      const res = await action();
      notifyActionResult(toast, res);
      router.refresh();
    });
  }

  function setStatus(status: ReturnStatus) {
    run(() => updateReturnStatus(r.id, status));
  }

  const itemTotal = r.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-cream-200 bg-cream-50 p-4">
        <span className="font-heading text-lg font-bold text-green-900">{r.rmaNumber}</span>
        <ReturnStatusBadge status={r.status} size="md" />
        <RefundStatusBadge status={r.refundStatus} size="sm" />
        <Badge variant="default" size="sm">{RETURN_REASON_LABELS[r.reason]}</Badge>
        {r.restockCompleted && <Badge variant="success" size="sm">Restocked</Badge>}
        <div className="ml-auto flex flex-wrap gap-2">
          {r.status === "requested" && <Button size="sm" disabled={pending} onClick={() => run(() => approveReturn(r.id))}>Approve</Button>}
          {r.status === "requested" && (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirmAction("reject")}>Reject</Button>
          )}
          {r.status === "approved" && <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus("pickup_scheduled")}>Schedule Pickup</Button>}
          {["approved", "pickup_scheduled"].includes(r.status) && (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus("received")}>Mark Received</Button>
          )}
          {r.status === "received" && <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus("inspection")}>Start Inspection</Button>}
          {r.status === "inspection" && (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus("refund_approved")}>Approve Refund</Button>
          )}
          {r.status !== "closed" && r.status !== "rejected" && (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirmAction("close")}>Close</Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="space-y-4">
          <Panel title="Customer">
            {r.customerId ? (
              <Link href={`/admin/customers/${r.customerId}`} className="font-semibold text-green-800 hover:underline">{r.customerName}</Link>
            ) : (
              <p className="font-semibold text-green-900">{r.customerName}</p>
            )}
            {r.customerEmail && <p className="text-xs text-green-700/60">{r.customerEmail}</p>}
          </Panel>

          <Panel title="Order">
            <Link href={`/admin/orders/${r.orderId}`} className="font-semibold text-green-800 hover:underline">{r.orderNumber}</Link>
          </Panel>

          {r.payment && (
            <Panel title="Payment">
              <p className="text-sm capitalize">{r.payment.status}</p>
              <p className="text-sm font-medium text-green-900">{formatMoney(r.payment.amount)}</p>
            </Panel>
          )}

          {r.shipment && (
            <Panel title="Shipment">
              <p className="text-sm capitalize">{r.shipment.status}</p>
              {r.shipment.trackingNumber && <p className="text-xs text-green-700/60">Tracking: {r.shipment.trackingNumber}</p>}
            </Panel>
          )}

          <Panel title="Warehouse">
            <p className="text-sm">{r.warehouseName ?? "—"}</p>
          </Panel>
        </aside>

        <section className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap gap-2 border-b border-cream-200 pb-2" role="tablist" aria-label="Return sections">
            {(["overview", "items", "timeline", "inspection", "refund", "documents"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm font-semibold capitalize focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50",
                  tab === t ? "bg-green-500 text-cream-50" : "text-green-800 hover:bg-green-50",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-green-700/60">RMA</dt><dd className="font-medium">{r.rmaNumber}</dd></div>
                <div><dt className="text-green-700/60">Reason</dt><dd>{RETURN_REASON_LABELS[r.reason]}</dd></div>
                <div><dt className="text-green-700/60">Status</dt><dd><ReturnStatusBadge status={r.status} /></dd></div>
                <div><dt className="text-green-700/60">Refund</dt><dd><RefundStatusBadge status={r.refundStatus} /></dd></div>
                <div><dt className="text-green-700/60">Items value</dt><dd>{formatMoney(itemTotal)}</dd></div>
                <div><dt className="text-green-700/60">Refund amount</dt><dd>{formatMoney(r.refundAmount)}</dd></div>
                <div><dt className="text-green-700/60">Inspector</dt><dd>{r.inspectorName ?? "—"}</dd></div>
                <div><dt className="text-green-700/60">Created</dt><dd>{formatDateTime(r.createdAt)}</dd></div>
                {r.closedAt && <div><dt className="text-green-700/60">Closed</dt><dd>{formatDateTime(r.closedAt)}</dd></div>}
              </dl>
              <FormField label="Internal notes">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} aria-label="Internal notes" />
              </FormField>
              <Button disabled={pending} onClick={() => run(() => updateReturnNotes(r.id, notes || null))} leftIcon={pending ? <Spinner size={16} /> : undefined}>
                Save notes
              </Button>
            </div>
          )}

          {tab === "items" && (
            <div className="overflow-x-auto rounded-3xl border border-cream-200 bg-white">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-100 text-left text-green-700/60">
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold">SKU</th>
                    <th className="px-4 py-3 font-semibold text-right">Qty</th>
                    <th className="px-4 py-3 font-semibold text-right">Unit</th>
                    <th className="px-4 py-3 font-semibold">Restock</th>
                    <th className="px-4 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {r.items.map((item) => (
                    <tr key={item.id} className="border-b border-cream-50">
                      <td className="px-4 py-3 font-medium text-green-900">{item.name}</td>
                      <td className="px-4 py-3 text-green-700/70">{item.sku ?? "—"}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(item.unitPrice)}</td>
                      <td className="px-4 py-3">
                        {item.restockDecision ? RESTOCK_LABELS[item.restockDecision] : "—"}
                        {item.restocked && <Badge variant="success" size="sm" className="ml-1">Restocked</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => { setInspectingItem(item); setTab("inspection"); }}
                          className="text-green-700 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50 rounded"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "timeline" && (
            <div className="space-y-6">
              <ol className="flex flex-wrap gap-2" aria-label="Return workflow progress">
                {TIMELINE_STEPS.map((step) => {
                  const done = props.timeline.some((e) => e.type === step) || r.status === step;
                  return (
                    <li key={step}>
                      <span className={cn("inline-block rounded-full px-3 py-1 text-xs font-semibold", done ? "bg-green-100 text-green-800" : "bg-cream-100 text-green-700/40")}>
                        {RETURN_STATUS_LABELS[step as ReturnStatus] ?? step}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <ol className="space-y-3" aria-label="Return event timeline">
                {props.timeline.map((ev) => (
                  <li key={ev.id} className="border-l-2 border-green-200 pl-4">
                    <p className="text-sm font-medium text-green-900">{ev.message}</p>
                    <p className="text-xs text-green-700/60">
                      {formatDateTime(ev.createdAt)}
                      {ev.userName ? ` · ${ev.userName}` : ""}
                      {" · "}{ev.type}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {tab === "inspection" && (
            <InspectionPanel
              ret={r}
              item={inspectingItem ?? r.items[0] ?? null}
              pending={pending}
              onSelectItem={setInspectingItem}
              onSave={(data) => run(() => saveInspection({ return_id: r.id, ...data }))}
            />
          )}

          {tab === "refund" && (
            <div className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4">
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-green-700/60">Current refund status</dt><dd><RefundStatusBadge status={r.refundStatus} /></dd></div>
                <div><dt className="text-green-700/60">Items total</dt><dd>{formatMoney(itemTotal)}</dd></div>
              </dl>
              <FormField label="Refund type">
                <Select value={refundType} onChange={(e) => setRefundType(e.target.value)} aria-label="Refund type">
                  {REFUND_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace("_", " ")}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Amount">
                <Input type="number" min={0} step="0.01" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} aria-label="Refund amount" />
              </FormField>
              <FormField label="Notes">
                <Textarea value={refundNotes} onChange={(e) => setRefundNotes(e.target.value)} rows={2} aria-label="Refund notes" />
              </FormField>
              <Button
                disabled={pending || r.status === "rejected"}
                onClick={() =>
                  run(() =>
                    processRefund({
                      return_id: r.id,
                      refund_type: refundType,
                      amount: Number(refundAmount) || 0,
                      notes: refundNotes || null,
                    }),
                  )
                }
                leftIcon={pending ? <Spinner size={16} /> : undefined}
              >
                Process refund
              </Button>
            </div>
          )}

          {tab === "documents" && (
            <div className="rounded-3xl border border-cream-200 bg-white p-5 space-y-3">
              <p className="text-sm text-green-700/70">Download RMA documents (placeholder PDFs).</p>
              <div className="flex flex-wrap gap-2">
                {(["rma_label", "return_slip", "refund_receipt"] as const).map((doc) => (
                  <a
                    key={doc}
                    href={`/admin/returns/${r.id}/documents/${doc}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-green-200 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
                  >
                    {doc.replace(/_/g, " ")}
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmAction === "reject"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Reject this return?"
        confirmLabel="Reject"
        tone="danger"
        loading={pending}
        description={
          <FormField label="Reason">
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} aria-label="Rejection reason" />
          </FormField>
        }
        onConfirm={() => {
          run(() => rejectReturn(r.id, rejectReason || undefined));
          setConfirmAction(null);
        }}
      />

      <ConfirmDialog
        open={confirmAction === "close"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Close this return?"
        confirmLabel="Close"
        loading={pending}
        onConfirm={() => { run(() => closeReturn(r.id)); setConfirmAction(null); }}
      />
    </div>
  );
}

function InspectionPanel({
  ret,
  item,
  pending,
  onSelectItem,
  onSave,
}: {
  ret: ReturnDetail;
  item: ReturnItemRow | null;
  pending: boolean;
  onSelectItem: (item: ReturnItemRow) => void;
  onSave: (data: {
    item_id: string;
    condition?: string | null;
    restock_decision?: string | null;
    damage_level?: string | null;
    inspector_notes?: string | null;
    inspection_photos?: string[];
  }) => void;
}) {
  const [condition, setCondition] = useState(item?.condition ?? "");
  const [restock, setRestock] = useState(item?.restockDecision ?? "");
  const [damage, setDamage] = useState(item?.damageLevel ?? "");
  const [notes, setNotes] = useState(item?.inspectorNotes ?? "");
  const [photos, setPhotos] = useState(item?.inspectionPhotos.join("\n") ?? "");

  if (!item) return <p className="text-sm text-green-700/60">No items to inspect.</p>;

  return (
    <div className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4">
      <FormField label="Item">
        <Select
          value={item.id}
          onChange={(e) => {
            const next = ret.items.find((i) => i.id === e.target.value);
            if (next) {
              onSelectItem(next);
              setCondition(next.condition ?? "");
              setRestock(next.restockDecision ?? "");
              setDamage(next.damageLevel ?? "");
              setNotes(next.inspectorNotes ?? "");
              setPhotos(next.inspectionPhotos.join("\n"));
            }
          }}
          aria-label="Select item to inspect"
        >
          {ret.items.map((i) => (
            <option key={i.id} value={i.id}>{i.name} × {i.quantity}</option>
          ))}
        </Select>
      </FormField>
      <FormField label="Condition">
        <Input value={condition} onChange={(e) => setCondition(e.target.value)} aria-label="Item condition" />
      </FormField>
      <FormField label="Restock decision">
        <Select value={restock} onChange={(e) => setRestock(e.target.value)} aria-label="Restock decision">
          <option value="">—</option>
          {RESTOCK_DECISIONS.map((d) => (
            <option key={d} value={d}>{RESTOCK_LABELS[d]}</option>
          ))}
        </Select>
      </FormField>
      <FormField label="Damage level">
        <Select value={damage} onChange={(e) => setDamage(e.target.value)} aria-label="Damage level">
          <option value="">—</option>
          {DAMAGE_LEVELS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
      </FormField>
      <FormField label="Inspector notes">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} aria-label="Inspector notes" />
      </FormField>
      <FormField label="Photo URLs (one per line)">
        <Textarea value={photos} onChange={(e) => setPhotos(e.target.value)} rows={3} aria-label="Inspection photo URLs" />
      </FormField>
      <Button
        disabled={pending}
        onClick={() =>
          onSave({
            item_id: item.id,
            condition: condition || null,
            restock_decision: restock || null,
            damage_level: damage || null,
            inspector_notes: notes || null,
            inspection_photos: photos.split("\n").map((s) => s.trim()).filter(Boolean),
          })
        }
        leftIcon={pending ? <Spinner size={16} /> : undefined}
      >
        Save inspection
      </Button>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-cream-200 bg-white p-4">
      <h3 className="font-heading text-sm font-bold text-green-900">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}
