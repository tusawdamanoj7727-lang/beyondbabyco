import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  RETURN_SORTABLE_COLUMNS,
  type RefundStatus,
  type ReturnDashboard,
  type ReturnDetail,
  type ReturnItemRow,
  type ReturnListItem,
  type ReturnReason,
  type ReturnSortColumn,
  type ReturnStatus,
  type ReturnTimelineEvent,
} from "./return-types";

export { RETURN_SORTABLE_COLUMNS, type ReturnSortColumn };

export interface ReturnListParams {
  search?: string;
  status?: ReturnStatus | "all";
  reason?: ReturnReason | "all";
  refundStatus?: RefundStatus | "all";
  warehouseId?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: ReturnSortColumn;
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface ReturnListResult {
  rows: ReturnListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

function startOfMonthIso() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getReturnDashboard(): Promise<ReturnDashboard> {
  const supabase = await createSupabaseServerClient();
  const monthStart = startOfMonthIso();

  const [{ data: returns }, { data: orders }] = await Promise.all([
    supabase.from("returns").select("id, status, refund_status, created_at"),
    supabase.from("orders").select("id, created_at").gte("created_at", monthStart),
  ]);

  const rows = returns ?? [];
  const monthReturns = rows.filter((r) => r.created_at >= monthStart);
  const orderCount = orders?.length ?? 0;
  const rate = orderCount ? Math.round((monthReturns.length / orderCount) * 1000) / 10 : 0;

  return {
    pendingReturns: rows.filter((r) => r.status === "requested").length,
    awaitingInspection: rows.filter((r) => ["received", "inspection"].includes(r.status)).length,
    refundQueue: rows.filter((r) => r.status === "refund_approved").length,
    completedReturns: rows.filter((r) => r.status === "closed").length,
    returnRate: rate,
    refundsPending: rows.filter((r) => r.refund_status === "pending").length,
    refundsApproved: rows.filter((r) => ["full", "partial", "store_credit", "gift_card"].includes(String(r.refund_status))).length,
    refundsRejected: rows.filter((r) => r.status === "rejected").length,
    refundsCompleted: rows.filter((r) => r.refund_status === "refunded" || r.refund_status === "full").length,
  };
}

export async function listReturns(params: ReturnListParams): Promise<ReturnListResult> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(5, params.perPage ?? 20));
  const sort = params.sort ?? "created_at";
  const dir = params.dir === "asc";

