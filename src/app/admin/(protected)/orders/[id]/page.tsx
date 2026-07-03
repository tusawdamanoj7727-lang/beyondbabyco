import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  getCustomerOrderHistory,
  getCourierLogs,
  getOrderAuditLogs,
  getOrderDetail,
  getOrderFilterOptions,
  getOrderTimeline,
  getTrackingEvents,
} from "@/lib/admin/orders";
import OrderDetailClient from "./OrderDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrderDetail(id);
  return { title: order ? `Order ${order.orderNumber}` : "Order" };
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.ORDERS_MANAGE);
  const { id } = await params;

  const order = await getOrderDetail(id);
  if (!order) notFound();

  const [timeline, audit, options, customerHistory, trackingEvents, courierLogs] = await Promise.all([
    getOrderTimeline(id),
    getOrderAuditLogs(id),
    getOrderFilterOptions(),
    order.customerId ? getCustomerOrderHistory(order.customerId, id) : Promise.resolve([]),
    order.shipment ? getTrackingEvents(order.shipment.id) : Promise.resolve([]),
    getCourierLogs(id),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Orders"
        title={order.orderNumber}
        description={`Placed ${new Date(order.createdAt).toLocaleDateString("en-IN")}`}
      />
      <OrderDetailClient
        order={order}
        timeline={timeline}
        audit={audit}
        trackingEvents={trackingEvents}
        courierLogs={courierLogs}
        customerHistory={customerHistory}
        warehouses={options.warehouses}
        shippingMethods={options.shippingMethods}
      />
    </div>
  );
}
