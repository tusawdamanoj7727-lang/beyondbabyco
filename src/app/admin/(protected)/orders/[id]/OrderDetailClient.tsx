"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import PaymentStatusBadge from "@/components/admin/PaymentStatusBadge";
import ShipmentStatusBadge from "@/components/admin/ShipmentStatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import DelhiveryShipmentPanel from "@/components/admin/DelhiveryShipmentPanel";
import FormField, { Input, Select, Textarea } from "@/components/admin/FormField";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/admin/LoadingState";
import type { AuditLogRow } from "@/lib/admin/orders";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type CourierLogRow,
  type OrderDetail,
  type OrderTimelineEvent,
} from "@/lib/admin/order-types";
import type { OrderStatus } from "@/lib/supabase/database.types";
import {
  cancelOrder,
  createRefund,
  duplicateOrder,
  updateOrderNotes,
  updateOrderStatus,
} from "@/lib/admin/order-actions";
import { addTrackingEvent, createShipment, shipOrder } from "@/lib/admin/shipment-actions";
import { cn } from "@/lib/utils";

function formatMoney(n: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

type Tab = "overview" | "shipment" | "notes" | "audit";

export default function OrderDetailClient(props: {
  order: OrderDetail;
  timeline: OrderTimelineEvent[];
  audit: AuditLogRow[];
  trackingEvents: { id: string; status: string; message: string | null; location: string | null; occurred_at: string }[];
  courierLogs: CourierLogRow[];
  customerHistory: { id: string; order_number: string; status: OrderStatus; grand_total: number; created_at: string }[];
  warehouses: { id: string; name: string; code: string }[];
  shippingMethods: { id: string; name: string; base_rate: number }[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [pending, startTransition] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [notes, setNotes] = useState(props.order.notes ?? "");
  const [internalNotes, setInternalNotes] = useState(props.order.internalNotes ?? "");
  const [refundAmount, setRefundAmount] = useState(String(props.order.grandTotal));
  const [refundReason, setRefundReason] = useState("");
  const [shipmentForm, setShipmentForm] = useState({
    warehouse_id: props.order.warehouseId ?? "",
    shipping_method_id: props.order.shippingMethodId ?? "",
    carrier: props.order.shipment?.carrier ?? "",
    tracking_number: props.order.shipment?.trackingNumber ?? "",
    weight_grams: "",
  });

  const o = props.order;

  function changeStatus(status: OrderStatus) {
    startTransition(async () => {
      await updateOrderStatus(o.id, status);
      router.refresh();
    });
  }

  function saveNotes() {
    startTransition(async () => {
      await updateOrderNotes(o.id, notes || null, internalNotes || null);
      router.refresh();
    });
  }

  function runCancel() {
    startTransition(async () => {
      await cancelOrder(o.id, "Cancelled by admin");
      setCancelOpen(false);
      router.refresh();
    });
  }

  function runDuplicate() {
    startTransition(async () => {
      const res = await duplicateOrder(o.id);
      if (res.ok && res.id) router.push(`/admin/orders/${res.id}`);
    });
  }

  function runRefund(full: boolean) {
    startTransition(async () => {
      await createRefund({
        order_id: o.id,
        amount: full ? o.grandTotal : Number(refundAmount),
        reason: refundReason || null,
        full,
      });
      router.refresh();
    });
  }

  function runCreateShipment() {
    startTransition(async () => {
      await createShipment({
        order_id: o.id,
        warehouse_id: shipmentForm.warehouse_id || null,
        shipping_method_id: shipmentForm.shipping_method_id || null,
        carrier: shipmentForm.carrier || null,
        tracking_number: shipmentForm.tracking_number || null,
        weight_grams: shipmentForm.weight_grams ? Number(shipmentForm.weight_grams) : null,
        estimated_delivery: null,
      });
      router.refresh();
    });
  }

  function runShip() {
    if (!o.shipment) return;
    startTransition(async () => {
      await shipOrder(o.id, o.shipment!.id);
      router.refresh();
    });
  }

  function addTracking(status: "in_transit" | "out_for_delivery" | "delivered") {
    if (!o.shipment) return;
    startTransition(async () => {
      await addTrackingEvent({ shipment_id: o.shipment!.id, status, message: `Status updated to ${status}` });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-cream-200 bg-cream-50 p-4">
        <OrderStatusBadge status={o.status} size="md" />
        {o.payment && <PaymentStatusBadge status={o.payment.status} size="md" />}
        {o.shipment && <ShipmentStatusBadge status={o.shipment.status} size="md" />}
        <div className="ml-auto flex flex-wrap gap-2">
          <Select aria-label="Change order status" value={o.status} onChange={(e) => changeStatus(e.target.value as OrderStatus)} className="min-w-[140px]" disabled={pending}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
            ))}
          </Select>
          <Button variant="ghost" size="sm" onClick={runDuplicate} disabled={pending}>Duplicate</Button>
          <Button variant="ghost" size="sm" onClick={() => setCancelOpen(true)} disabled={pending || o.status === "cancelled"}>Cancel</Button>
          <a href={`/admin/orders/${o.id}/documents/invoice`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-2xl px-3 text-sm font-medium text-green-700 hover:bg-green-50">Invoice</a>
          <a href={`/admin/orders/${o.id}/documents/packing_slip`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-2xl px-3 text-sm font-medium text-green-700 hover:bg-green-50">Packing Slip</a>
          <a href={`/admin/orders/${o.id}/documents/shipping_label`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-2xl px-3 text-sm font-medium text-green-700 hover:bg-green-50">Label</a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-cream-200 pb-2" role="tablist" aria-label="Order sections">
        {(["overview", "shipment", "notes", "audit"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-2xl px-4 py-2 text-sm font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50",
              tab === t ? "bg-green-500 text-cream-50" : "text-green-800 hover:bg-green-50",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-cream-200 bg-white p-5">
              <h2 className="font-heading text-lg font-bold text-green-900">Timeline</h2>
              <ol className="mt-4 space-y-3" aria-label="Order timeline">
                {props.timeline.length === 0 ? (
                  <li className="text-sm text-green-700/60">No events yet.</li>
                ) : (
                  props.timeline.map((ev) => (
                    <li key={ev.id} className="border-l-2 border-green-200 pl-4">
                      <p className="text-sm font-medium text-green-900">{ev.message}</p>
                      <p className="text-xs text-green-700/60">
                        {formatDateTime(ev.createdAt)}
                        {ev.userName ? ` · ${ev.userName}` : ""}
                      </p>
                    </li>
                  ))
                )}
              </ol>
            </div>

            <div className="rounded-3xl border border-cream-200 bg-white p-5">
              <h2 className="font-heading text-lg font-bold text-green-900">Items</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cream-200 text-left text-green-700/70">
                      <th className="pb-2 pr-4">Product</th>
                      <th className="pb-2 pr-4">SKU</th>
                      <th className="pb-2 pr-4 text-right">Qty</th>
                      <th className="pb-2 pr-4 text-right">Price</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.items.map((item) => (
                      <tr key={item.id} className="border-b border-cream-100">
                        <td className="py-2 pr-4 font-medium text-green-900">{item.name}</td>
                        <td className="py-2 pr-4 text-green-700/70">{item.sku ?? "—"}</td>
                        <td className="py-2 pr-4 text-right">{item.quantity}</td>
                        <td className="py-2 pr-4 text-right">{formatMoney(item.unitPrice, o.currency)}</td>
                        <td className="py-2 text-right">{formatMoney(item.total, o.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {o.refunds.length > 0 && (
              <div className="rounded-3xl border border-cream-200 bg-white p-5">
                <h2 className="font-heading text-lg font-bold text-green-900">Refunds</h2>
                <ul className="mt-3 space-y-2">
                  {o.refunds.map((r) => (
                    <li key={r.id} className="flex items-center justify-between text-sm">
                      <span>{formatMoney(r.amount, o.currency)} — {r.reason ?? "No reason"}</span>
                      <PaymentStatusBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <Panel title="Customer">
              <p className="font-semibold text-green-900">{o.customerName}</p>
              {o.customerEmail && <p className="text-sm text-green-700/70">{o.customerEmail}</p>}
              {o.customerPhone && <p className="text-sm text-green-700/70">{o.customerPhone}</p>}
            </Panel>

            {o.shippingAddress && (
              <Panel title="Shipping address">
                <p className="text-sm text-green-800">{o.shippingAddress.fullName}</p>
                <p className="text-sm text-green-700/70">{o.shippingAddress.line1}</p>
                {o.shippingAddress.line2 && <p className="text-sm text-green-700/70">{o.shippingAddress.line2}</p>}
                <p className="text-sm text-green-700/70">
                  {o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.pincode}
                </p>
                <p className="text-sm text-green-700/70">{o.shippingAddress.country}</p>
              </Panel>
            )}

            <Panel title="Pricing">
              <dl className="space-y-1 text-sm">
                <Row label="Subtotal" value={formatMoney(o.subtotal, o.currency)} />
                <Row label="Discount" value={`−${formatMoney(o.discountTotal, o.currency)}`} />
                <Row label="Tax" value={formatMoney(o.taxTotal, o.currency)} />
                <Row label="Shipping" value={formatMoney(o.shippingTotal, o.currency)} />
                <Row label="Total" value={formatMoney(o.grandTotal, o.currency)} bold />
              </dl>
            </Panel>

            {o.payment && (
              <Panel title="Payment">
                <PaymentStatusBadge status={o.payment.status} />
                <p className="mt-2 text-sm text-green-700/70">{formatMoney(o.payment.amount, o.currency)}</p>
                {o.payment.method && <p className="text-sm text-green-700/70">{o.payment.method}</p>}
              </Panel>
            )}

            {props.customerHistory.length > 0 && (
              <Panel title="Order history">
                <ul className="space-y-2">
                  {props.customerHistory.map((h) => (
                    <li key={h.id}>
                      <Link href={`/admin/orders/${h.id}`} className="text-sm font-medium text-green-800 hover:underline">
                        {h.order_number}
                      </Link>
                      <span className="ml-2 text-xs text-green-700/60">{ORDER_STATUS_LABELS[h.status as keyof typeof ORDER_STATUS_LABELS]}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            <Panel title="Refund">
              <FormField label="Amount">
                <Input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} min={0} step="0.01" />
              </FormField>
              <FormField label="Reason" className="mt-2">
                <Input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
              </FormField>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => runRefund(false)}>Partial</Button>
                <Button size="sm" disabled={pending} onClick={() => runRefund(true)} leftIcon={pending ? <Spinner size={14} /> : undefined}>Full refund</Button>
              </div>
            </Panel>
          </aside>
        </div>
      )}

      {tab === "shipment" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <DelhiveryShipmentPanel
            orderId={o.id}
            courierLogs={props.courierLogs}
            shipment={
              o.shipment
                ? {
                    id: o.shipment.id,
                    trackingNumber: o.shipment.trackingNumber,
                    labelUrl: o.shipment.labelUrl,
                    status: o.shipment.status,
                    pickupStatus: o.shipment.pickupStatus,
                  }
                : null
            }
          />
          {!o.shipment ? (
            <div className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4">
              <h2 className="font-heading text-lg font-bold text-green-900">Create shipment</h2>
              <FormField label="Warehouse">
                <Select value={shipmentForm.warehouse_id} onChange={(e) => setShipmentForm((f) => ({ ...f, warehouse_id: e.target.value }))}>
                  <option value="">Select warehouse</option>
                  {props.warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Shipping method">
                <Select value={shipmentForm.shipping_method_id} onChange={(e) => setShipmentForm((f) => ({ ...f, shipping_method_id: e.target.value }))}>
                  <option value="">Select method</option>
                  {props.shippingMethods.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Carrier"><Input value={shipmentForm.carrier} onChange={(e) => setShipmentForm((f) => ({ ...f, carrier: e.target.value }))} /></FormField>
              <FormField label="Tracking number"><Input value={shipmentForm.tracking_number} onChange={(e) => setShipmentForm((f) => ({ ...f, tracking_number: e.target.value }))} /></FormField>
              <FormField label="Weight (grams)"><Input type="number" value={shipmentForm.weight_grams} onChange={(e) => setShipmentForm((f) => ({ ...f, weight_grams: e.target.value }))} /></FormField>
              <Button onClick={runCreateShipment} disabled={pending} leftIcon={pending ? <Spinner size={16} /> : undefined}>Create shipment</Button>
            </div>
          ) : (
            <div className="rounded-3xl border border-cream-200 bg-white p-5 space-y-4">
              <h2 className="font-heading text-lg font-bold text-green-900">Shipment</h2>
              <ShipmentStatusBadge status={o.shipment.status} size="md" />
              <dl className="space-y-1 text-sm">
                <Row label="Tracking" value={o.shipment.trackingNumber ?? "—"} />
                <Row label="Carrier" value={o.shipment.carrier ?? "—"} />
                <Row label="Warehouse" value={o.warehouseName ?? "—"} />
                <Row label="Est. delivery" value={o.shipment.estimatedDelivery ? formatDateTime(o.shipment.estimatedDelivery) : "—"} />
                <Row label="Shipped" value={o.shipment.shippedAt ? formatDateTime(o.shipment.shippedAt) : "—"} />
                <Row label="Delivered" value={o.shipment.deliveredAt ? formatDateTime(o.shipment.deliveredAt) : "—"} />
              </dl>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" onClick={runShip} disabled={pending || o.status === "shipped"}>Mark shipped</Button>
                <Button size="sm" variant="ghost" onClick={() => addTracking("in_transit")} disabled={pending}>In transit</Button>
                <Button size="sm" variant="ghost" onClick={() => addTracking("delivered")} disabled={pending}>Delivered</Button>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-cream-200 bg-white p-5">
            <h2 className="font-heading text-lg font-bold text-green-900">Tracking events</h2>
            <ol className="mt-4 space-y-3" aria-label="Tracking timeline">
              {props.trackingEvents.length === 0 ? (
                <li className="text-sm text-green-700/60">No tracking events.</li>
              ) : (
                props.trackingEvents.map((ev) => (
                  <li key={ev.id} className="border-l-2 border-green-200 pl-4">
                    <p className="text-sm font-medium text-green-900">{ev.message ?? ev.status}</p>
                    <p className="text-xs text-green-700/60">
                      {formatDateTime(ev.occurred_at)}
                      {ev.location ? ` · ${ev.location}` : ""}
                    </p>
                  </li>
                ))
              )}
            </ol>
          </div>
        </div>
      )}

      {tab === "notes" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <FormField label="Customer notes">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} aria-label="Customer notes" />
          </FormField>
          <FormField label="Internal comments">
            <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={5} aria-label="Internal comments" />
          </FormField>
          <div className="lg:col-span-2">
            <Button onClick={saveNotes} disabled={pending} leftIcon={pending ? <Spinner size={16} /> : undefined}>Save notes</Button>
          </div>
        </div>
      )}

      {tab === "audit" && (
        <div className="rounded-3xl border border-cream-200 bg-white p-5">
          <h2 className="font-heading text-lg font-bold text-green-900">Audit log</h2>
          <ul className="mt-4 space-y-2" aria-label="Audit entries">
            {props.audit.length === 0 ? (
              <li className="text-sm text-green-700/60">No audit entries.</li>
            ) : (
              props.audit.map((a) => (
                <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-cream-100 py-2 text-sm">
                  <span className="font-medium text-green-900">{a.action} · {a.tableName}</span>
                  <span className="text-green-700/60">{formatDateTime(a.createdAt)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this order?"
        description="Reserved stock will be released if the order has not shipped."
        confirmLabel="Cancel order"
        tone="danger"
        loading={pending}
        onConfirm={runCancel}
      />
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

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-green-700/70">{label}</dt>
      <dd className={cn(bold && "font-bold text-green-900")}>{value}</dd>
    </div>
  );
}