  let query = supabase.from("returns").select("*", { count: "exact" });
  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.reason && params.reason !== "all") query = query.eq("reason", params.reason);
  if (params.refundStatus && params.refundStatus !== "all") query = query.eq("refund_status", params.refundStatus);
  if (params.warehouseId) query = query.eq("warehouse_id", params.warehouseId);
  if (params.customerId) query = query.eq("customer_id", params.customerId);
  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo);

  const dbSort = ["rma_number", "status", "reason", "created_at"].includes(sort) ? sort : "created_at";
  query = query.order(dbSort, { ascending: dir });

  const from = (page - 1) * perPage;
  const { data, count, error } = await query.range(from, from + perPage - 1);
  if (error) throw error;

  const returnIds = (data ?? []).map((r) => r.id);
  const orderIds = [...new Set((data ?? []).map((r) => r.order_id))];
  const customerIds = [...new Set((data ?? []).map((r) => r.customer_id).filter(Boolean))] as string[];
  const warehouseIds = [...new Set((data ?? []).map((r) => r.warehouse_id).filter(Boolean))] as string[];

  const [{ data: orders }, { data: customers }, { data: warehouses }, { data: itemCounts }] = await Promise.all([
    orderIds.length ? supabase.from("orders").select("id, order_number").in("id", orderIds) : Promise.resolve({ data: [] }),
    customerIds.length ? supabase.from("customers").select("id, full_name, email").in("id", customerIds) : Promise.resolve({ data: [] }),
    warehouseIds.length ? supabase.from("warehouses").select("id, name").in("id", warehouseIds) : Promise.resolve({ data: [] }),
    returnIds.length ? supabase.from("return_items").select("return_id, quantity").in("return_id", returnIds) : Promise.resolve({ data: [] }),
  ]);

  const oMap = new Map((orders ?? []).map((o) => [o.id, o]));
  const cMap = new Map((customers ?? []).map((c) => [c.id, c]));
  const wMap = new Map((warehouses ?? []).map((w) => [w.id, w]));
  const qtyMap = new Map<string, number>();
  for (const i of itemCounts ?? []) qtyMap.set(i.return_id, (qtyMap.get(i.return_id) ?? 0) + i.quantity);

  let rows: ReturnListItem[] = (data ?? []).map((r) => {
    const order = oMap.get(r.order_id);
    const customer = r.customer_id ? cMap.get(r.customer_id) : undefined;
    const warehouse = r.warehouse_id ? wMap.get(r.warehouse_id) : undefined;
    return {
      id: r.id,
      rmaNumber: r.rma_number,
      orderId: r.order_id,
      orderNumber: order?.order_number ?? "—",
      customerId: r.customer_id,
      customerName: customer?.full_name ?? customer?.email ?? "Guest",
      itemCount: qtyMap.get(r.id) ?? 0,
      reason: r.reason as ReturnReason,
      status: r.status as ReturnStatus,
      refundStatus: r.refund_status as RefundStatus,
      warehouseName: warehouse?.name ?? null,
      warehouseId: r.warehouse_id,
      createdAt: r.created_at,
    };
  });

  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.rmaNumber.toLowerCase().includes(q) ||
        r.orderNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q),
    );
  }

  const total = count ?? rows.length;
  return { rows, total, page, perPage, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getReturnDetail(id: string): Promise<ReturnDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: r } = await supabase.from("returns").select("*").eq("id", id).maybeSingle();
  if (!r) return null;

  const [{ data: items }, { data: order }, { data: customer }, { data: warehouse }, { data: payment }, { data: shipment }, { data: inspector }] =
    await Promise.all([
      supabase.from("return_items").select("*").eq("return_id", id).order("created_at"),
      supabase.from("orders").select("id, order_number, customer_id, warehouse_id").eq("id", r.order_id).maybeSingle(),
      r.customer_id
        ? supabase.from("customers").select("id, full_name, email").eq("id", r.customer_id).maybeSingle()
        : Promise.resolve({ data: null }),
      r.warehouse_id
        ? supabase.from("warehouses").select("id, name").eq("id", r.warehouse_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("payments").select("id, status, amount").eq("order_id", r.order_id).order("created_at", { ascending: false }).limit(1),
      supabase.from("shipments").select("id, tracking_number, status").eq("order_id", r.order_id).order("created_at", { ascending: false }).limit(1),
      r.inspector_id
        ? supabase.from("profiles").select("full_name").eq("id", r.inspector_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  return {
    id: r.id,
    rmaNumber: r.rma_number,
    orderId: r.order_id,
    orderNumber: order?.order_number ?? "—",
    customerId: r.customer_id,
    customerName: customer?.full_name ?? customer?.email ?? "Guest",
    customerEmail: customer?.email ?? null,
    warehouseId: r.warehouse_id,
    warehouseName: warehouse?.name ?? null,
    status: r.status as ReturnStatus,
    reason: r.reason as ReturnReason,
    refundStatus: r.refund_status as RefundStatus,
    refundType: r.refund_type as ReturnDetail["refundType"],
    refundAmount: r.refund_amount,
    inspectionNotes: r.inspection_notes,
    inspectorName: inspector?.full_name ?? null,
    internalNotes: r.internal_notes,
    restockCompleted: r.restock_completed ?? false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    closedAt: r.closed_at,
    items: (items ?? []).map(mapReturnItem),
    payment: payment?.[0] ? { id: payment[0].id, status: payment[0].status, amount: payment[0].amount } : null,
    shipment: shipment?.[0]
      ? { id: shipment[0].id, trackingNumber: shipment[0].tracking_number, status: shipment[0].status }
      : null,
  };
}

function mapReturnItem(i: {
  id: string;
  order_item_id: string | null;
  product_id: string | null;
  product_variant_id: string | null;
  name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  condition: string | null;
  restock_decision: string | null;
  damage_level: string | null;
  inspection_photos: unknown;
  inspector_notes: string | null;
  restocked: boolean;
}): ReturnItemRow {
  const photos = Array.isArray(i.inspection_photos) ? (i.inspection_photos as string[]) : [];
  return {
    id: i.id,
    orderItemId: i.order_item_id,
    productId: i.product_id,
    variantId: i.product_variant_id,
    name: i.name,
    sku: i.sku,
    quantity: i.quantity,
    unitPrice: i.unit_price,
    condition: i.condition,
    restockDecision: i.restock_decision as ReturnItemRow["restockDecision"],
    damageLevel: i.damage_level as ReturnItemRow["damageLevel"],
    inspectionPhotos: photos,
    inspectorNotes: i.inspector_notes,
    restocked: i.restocked,
  };
}

export async function getReturnTimeline(returnId: string): Promise<ReturnTimelineEvent[]> {
  const supabase = await createSupabaseServerClient();
  const { data: events } = await supabase
    .from("return_events")
    .select("id, type, message, metadata, created_by, created_at")
    .eq("return_id", returnId)
    .order("created_at", { ascending: false });

  const userIds = [...new Set((events ?? []).map((e) => e.created_by).filter(Boolean))] as string[];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };
  const uMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (events ?? []).map((e) => ({
    id: e.id,
    type: e.type,
    message: e.message,
    metadata: (e.metadata as Record<string, unknown>) ?? {},
    userName: e.created_by ? uMap.get(e.created_by) ?? null : null,
    createdAt: e.created_at,
  }));
}

export async function getReturnFilterOptions() {
  const supabase = await createSupabaseServerClient();
  const [{ data: warehouses }, { data: customers }] = await Promise.all([
    supabase.from("warehouses").select("id, name, code").eq("is_active", true).order("name"),
    supabase.from("customers").select("id, full_name, email").is("deleted_at", null).order("full_name").limit(200),
  ]);
  return {
    warehouses: warehouses ?? [],
    customers: (customers ?? []).map((c) => ({ id: c.id, name: c.full_name ?? c.email ?? c.id.slice(0, 8) })),
  };
}

export async function getOrderItemsForReturn(orderId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase.from("orders").select("id, customer_id, warehouse_id, order_number").eq("id", orderId).maybeSingle();
  if (!order) return null;
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", orderId);
  return { order, items: items ?? [] };
}
