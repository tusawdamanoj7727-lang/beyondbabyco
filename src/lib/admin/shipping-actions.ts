"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import type { Database, Json, ShipmentStatus } from "@/lib/supabase/database.types";
import { getCarrierAdapter } from "./carrier-adapters";
import {
  bulkIdsSchema,
  carrierInputSchema,
  ndrInputSchema,
  ndrResolveSchema,
  pickupInputSchema,
  rateInputSchema,
  zoneInputSchema,
} from "./shipping-schema";
import type { CarrierProvider } from "./shipping-types";

export interface ShippingActionResult {
  ok: boolean;
  error: string | null;
  id?: string;
  fieldErrors?: Record<string, string>;
}

async function guard() {
  await requirePermission(PERMISSIONS.SHIPPING_MANAGE);
}

function revalidateAll() {
  revalidatePath("/admin/shipping");
  revalidatePath("/admin/shipping/carriers");
  revalidatePath("/admin/shipping/zones");
  revalidatePath("/admin/shipping/rates");
  revalidatePath("/admin/shipments");
}

function encPlaceholder(value: string | null | undefined) {
  if (!value) return null;
  return `enc:${value}`;
}

async function audit(table: string, record: string, action: string, payload?: Record<string, unknown>) {
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("log_audit", {
    p_table: table,
    p_record: record,
    p_action: action,
    p_new: (payload ?? {}) as Json,
  });
}

async function addTracking(
  shipmentId: string,
  status: ShipmentStatus,
  message: string,
  eventType: string,
  raw: Record<string, unknown> = {},
) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("tracking_events").insert({
    shipment_id: shipmentId,
    status,
    message,
    event_type: eventType,
    raw: raw as Json,
  });
}

// --------------------------- Carriers ---------------------------

export async function createCarrier(input: {
  name: string;
  provider: string;
  api_key?: string | null;
  api_secret?: string | null;
  sandbox?: boolean;
  is_active?: boolean;
}): Promise<ShippingActionResult> {
  await guard();
  const parsed = carrierInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shipping_carriers")
    .insert({
      name: parsed.data.name,
      provider: parsed.data.provider,
      api_key_encrypted: encPlaceholder(parsed.data.api_key),
      api_secret_encrypted: encPlaceholder(parsed.data.api_secret),
      sandbox: parsed.data.sandbox,
      is_active: parsed.data.is_active,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await audit("shipping_carriers", data.id, "create");
  revalidateAll();
  return { ok: true, error: null, id: data.id };
}

export async function updateCarrier(
  id: string,
  input: {
    name: string;
    provider: string;
    api_key?: string | null;
    api_secret?: string | null;
    sandbox?: boolean;
    is_active?: boolean;
  },
): Promise<ShippingActionResult> {
  await guard();
  const parsed = carrierInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createSupabaseServerClient();
  const patch: Database["public"]["Tables"]["shipping_carriers"]["Update"] = {
    name: parsed.data.name,
    provider: parsed.data.provider,
    sandbox: parsed.data.sandbox,
    is_active: parsed.data.is_active,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.api_key) patch.api_key_encrypted = encPlaceholder(parsed.data.api_key);
  if (parsed.data.api_secret) patch.api_secret_encrypted = encPlaceholder(parsed.data.api_secret);

  const { error } = await supabase.from("shipping_carriers").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await audit("shipping_carriers", id, "update");
  revalidateAll();
  return { ok: true, error: null, id };
}

export async function deleteCarrier(id: string): Promise<ShippingActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("shipping_carriers")
    .update({ deleted_at: new Date().toISOString(), is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("shipping_carriers", id, "delete");
  revalidateAll();
  return { ok: true, error: null, id };
}

// --------------------------- Zones ---------------------------

export async function createZone(input: z.infer<typeof zoneInputSchema>): Promise<ShippingActionResult> {
  await guard();
  const parsed = zoneInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid zone." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("shipping_zones").insert({
    name: parsed.data.name,
    country: parsed.data.country,
    state: parsed.data.state,
    city: parsed.data.city,
    postal_from: parsed.data.postal_from,
    postal_to: parsed.data.postal_to,
    priority: parsed.data.priority,
    is_active: parsed.data.is_active,
  }).select("id").single();
  if (error) return { ok: false, error: error.message };

  await audit("shipping_zones", data.id, "create");
  revalidateAll();
  return { ok: true, error: null, id: data.id };
}

export async function updateZone(id: string, input: z.infer<typeof zoneInputSchema>): Promise<ShippingActionResult> {
  await guard();
  const parsed = zoneInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid zone." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("shipping_zones").update({
    name: parsed.data.name,
    country: parsed.data.country,
    state: parsed.data.state,
    city: parsed.data.city,
    postal_from: parsed.data.postal_from,
    postal_to: parsed.data.postal_to,
    priority: parsed.data.priority,
    is_active: parsed.data.is_active,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await audit("shipping_zones", id, "update");
  revalidateAll();
  return { ok: true, error: null, id };
}

export async function deleteZone(id: string): Promise<ShippingActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("shipping_zones").update({ deleted_at: new Date().toISOString(), is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("shipping_zones", id, "delete");
  revalidateAll();
  return { ok: true, error: null, id };
}

// --------------------------- Rates ---------------------------

export async function createRate(input: z.infer<typeof rateInputSchema>): Promise<ShippingActionResult> {
  await guard();
  const parsed = rateInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid rate." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("shipping_rates").insert({
    zone_id: parsed.data.zone_id,
    name: parsed.data.name,
    weight_min_grams: parsed.data.weight_min_grams,
    weight_max_grams: parsed.data.weight_max_grams ?? null,
    price: parsed.data.price,
    free_shipping_threshold: parsed.data.free_shipping_threshold ?? null,
    cod_charge: parsed.data.cod_charge,
    is_active: parsed.data.is_active,
  }).select("id").single();
  if (error) return { ok: false, error: error.message };

  await audit("shipping_rates", data.id, "create");
  revalidateAll();
  return { ok: true, error: null, id: data.id };
}

