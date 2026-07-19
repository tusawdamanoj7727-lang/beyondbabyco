import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ShipmentStatus } from "@/lib/supabase/database.types";
import type {
  CarrierDetail,
  CarrierListItem,
  CarrierProvider,
  NdrListItem,
  NdrReason,
  NdrStatus,
  PickupListItem,
  PickupStatus,
  RateListItem,
  ShipmentLogisticsItem,
  ShippingDashboard,
  TrackingEventItem,
  ZoneListItem,
} from "./shipping-types";

export interface ShipmentListParams {
  search?: string;
  status?: ShipmentStatus | "all";
  warehouseId?: string;
  page?: number;
  perPage?: number;
}

export interface ListResult<T> {
  rows: T[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function getShippingDashboard(): Promise<ShippingDashboard> {
  const supabase = await createSupabaseServerClient();
  const today = todayIsoDate();

  const [{ data: shipments }, { data: pickups }, { data: ndrs }] = await Promise.all([
    supabase.from("shipments").select("id, status, tracking_number"),
    supabase.from("pickup_requests").select("id, pickup_date, status").eq("pickup_date", today),
    supabase.from("ndr_events").select("id, status"),
  ]);

  const shipRows = shipments ?? [];
  const openStatuses = new Set(["pending", "label_created", "in_transit", "out_for_delivery"]);
  return {
    pendingShipments: shipRows.filter((s) => s.status === "pending").length,
    readyToShip: shipRows.filter((s) => ["pending", "label_created"].includes(s.status)).length,
    todaysPickups: (pickups ?? []).filter((p) => p.status !== "cancelled").length,
    failedDeliveries: shipRows.filter((s) => s.status === "failed").length,
    deliveredShipments: shipRows.filter((s) => s.status === "delivered").length,
    missingAwb: shipRows.filter(
      (s) => openStatuses.has(s.status) && (!s.tracking_number || !String(s.tracking_number).trim()),
    ).length,
    ndrCount: (ndrs ?? []).filter((n) => n.status === "open").length,
    rtoCount: (ndrs ?? []).filter((n) => n.status === "rto").length,
  };
}

export async function listShippingShipments(params: ShipmentListParams): Promise<ListResult<ShipmentLogisticsItem>> {
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

  const [{ data: orders }, { data: warehouses }] = await Promise.all([
    orderIds.length ? supabase.from("orders").select("id, order_number, customer_id").in("id", orderIds) : Promise.resolve({ data: [] }),
    warehouseIds.length ? supabase.from("warehouses").select("id, name").in("id", warehouseIds) : Promise.resolve({ data: [] }),
  ]);

  const customerIds = [...new Set((orders ?? []).map((o) => o.customer_id).filter(Boolean))] as string[];
  const { data: customers } = customerIds.length
    ? await supabase.from("customers").select("id, full_name, email").in("id", customerIds)
    : { data: [] };

  const oMap = new Map((orders ?? []).map((o) => [o.id, o]));
  const cMap = new Map((customers ?? []).map((c) => [c.id, c]));
  const wMap = new Map((warehouses ?? []).map((w) => [w.id, w]));

  let rows: ShipmentLogisticsItem[] = (data ?? []).map((s) => {
    const order = oMap.get(s.order_id);
    const customer = order?.customer_id ? cMap.get(order.customer_id) : undefined;
    return {
      id: s.id,
      orderId: s.order_id,
      orderNumber: order?.order_number ?? "—",
      customerName: customer?.full_name ?? customer?.email ?? "Guest",
      carrier: s.carrier,
      carrierId: s.carrier_id ?? null,
      trackingNumber: s.tracking_number,
      labelUrl: s.label_url ?? null,
      status: s.status,
      warehouseName: s.warehouse_id ? wMap.get(s.warehouse_id)?.name ?? null : null,
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

export async function getTracking(shipmentId: string): Promise<TrackingEventItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("tracking_events")
    .select("id, shipment_id, status, event_type, message, location, occurred_at")
    .eq("shipment_id", shipmentId)
    .order("occurred_at", { ascending: false });

  return (data ?? []).map((e) => ({
    id: e.id,
    shipmentId: e.shipment_id,
    status: e.status,
    eventType: e.event_type ?? "status",
    message: e.message,
    location: e.location,
    occurredAt: e.occurred_at,
  }));
}

export async function listCarriers(): Promise<CarrierListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("shipping_carriers")
    .select("id, name, provider, sandbox, is_active, updated_at")
    .is("deleted_at", null)
    .order("name");
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    provider: c.provider as CarrierProvider,
    sandbox: c.sandbox,
    isActive: c.is_active,
    updatedAt: c.updated_at,
  }));
}

export async function getCarrierDetail(id: string): Promise<CarrierDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: c } = await supabase.from("shipping_carriers").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    provider: c.provider as CarrierProvider,
    sandbox: c.sandbox,
    isActive: c.is_active,
    hasApiKey: !!c.api_key_encrypted,
    hasApiSecret: !!c.api_secret_encrypted,
    updatedAt: c.updated_at,
    createdAt: c.created_at,
  };
}

