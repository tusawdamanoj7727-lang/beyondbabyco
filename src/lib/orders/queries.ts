import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OrderStatus, PaymentStatus, ShipmentStatus } from "@/lib/supabase/database.types";
import type { OrderTimelineEvent } from "@/lib/admin/order-types";

export interface PublicOrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  grandTotal: number;
  currency: string;
  itemCount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface PublicOrderDetail extends PublicOrderSummary {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  items: {
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  shippingAddress: {
    fullName: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
}

export interface PublicShipment {
  id: string;
  orderId: string;
  status: ShipmentStatus;
  carrier: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  estimatedDelivery: string | null;
}

export async function getOrders(opts?: {
  customerId?: string;
  status?: OrderStatus;
  limit?: number;
}): Promise<PublicOrderSummary[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("orders")
    .select("id, order_number, status, grand_total, currency, created_at")
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 50);

  if (opts?.customerId) query = query.eq("customer_id", opts.customerId);
  if (opts?.status) query = query.eq("status", opts.status);

  const { data: orders } = await query;
  if (!orders?.length) return [];

  const orderIds = orders.map((o) => o.id);
  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase.from("order_items").select("order_id, quantity").in("order_id", orderIds),
    supabase.from("payments").select("order_id, status, created_at").in("order_id", orderIds).order("created_at", { ascending: false }),
  ]);

  const itemCounts = new Map<string, number>();
  for (const item of items ?? []) {
    itemCounts.set(item.order_id, (itemCounts.get(item.order_id) ?? 0) + item.quantity);
  }

  const paymentMap = new Map<string, PaymentStatus>();
  for (const p of payments ?? []) {
    if (!paymentMap.has(p.order_id)) paymentMap.set(p.order_id, p.status);
  }

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    grandTotal: o.grand_total,
    currency: o.currency,
    itemCount: itemCounts.get(o.id) ?? 0,
    paymentStatus: paymentMap.get(o.id) ?? "pending",
    createdAt: o.created_at,
  }));
}

export async function getOrder(id: string): Promise<PublicOrderDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) return null;

  const [{ data: items }, { data: address }, { data: payments }] = await Promise.all([
    supabase.from("order_items").select("id, name, sku, quantity, unit_price, total").eq("order_id", id),
    supabase.from("shipping_addresses").select("full_name, line1, city, state, pincode").eq("order_id", id).maybeSingle(),
    supabase.from("payments").select("status").eq("order_id", id).order("created_at", { ascending: false }).limit(1),
  ]);

  const itemCount = (items ?? []).reduce((s, i) => s + i.quantity, 0);

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    grandTotal: order.grand_total,
    currency: order.currency,
    itemCount,
    paymentStatus: payments?.[0]?.status ?? "pending",
    createdAt: order.created_at,
    subtotal: order.subtotal,
    discountTotal: order.discount_total,
    taxTotal: order.tax_total,
    shippingTotal: order.shipping_total,
    items: (items ?? []).map((i) => ({
      id: i.id,
      name: i.name,
      sku: i.sku,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      total: i.total,
    })),
    shippingAddress: address
      ? { fullName: address.full_name, line1: address.line1, city: address.city, state: address.state, pincode: address.pincode }
      : null,
  };
}

export async function getOrderTimeline(orderId: string): Promise<OrderTimelineEvent[]> {
  const supabase = await createSupabaseServerClient();
  const { data: events } = await supabase
    .from("order_events")
    .select("id, type, message, metadata, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  return (events ?? []).map((e) => ({
    id: e.id,
    type: e.type,
    message: e.message,
    metadata: (e.metadata as Record<string, unknown>) ?? {},
    userName: null,
    createdAt: e.created_at,
  }));
}

export async function getShipments(opts?: { orderId?: string; limit?: number }): Promise<PublicShipment[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("shipments")
    .select("id, order_id, status, carrier, tracking_number, shipped_at, delivered_at, estimated_delivery")
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 50);

  if (opts?.orderId) query = query.eq("order_id", opts.orderId);

  const { data } = await query;
  return (data ?? []).map((s) => ({
    id: s.id,
    orderId: s.order_id,
    status: s.status,
    carrier: s.carrier,
    trackingNumber: s.tracking_number,
    shippedAt: s.shipped_at,
    deliveredAt: s.delivered_at,
    estimatedDelivery: s.estimated_delivery,
  }));
}
