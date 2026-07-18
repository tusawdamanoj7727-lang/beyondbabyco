import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import OrderDetailActions, { OrderTimelinePanel } from "@/components/account/OrderDetailActions";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import ShipmentStatusBadge from "@/components/admin/ShipmentStatusBadge";
import CourierBadge from "@/components/shipping/CourierBadge";
import ShipmentTimeline from "@/components/shipping/ShipmentTimeline";
import { getCustomerOrderDetail } from "@/lib/orders/customer-shipment";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return buildPageMetadata({
    title: "Order Details",
    description: "View order status, items, and shipment tracking.",
    path: `/account/orders/${id}`,
    noIndex: true,
  });
}

function formatMoney(n: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(n);
}

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCustomerOrderDetail(id);
  if (!data) notFound();

  const { order, shipment, orderTimeline } = data;
  const trackingNumber = shipment?.trackingNumber;

  return (
    <div className="space-y-8">
      <Link
        href="/account/orders"
        className="inline-flex min-h-[44px] items-center text-sm font-medium text-green-700 hover:text-green-900"
      >
        ← Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-green-900">{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <OrderDetailActions orderId={order.id} status={order.status} />
      </div>

      <OrderTimelinePanel
        events={orderTimeline.map((e) => ({
          id: e.id,
          type: e.type,
          message: e.message,
          createdAt: e.createdAt,
        }))}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-3xl border border-cream-200 bg-white p-5">
          <h2 className="font-heading text-lg font-bold text-green-900">Order summary</h2>
          <ul className="space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatMoney(item.total, order.currency)}</span>
              </li>
            ))}
          </ul>
          <p className="border-t border-cream-200 pt-3 font-semibold text-green-900">
            Total: {formatMoney(order.grandTotal, order.currency)}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={`/account/orders/${order.id}/documents/invoice?download=1`}
              className="inline-flex min-h-[40px] items-center rounded-full border border-green-200 px-4 text-sm font-semibold text-green-800 hover:bg-green-50"
            >
              Download invoice
            </a>
            <a
              href={`/account/orders/${order.id}/documents/invoice`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[40px] items-center rounded-full border border-green-200 px-4 text-sm font-semibold text-green-800 hover:bg-green-50"
            >
              Print invoice
            </a>
            {trackingNumber && shipment?.labelUrl ? (
              <a
                href={`/api/delhivery/label?waybill=${encodeURIComponent(trackingNumber)}&shipmentId=${shipment.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[40px] items-center rounded-full border border-green-200 px-4 text-sm font-semibold text-green-800 hover:bg-green-50"
              >
                Shipping label
              </a>
            ) : null}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-cream-200 bg-white p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-lg font-bold text-green-900">Track shipment</h2>
            {shipment?.carrier ? <CourierBadge name={shipment.carrier} /> : null}
            {shipment ? <ShipmentStatusBadge status={shipment.status as never} size="sm" /> : null}
          </div>

          {trackingNumber ? (
            <p className="text-sm text-green-800">
              Delhivery AWB: <span className="font-mono font-semibold">{trackingNumber}</span>
            </p>
          ) : null}
          {shipment?.expectedDelivery ? (
            <p className="text-sm text-green-700">
              Estimated delivery: {new Date(shipment.expectedDelivery).toLocaleDateString("en-IN")}
            </p>
          ) : null}

          {shipment ? (
            <ShipmentTimeline events={shipment.timeline} />
          ) : (
            <p className="text-sm text-green-700">Shipment will appear here once dispatched.</p>
          )}
        </section>
      </div>
    </div>
  );
}