export async function updateRate(id: string, input: z.infer<typeof rateInputSchema>): Promise<ShippingActionResult> {
  await guard();
  const parsed = rateInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid rate." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("shipping_rates").update({
    zone_id: parsed.data.zone_id,
    name: parsed.data.name,
    weight_min_grams: parsed.data.weight_min_grams,
    weight_max_grams: parsed.data.weight_max_grams ?? null,
    price: parsed.data.price,
    free_shipping_threshold: parsed.data.free_shipping_threshold ?? null,
    cod_charge: parsed.data.cod_charge,
    is_active: parsed.data.is_active,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await audit("shipping_rates", id, "update");
  revalidateAll();
  return { ok: true, error: null, id };
}

export async function deleteRate(id: string): Promise<ShippingActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("shipping_rates").update({ deleted_at: new Date().toISOString(), is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("shipping_rates", id, "delete");
  revalidateAll();
  return { ok: true, error: null, id };
}

// --------------------------- Shipment actions ---------------------------

export async function generateShippingLabel(shipmentId: string, carrierId?: string): Promise<ShippingActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();

  const { data: shipment } = await supabase.from("shipments").select("*").eq("id", shipmentId).maybeSingle();
  if (!shipment) return { ok: false, error: "Shipment not found." };

  const resolvedCarrierId = carrierId ?? shipment.carrier_id;
  let provider: CarrierProvider = "custom";
  let carrierName = shipment.carrier ?? "Custom";

  if (resolvedCarrierId) {
    const { data: carrier } = await supabase.from("shipping_carriers").select("name, provider").eq("id", resolvedCarrierId).maybeSingle();
    if (carrier) {
      provider = carrier.provider as CarrierProvider;
      carrierName = carrier.name;
    }
  }

  const [{ data: order }, { data: address }] = await Promise.all([
    supabase.from("orders").select("id, order_number, grand_total").eq("id", shipment.order_id).maybeSingle(),
    supabase.from("shipping_addresses").select("full_name, phone, line1, city, state, pincode").eq("order_id", shipment.order_id).maybeSingle(),
  ]);
  if (!order || !address) return { ok: false, error: "Order or shipping address missing." };

  const adapter = getCarrierAdapter(provider);
  const result = await adapter.createShipment({
    orderId: order.id,
    orderNumber: order.order_number,
    weightGrams: shipment.weight_grams,
    dimensions: (shipment.dimensions as Record<string, unknown>) ?? {},
    destination: {
      name: address.full_name,
      phone: address.phone,
      line1: address.line1,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    },
  });

  const { error } = await supabase.from("shipments").update({
    carrier_id: resolvedCarrierId,
    carrier: carrierName,
    tracking_number: result.trackingNumber,
    label_url: result.labelUrl,
    status: "label_created",
    updated_at: new Date().toISOString(),
  }).eq("id", shipmentId);
  if (error) return { ok: false, error: error.message };

  await addTracking(shipmentId, "label_created", "Shipping label generated.", "status", result.raw ?? {});
  await audit("shipments", shipmentId, "generate_label", { tracking_number: result.trackingNumber });
  revalidateAll();
  return { ok: true, error: null, id: shipmentId };
}

export async function reprintShippingLabel(shipmentId: string): Promise<ShippingActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { data: shipment } = await supabase.from("shipments").select("tracking_number, carrier_id, label_url").eq("id", shipmentId).maybeSingle();
  if (!shipment?.tracking_number) return { ok: false, error: "No tracking number on shipment." };

  let provider: CarrierProvider = "custom";
  if (shipment.carrier_id) {
    const { data: carrier } = await supabase.from("shipping_carriers").select("provider").eq("id", shipment.carrier_id).maybeSingle();
    if (carrier) provider = carrier.provider as CarrierProvider;
  }

  const adapter = getCarrierAdapter(provider);
  const { labelUrl } = await adapter.reprintLabel(shipment.tracking_number);

  await supabase.from("shipments").update({ label_url: labelUrl, updated_at: new Date().toISOString() }).eq("id", shipmentId);
  await audit("shipments", shipmentId, "reprint_label");
  revalidateAll();
  return { ok: true, error: null, id: shipmentId };
}

