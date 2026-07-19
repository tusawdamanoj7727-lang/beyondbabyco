import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OrderStatus, PaymentStatus, ShipmentStatus } from "@/lib/supabase/database.types";
import {
  ORDER_SORTABLE_COLUMNS,
  type OrderDashboard,
  type OrderDetail,
  type OrderListItem,
  type OrderTimelineEvent,
  type CourierLogRow,
  type ShipmentListItem,
  type OrderSortColumn,
} from "./order-types";

export { ORDER_SORTABLE_COLUMNS, type OrderSortColumn };

export interface OrderListParams {
  search?: string;
  status?: OrderStatus | "all";
  payment?: PaymentStatus | "all";
  shipment?: ShipmentStatus | "all";
  warehouseId?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: OrderSortColumn;
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface OrderListResult {
  rows: OrderListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export interface ShipmentListParams {
  search?: string;
  status?: ShipmentStatus | "all";
  warehouseId?: string;
  page?: number;
  perPage?: number;
}

export interface ShipmentListResult {
  rows: ShipmentListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export interface AuditLogRow {
  id: string;
  action: string;
  tableName: string;
  recordId: string | null;
  newData: Record<string, unknown> | null;
  createdAt: string;
}

async function loadCustomers(ids: string[]) {
  const map = new Map<string, { id: string; full_name: string | null; email: string | null; phone: string | null }>();
  if (!ids.length) return map;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("customers").select("id, full_name, email, phone").in("id", ids);
  for (const c of data ?? []) map.set(c.id, c);
  return map;
}

async function loadWarehouses(ids: string[]) {
  const map = new Map<string, { id: string; name: string }>();
  if (!ids.length) return map;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("warehouses").select("id, name").in("id", ids);
  for (const w of data ?? []) map.set(w.id, w);
  return map;
}

async function loadPaymentsByOrder(orderIds: string[]) {
  const map = new Map<string, { status: PaymentStatus; amount: number }>();
  if (!orderIds.length) return map;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("payments").select("order_id, status, amount, created_at").in("order_id", orderIds).order("created_at", { ascending: false });
  for (const p of data ?? []) {
    if (!map.has(p.order_id)) map.set(p.order_id, { status: p.status, amount: p.amount });
  }
  return map;
}

async function loadShipmentsByOrder(orderIds: string[]) {
  const map = new Map<string, { id: string; status: ShipmentStatus }>();
  if (!orderIds.length) return map;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("shipments").select("id, order_id, status, created_at").in("order_id", orderIds).order("created_at", { ascending: false });
  for (const s of data ?? []) {
    if (!map.has(s.order_id)) map.set(s.order_id, { id: s.id, status: s.status });
  }
  return map;
}

async function loadItemCounts(orderIds: string[]) {
  const map = new Map<string, number>();
  if (!orderIds.length) return map;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("order_items").select("order_id, quantity").in("order_id", orderIds);
  for (const item of data ?? []) {
    map.set(item.order_id, (map.get(item.order_id) ?? 0) + item.quantity);
  }
  return map;
}

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getOrderDashboard(): Promise<OrderDashboard> {
  const supabase = await createSupabaseServerClient();
  const today = startOfTodayIso();

  const [
    { count: todayOrders },
    { count: pending },
    { count: packed },
    { count: shipped },
    { count: returns },
    { data: todayPaidOrders },
  ] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["packed", "processing"]),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "shipped"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "returned"),
    supabase.from("orders").select("id, grand_total, created_at").gte("created_at", today),
  ]);

  const ids = (todayPaidOrders ?? []).map((o) => o.id);
  const paidMap = await loadPaymentsByOrder(ids);
  const paidToday = (todayPaidOrders ?? []).filter((o) => paidMap.get(o.id)?.status === "paid");
  const revenue = paidToday.reduce((s, o) => s + Number(o.grand_total), 0);
  const avg = paidToday.length ? revenue / paidToday.length : 0;

  return {
    todayOrders: todayOrders ?? 0,
    pending: pending ?? 0,
    packed: packed ?? 0,
    shipped: shipped ?? 0,
    returns: returns ?? 0,
    revenue,
    averageOrderValue: Math.round(avg * 100) / 100,
  };
}

