"use server";

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCustomerIdForUser, requireCustomerSession } from "@/lib/orders/customer-auth";
import { getOrder, getOrders, getOrderTimeline } from "@/lib/orders/queries";

export interface CustomerShipmentDetail {
  id: string;
  orderId: string;
  orderNumber: string;
  status: string;
  trackingNumber: string | null;
  labelUrl: string | null;
  expectedDelivery: string | null;
  pickupStatus: string | null;
  carrier: string | null;
  timeline: {
    id: string;
    status: string;
    message: string | null;
    location: string | null;
    eventTime: string;
  }[];
}

export async function getCustomerOrders() {
  const user = await requireCustomerSession();
  if (!user) return [];
  const customerId = await getCustomerIdForUser(user.id);
  if (!customerId) return [];
  return getOrders({ customerId, limit: 50 });
}

export interface CustomerOrderListRow {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number;
  currency: string;
  createdAt: string;
  itemCount: number;
  trackingNumber: string | null;
  carrier: string | null;
  expectedDelivery: string | null;
}

export async function getCustomerOrdersWithShipments(): Promise<CustomerOrderListRow[]> {
  const orders = await getCustomerOrders();
  if (orders.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const orderIds = orders.map((o) => o.id);
  const { data: shipments } = await supabase
    .from("shipments")
    .select("order_id, tracking_number, carrier, estimated_delivery")
    .in("order_id", orderIds);

  const shipmentMap = new Map(
    (shipments ?? []).map((s) => [
      s.order_id,
      {
        trackingNumber: s.tracking_number as string | null,
        carrier: s.carrier as string | null,
        expectedDelivery: s.estimated_delivery as string | null,
      },
    ]),
  );

  return orders.map((o) => {
    const ship = shipmentMap.get(o.id);
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      grandTotal: o.grandTotal,
      currency: o.currency,
      createdAt: o.createdAt,
      itemCount: o.itemCount,
      trackingNumber: ship?.trackingNumber ?? null,
      carrier: ship?.carrier ?? null,
      expectedDelivery: ship?.expectedDelivery ?? null,
    };
  });
}

export async function getCustomerOrderDetail(orderId: string) {
  const user = await requireCustomerSession();
  if (!user) return null;

  const customerId = await getCustomerIdForUser(user.id);
  if (!customerId) return null;

  const order = await getOrder(orderId);
  if (!order) return null;

  const supabase = await createSupabaseServerClient();
  const { data: dbOrder } = await supabase.from("orders").select("customer_id").eq("id", orderId).maybeSingle();
  if (dbOrder?.customer_id !== customerId) return null;

  const { data: shipment } = await supabase
    .from("shipments")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  let timeline: CustomerShipmentDetail["timeline"] = [];
  if (shipment) {
    const { data: rows } = await supabase
      .from("shipment_tracking")
      .select("id, status, message, location, event_time")
      .eq("shipment_id", shipment.id)
      .order("event_time", { ascending: false });

    timeline = (rows ?? []).map((r) => ({
      id: r.id,
      status: r.status,
      message: r.message,
      location: r.location,
      eventTime: r.event_time,
    }));
  }

  return {
    order,
    orderTimeline: await getOrderTimeline(orderId),
    shipment: shipment
      ? {
          id: shipment.id,
          orderId: shipment.order_id,
          orderNumber: order.orderNumber,
          status: shipment.status,
          trackingNumber: shipment.tracking_number,
          labelUrl: shipment.label_url,
          expectedDelivery: shipment.estimated_delivery,
          pickupStatus: shipment.pickup_status,
          carrier: shipment.carrier,
          timeline,
        }
      : null,
  };
}