export async function cancelShippingShipment(shipmentId: string): Promise<ShippingActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { data: shipment } = await supabase.from("shipments").select("tracking_number, carrier_id, status").eq("id", shipmentId).maybeSingle();
  if (!shipment) return { ok: false, error: "Shipment not found." };
  if (shipment.status === "delivered") return { ok: false, error: "Cannot cancel a delivered shipment." };

  if (shipment.tracking_number && shipment.carrier_id) {
    const { data: carrier } = await supabase.from("shipping_carriers").select("provider").eq("id", shipment.carrier_id).maybeSingle();
    if (carrier) {
      await getCarrierAdapter(carrier.provider as CarrierProvider).cancelShipment(shipment.tracking_number);
    }
  }

  await supabase.from("shipments").update({
    status: "returned",
    cancelled_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", shipmentId);

  await addTracking(shipmentId, "returned", "Shipment cancelled.", "returned");
  await audit("shipments", shipmentId, "cancel");
  revalidateAll();
  return { ok: true, error: null, id: shipmentId };
}

export async function scheduleShipmentPickup(input: {
  carrier_id?: string | null;
  warehouse_id?: string | null;
  pickup_date: string;
  notes?: string | null;
}): Promise<ShippingActionResult> {
  await guard();
  const parsed = pickupInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid pickup." };

  const supabase = await createSupabaseServerClient();
  let reference: string | null = null;

  if (parsed.data.carrier_id) {
    const [{ data: carrier }, { data: warehouse }] = await Promise.all([
      supabase.from("shipping_carriers").select("provider, name").eq("id", parsed.data.carrier_id).maybeSingle(),
      parsed.data.warehouse_id
        ? supabase.from("warehouses").select("name").eq("id", parsed.data.warehouse_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    if (carrier) {
      const result = await getCarrierAdapter(carrier.provider as CarrierProvider).schedulePickup({
        warehouseName: warehouse?.name ?? "Warehouse",
        pickupDate: parsed.data.pickup_date,
      });
      reference = result.reference;
    }
  }

  const { data, error } = await supabase.from("pickup_requests").insert({
    carrier_id: parsed.data.carrier_id,
    warehouse_id: parsed.data.warehouse_id,
    pickup_date: parsed.data.pickup_date,
    status: reference ? "scheduled" : "pending",
    reference,
    notes: parsed.data.notes,
  }).select("id").single();
  if (error) return { ok: false, error: error.message };

  await audit("pickup_requests", data.id, "create", { reference });
  revalidateAll();
  return { ok: true, error: null, id: data.id };
}

// --------------------------- NDR ---------------------------

export async function createNdrEvent(input: {
  shipment_id: string;
  reason: string;
  notes?: string | null;
  scheduled_at?: string | null;
}): Promise<ShippingActionResult> {
  await guard();
  const parsed = ndrInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid NDR." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("ndr_events").insert({
    shipment_id: parsed.data.shipment_id,
    reason: parsed.data.reason,
    notes: parsed.data.notes,
    scheduled_at: parsed.data.scheduled_at,
    status: parsed.data.reason === "rto" ? "rto" : "open",
  }).select("id").single();
  if (error) return { ok: false, error: error.message };

  await addTracking(parsed.data.shipment_id, "failed", `NDR: ${parsed.data.reason}`, "ndr", { reason: parsed.data.reason });
  if (parsed.data.reason === "rto") {
    await supabase.from("shipments").update({ status: "returned", updated_at: new Date().toISOString() }).eq("id", parsed.data.shipment_id);
  } else {
    await supabase.from("shipments").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", parsed.data.shipment_id);
  }

  await audit("ndr_events", data.id, "create");
  revalidateAll();
  return { ok: true, error: null, id: data.id };
}

export async function resolveNdrEvent(input: { id: string; status: string; notes?: string | null }): Promise<ShippingActionResult> {
  await guard();
  const parsed = ndrResolveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid NDR update." };

  const supabase = await createSupabaseServerClient();
  const { data: ndr } = await supabase.from("ndr_events").select("shipment_id").eq("id", parsed.data.id).maybeSingle();
  if (!ndr) return { ok: false, error: "NDR not found." };

  const { error } = await supabase.from("ndr_events").update({
    status: parsed.data.status,
    notes: parsed.data.notes,
    resolved_at: parsed.data.status !== "open" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };

  await audit("ndr_events", parsed.data.id, "update", { status: parsed.data.status });
  revalidateAll();
  return { ok: true, error: null, id: parsed.data.id };
}

export async function bulkDeleteCarriers(ids: string[]): Promise<ShippingActionResult> {
  const parsed = bulkIdsSchema.safeParse({ ids });
  if (!parsed.success) return { ok: false, error: "No items selected." };
  for (const id of parsed.data.ids) {
    const res = await deleteCarrier(id);
    if (!res.ok) return res;
  }
  return { ok: true, error: null };
}