export async function listOrders(params: OrderListParams): Promise<OrderListResult> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(5, params.perPage ?? 20));
  const sort = params.sort ?? "created_at";
  const dir = params.dir === "asc";

  let query = supabase.from("orders").select("*", { count: "exact" });

  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.warehouseId) query = query.eq("warehouse_id", params.warehouseId);
  if (params.customerId) query = query.eq("customer_id", params.customerId);
  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo);
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    query = query.or(`order_number.ilike.${q}`);
  }

  const sortCol =
    sort === "grand_total" ? "grand_total" : sort === "order_number" ? "order_number" : sort === "status" ? "status" : "created_at";
  query = query.order(sortCol, { ascending: dir });

  const from = (page - 1) * perPage;
  const { data, count, error } = await query.range(from, from + perPage - 1);
  if (error) throw error;

  const orderIds = (data ?? []).map((o) => o.id);
  const customerIds = [...new Set((data ?? []).map((o) => o.customer_id).filter(Boolean))] as string[];
  const warehouseIds = [...new Set((data ?? []).map((o) => o.warehouse_id).filter(Boolean))] as string[];

  const [customers, warehouses, payments, shipments, itemCounts] = await Promise.all([
    loadCustomers(customerIds),
    loadWarehouses(warehouseIds),
    loadPaymentsByOrder(orderIds),
    loadShipmentsByOrder(orderIds),
    loadItemCounts(orderIds),
  ]);

  let rows: OrderListItem[] = (data ?? []).map((o) => {
    const customer = o.customer_id ? customers.get(o.customer_id) : undefined;
    const warehouse = o.warehouse_id ? warehouses.get(o.warehouse_id) : undefined;
    const payment = payments.get(o.id);
    const shipment = shipments.get(o.id);
    return {
      id: o.id,
      orderNumber: o.order_number,
      customerName: customer?.full_name ?? customer?.email ?? "Guest",
      customerId: o.customer_id,
      itemCount: itemCounts.get(o.id) ?? 0,
      paymentStatus: payment?.status ?? "pending",
      orderStatus: o.status,
      shipmentStatus: shipment?.status ?? null,
      warehouseName: warehouse?.name ?? null,
      warehouseId: o.warehouse_id,
      total: o.grand_total,
      currency: o.currency,
      createdAt: o.created_at,
    };
  });

  if (params.payment && params.payment !== "all") {
    rows = rows.filter((r) => r.paymentStatus === params.payment);
  }
  if (params.shipment && params.shipment !== "all") {
    rows = rows.filter((r) => r.shipmentStatus === params.shipment);
  }
  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.orderNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q),
    );
  }

  const total = count ?? rows.length;
  return { rows, total, page, perPage, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) return null;

  const [{ data: items }, { data: address }, { data: payments }, { data: shipments }, { data: refunds }, { data: customer }, { data: warehouse }, { data: method }] =
    await Promise.all([
      supabase.from("order_items").select("*").eq("order_id", id).order("created_at"),
      supabase.from("shipping_addresses").select("*").eq("order_id", id).maybeSingle(),
      supabase.from("payments").select("*").eq("order_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("shipments").select("*").eq("order_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("order_refunds").select("*").eq("order_id", id).order("created_at", { ascending: false }),
      order.customer_id
        ? supabase.from("customers").select("*").eq("id", order.customer_id).maybeSingle()
        : Promise.resolve({ data: null }),
      order.warehouse_id
        ? supabase.from("warehouses").select("id, name").eq("id", order.warehouse_id).maybeSingle()
        : Promise.resolve({ data: null }),
      order.shipping_method_id
        ? supabase.from("shipping_methods").select("id, name").eq("id", order.shipping_method_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const payment = payments?.[0] ?? null;
  const shipment = shipments?.[0] ?? null;

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    customerId: order.customer_id,
    customerName: customer?.full_name ?? customer?.email ?? "Guest",
    customerEmail: customer?.email ?? null,
    customerPhone: customer?.phone ?? null,
    warehouseId: order.warehouse_id,
    warehouseName: warehouse?.name ?? null,
    shippingMethodId: order.shipping_method_id,
    shippingMethodName: method?.name ?? null,
    subtotal: order.subtotal,
    discountTotal: order.discount_total,
    taxTotal: order.tax_total,
    shippingTotal: order.shipping_total,
    grandTotal: order.grand_total,
    currency: order.currency,
    notes: order.notes,
    internalNotes: order.internal_notes,
    cancelReason: order.cancel_reason,
    placedAt: order.placed_at,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items: (items ?? []).map((i) => ({
      id: i.id,
      productId: i.product_id,
      variantId: i.product_variant_id,
      name: i.name,
      sku: i.sku,
      unitPrice: i.unit_price,
      quantity: i.quantity,
      taxRate: i.tax_rate,
      total: i.total,
    })),
    shippingAddress: address
      ? {
          fullName: address.full_name,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          country: address.country,
          pincode: address.pincode,
        }
      : null,
    payment: payment
      ? {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          method: payment.method,
          provider: payment.provider,
        }
      : null,
    shipment: shipment
      ? {
          id: shipment.id,
          status: shipment.status,
          trackingNumber: shipment.tracking_number,
          carrier: shipment.carrier,
          labelUrl: shipment.label_url,
          pickupStatus: shipment.pickup_status,
          shippedAt: shipment.shipped_at,
          deliveredAt: shipment.delivered_at,
          estimatedDelivery: shipment.estimated_delivery,
        }
      : null,
    refunds: (refunds ?? []).map((r) => ({
      id: r.id,
      amount: r.amount,
      reason: r.reason,
      notes: r.notes,
      status: r.status,
      createdAt: r.created_at,
    })),
  };
}

export async function getCourierLogs(orderId: string): Promise<CourierLogRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("courier_logs")
    .select("id, action, success, error_message, status_code, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    success: row.success,
    errorMessage: row.error_message,
    statusCode: row.status_code,
    createdAt: row.created_at,
  }));
}