export async function listZones(): Promise<ZoneListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("shipping_zones")
    .select("*")
    .is("deleted_at", null)
    .order("priority", { ascending: false });
  return (data ?? []).map((z) => ({
    id: z.id,
    name: z.name,
    country: z.country,
    state: z.state,
    city: z.city,
    postalFrom: z.postal_from,
    postalTo: z.postal_to,
    priority: z.priority,
    isActive: z.is_active,
    updatedAt: z.updated_at,
  }));
}

export async function listRates(zoneId?: string): Promise<RateListItem[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("shipping_rates").select("*").is("deleted_at", null).order("weight_min_grams");
  if (zoneId) query = query.eq("zone_id", zoneId);
  const { data: rates } = await query;
  if (!rates?.length) return [];

  const zoneIds = [...new Set(rates.map((r) => r.zone_id))];
  const { data: zones } = await supabase.from("shipping_zones").select("id, name").in("id", zoneIds);
  const zMap = new Map((zones ?? []).map((z) => [z.id, z.name]));

  return rates.map((r) => ({
    id: r.id,
    zoneId: r.zone_id,
    zoneName: zMap.get(r.zone_id) ?? "—",
    name: r.name,
    weightMinGrams: r.weight_min_grams,
    weightMaxGrams: r.weight_max_grams,
    price: r.price,
    freeShippingThreshold: r.free_shipping_threshold,
    codCharge: r.cod_charge,
    isActive: r.is_active,
    updatedAt: r.updated_at,
  }));
}

export async function listNdrEvents(limit = 50): Promise<NdrListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data: ndrs } = await supabase.from("ndr_events").select("*").order("created_at", { ascending: false }).limit(limit);
  if (!ndrs?.length) return [];

  const shipmentIds = ndrs.map((n) => n.shipment_id);
  const { data: shipments } = await supabase.from("shipments").select("id, order_id, tracking_number").in("id", shipmentIds);
  const orderIds = [...new Set((shipments ?? []).map((s) => s.order_id))];
  const { data: orders } = orderIds.length ? await supabase.from("orders").select("id, order_number").in("id", orderIds) : { data: [] };

  const sMap = new Map((shipments ?? []).map((s) => [s.id, s]));
  const oMap = new Map((orders ?? []).map((o) => [o.id, o.order_number]));

  return ndrs.map((n) => {
    const ship = sMap.get(n.shipment_id);
    return {
      id: n.id,
      shipmentId: n.shipment_id,
      orderNumber: ship ? oMap.get(ship.order_id) ?? "—" : "—",
      trackingNumber: ship?.tracking_number ?? null,
      reason: n.reason as NdrReason,
      status: n.status as NdrStatus,
      createdAt: n.created_at,
    };
  });
}

export async function listPickups(limit = 50): Promise<PickupListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("pickup_requests").select("*").order("pickup_date", { ascending: false }).limit(limit);
  if (!data?.length) return [];

  const carrierIds = [...new Set(data.map((p) => p.carrier_id).filter(Boolean))] as string[];
  const warehouseIds = [...new Set(data.map((p) => p.warehouse_id).filter(Boolean))] as string[];

  const [{ data: carriers }, { data: warehouses }] = await Promise.all([
    carrierIds.length ? supabase.from("shipping_carriers").select("id, name").in("id", carrierIds) : Promise.resolve({ data: [] }),
    warehouseIds.length ? supabase.from("warehouses").select("id, name").in("id", warehouseIds) : Promise.resolve({ data: [] }),
  ]);

  const cMap = new Map((carriers ?? []).map((c) => [c.id, c.name]));
  const wMap = new Map((warehouses ?? []).map((w) => [w.id, w.name]));

  return data.map((p) => ({
    id: p.id,
    carrierName: p.carrier_id ? cMap.get(p.carrier_id) ?? null : null,
    warehouseName: p.warehouse_id ? wMap.get(p.warehouse_id) ?? null : null,
    pickupDate: p.pickup_date,
    status: p.status as PickupStatus,
    reference: p.reference,
    createdAt: p.created_at,
  }));
}

export async function getShippingFilterOptions() {
  const supabase = await createSupabaseServerClient();
  const [{ data: warehouses }, { data: carriers }] = await Promise.all([
    supabase.from("warehouses").select("id, name, code").eq("is_active", true).order("name"),
    supabase.from("shipping_carriers").select("id, name, provider").is("deleted_at", null).eq("is_active", true).order("name"),
  ]);
  return { warehouses: warehouses ?? [], carriers: carriers ?? [], zones: await listZones() };
}