export async function getOrderTimeline(orderId: string): Promise<OrderTimelineEvent[]> {
  const supabase = await createSupabaseServerClient();
  const { data: events } = await supabase
    .from("order_events")
    .select("id, type, message, metadata, created_by, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  const userIds = [...new Set((events ?? []).map((e) => e.created_by).filter(Boolean))] as string[];
  const userMap = new Map<string, string>();
  if (userIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
    for (const p of profiles ?? []) userMap.set(p.id, p.full_name ?? "Staff");
  }

  return (events ?? []).map((e) => ({
    id: e.id,
    type: e.type,
    message: e.message,
    metadata: (e.metadata as Record<string, unknown>) ?? {},
    userName: e.created_by ? userMap.get(e.created_by) ?? null : null,
    createdAt: e.created_at,
  }));
}

export async function getOrderAuditLogs(orderId: string): Promise<AuditLogRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, table_name, record_id, new_data, created_at")
    .eq("record_id", orderId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((a) => ({
    id: a.id,
    action: a.action,
    tableName: a.table_name,
    recordId: a.record_id,
    newData: a.new_data as Record<string, unknown> | null,
    createdAt: a.created_at,
  }));
}

export async function listShipments(params: ShipmentListParams): Promise<ShipmentListResult> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(5, params.perPage ?? 20));

  let query = supabase.from("shipments").select("*", { count: "exact" });
  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.warehouseId) query = query.eq("warehouse_id", params.warehouseId);
  query = query.order("created_at", { ascending: false });

  const from = (page - 1) * perPage;
  const { data, count, error } = await query.range(from, from + perPage - 1);
  if (error) throw error;

  const orderIds = [...new Set((data ?? []).map((s) => s.order_id))];
  const warehouseIds = [...new Set((data ?? []).map((s) => s.warehouse_id).filter(Boolean))] as string[];

  const { data: orders } = orderIds.length
    ? await supabase.from("orders").select("id, order_number, customer_id").in("id", orderIds)
    : { data: [] };

  const customerIds = [...new Set((orders ?? []).map((o) => o.customer_id).filter(Boolean))] as string[];
  const [customers, warehouses] = await Promise.all([loadCustomers(customerIds), loadWarehouses(warehouseIds)]);

  const orderMap = new Map((orders ?? []).map((o) => [o.id, o]));

  let rows: ShipmentListItem[] = (data ?? []).map((s) => {
    const order = orderMap.get(s.order_id);
    const customer = order?.customer_id ? customers.get(order.customer_id) : undefined;
    const warehouse = s.warehouse_id ? warehouses.get(s.warehouse_id) : undefined;
    return {
      id: s.id,
      orderId: s.order_id,
      orderNumber: order?.order_number ?? "—",
      customerName: customer?.full_name ?? customer?.email ?? "Guest",
      carrier: s.carrier,
      trackingNumber: s.tracking_number,
      status: s.status,
      warehouseName: warehouse?.name ?? null,
      shippedAt: s.shipped_at,
      deliveredAt: s.delivered_at,
      estimatedDelivery: s.estimated_delivery,
      createdAt: s.created_at,
    };
  });

  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.orderNumber.toLowerCase().includes(q) ||
        (r.trackingNumber?.toLowerCase().includes(q) ?? false) ||
        (r.carrier?.toLowerCase().includes(q) ?? false),
    );
  }

  const total = count ?? rows.length;
  return { rows, total, page, perPage, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getOrderFilterOptions() {
  const supabase = await createSupabaseServerClient();
  const [{ data: warehouses }, { data: customers }, { data: methods }] = await Promise.all([
    supabase.from("warehouses").select("id, name, code").eq("is_active", true).order("name"),
    supabase.from("customers").select("id, full_name, email").order("full_name").limit(200),
    supabase.from("shipping_methods").select("id, name, base_rate").eq("is_active", true).order("name"),
  ]);
  return {
    warehouses: warehouses ?? [],
    customers: (customers ?? []).map((c) => ({
      id: c.id,
      name: c.full_name ?? c.email ?? c.id.slice(0, 8),
    })),
    shippingMethods: methods ?? [],
  };
}

export async function getCustomerOrderHistory(customerId: string, excludeOrderId?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("orders")
    .select("id, order_number, status, grand_total, created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (excludeOrderId) query = query.neq("id", excludeOrderId);
  const { data } = await query;
  return data ?? [];
}

export async function getTrackingEvents(shipmentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("tracking_events")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("occurred_at", { ascending: false });
  return data ?? [];
}

export async function getVariantOptionsForOrder() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("product_variants")
    .select("id, name, sku, product_id, price")
    .order("name")
    .limit(500);
  const productIds = [...new Set((data ?? []).map((v) => v.product_id))];
  const { data: products } = productIds.length
    ? await supabase.from("products").select("id, name").in("id", productIds)
    : { data: [] };
  const pMap = new Map((products ?? []).map((p) => [p.id, p.name]));
  return (data ?? []).map((v) => ({
    id: v.id,
    name: `${pMap.get(v.product_id) ?? "Product"} — ${v.name}`,
    sku: v.sku,
    price: v.price ?? 0,
    productId: v.product_id,
  }));
}
