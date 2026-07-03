"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import type { ShipmentStatus, Json } from "@/lib/supabase/database.types";
import { shipmentInputSchema, trackingEventSchema, fieldErrorsFrom, type ShipmentInput } from "./order-schema";
import { updateOrderStatus } from "./order-actions";

export interface ShipmentActionResult {
  ok: boolean;
  error: string | null;
  id?: string;
  fieldErrors?: Record<string, string>;
}

async function guard() {
  await requirePermission(PERMISSIONS.ORDERS_MANAGE);
}

function revalidate(orderId?: string) {
  revalidatePath("/admin/shipments");
  revalidatePath("/admin/orders");
  if (orderId) revalidatePath(`/admin/orders/${orderId}`);
}

async function logShipmentEvent(orderId: string, message: string, metadata: Record<string, unknown> = {}) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  await supabase.from("order_events").insert({
    order_id: orderId,
    type: "shipment",
    message,
    metadata: metadata as Json,
    created_by: user?.id ?? null,
  });
}

export async function createShipment(raw: ShipmentInput): Promise<ShipmentActionResult> {
  await guard();
  const parsed = shipmentInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  const d = parsed.data;

  const { data: existing } = await supabase.from("shipments").select("id").eq("order_id", d.order_id).maybeSingle();
  if (existing) return { ok: false, error: "Shipment already exists for this order." };

  const { data: shipment, error } = await supabase
    .from("shipments")
    .insert({
      order_id: d.order_id,
      warehouse_id: d.warehouse_id,
      shipping_method_id: d.shipping_method_id,
      carrier: d.carrier,
      tracking_number: d.tracking_number,
      weight_grams: d.weight_grams ?? null,
      dimensions: d.dimensions ?? {},
      estimated_delivery: d.estimated_delivery,
      status: d.tracking_number ? "label_created" : "pending",
    })
    .select("id")
    .single();
  if (error || !shipment) return { ok: false, error: error?.message ?? "Failed to create shipment." };

  if (d.warehouse_id) {
    await supabase.from("orders").update({ warehouse_id: d.warehouse_id, updated_at: new Date().toISOString() }).eq("id", d.order_id);
  }
  if (d.shipping_method_id) {
    await supabase.from("orders").update({ shipping_method_id: d.shipping_method_id, updated_at: new Date().toISOString() }).eq("id", d.order_id);
  }

  await logShipmentEvent(d.order_id, "Shipment created.", { shipment_id: shipment.id });
  await supabase.rpc("log_audit", {
    p_table: "shipments",
    p_record: shipment.id,
    p_action: "create",
    p_new: { order_id: d.order_id, tracking_number: d.tracking_number },
  });

  revalidate(d.order_id);
  return { ok: true, error: null, id: shipment.id };
}

export async function updateShipment(
  shipmentId: string,
  patch: Partial<Omit<ShipmentInput, "order_id">> & { status?: ShipmentStatus },
): Promise<ShipmentActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();

  const { data: current } = await supabase.from("shipments").select("order_id").eq("id", shipmentId).maybeSingle();
  if (!current) return { ok: false, error: "Shipment not found." };

  const { error } = await supabase
    .from("shipments")
    .update({
      warehouse_id: patch.warehouse_id,
      shipping_method_id: patch.shipping_method_id,
      carrier: patch.carrier,
      tracking_number: patch.tracking_number,
      weight_grams: patch.weight_grams,
      dimensions: patch.dimensions,
      estimated_delivery: patch.estimated_delivery,
      status: patch.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shipmentId);
  if (error) return { ok: false, error: error.message };

  await logShipmentEvent(current.order_id, "Shipment updated.", { shipment_id: shipmentId });
  await supabase.rpc("log_audit", {
    p_table: "shipments",
    p_record: shipmentId,
    p_action: "update",
    p_new: patch as Json,
  });

  revalidate(current.order_id);
  return { ok: true, error: null, id: shipmentId };
}

export async function addTrackingEvent(input: {
  shipment_id: string;
  status: ShipmentStatus;
  message?: string | null;
  location?: string | null;
}): Promise<ShipmentActionResult> {
  await guard();
  const parsed = trackingEventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid event." };

  const supabase = await createSupabaseServerClient();
  const { data: shipment } = await supabase.from("shipments").select("order_id").eq("id", parsed.data.shipment_id).maybeSingle();
  if (!shipment) return { ok: false, error: "Shipment not found." };

  const { data: event, error: eventErr } = await supabase
    .from("tracking_events")
    .insert({
      shipment_id: parsed.data.shipment_id,
      status: parsed.data.status,
      message: parsed.data.message,
      location: parsed.data.location,
    })
    .select("id")
    .single();
  if (eventErr) return { ok: false, error: eventErr.message };

  const shipmentPatch: {
    status: ShipmentStatus;
    updated_at: string;
    delivered_at?: string;
    shipped_at?: string;
  } = { status: parsed.data.status, updated_at: new Date().toISOString() };
  if (parsed.data.status === "delivered") {
    shipmentPatch.delivered_at = new Date().toISOString();
    await updateOrderStatus(shipment.order_id, "delivered");
  }
  if (parsed.data.status === "in_transit") {
    shipmentPatch.shipped_at = new Date().toISOString();
  }

  await supabase.from("shipments").update(shipmentPatch).eq("id", parsed.data.shipment_id);

  await logShipmentEvent(shipment.order_id, parsed.data.message ?? `Tracking: ${parsed.data.status}`, {
    event_id: event?.id,
    status: parsed.data.status,
    location: parsed.data.location,
  });
  await supabase.rpc("log_audit", {
    p_table: "tracking_events",
    p_record: event?.id,
    p_action: "create",
    p_new: { shipment_id: parsed.data.shipment_id, status: parsed.data.status },
  });

  revalidate(shipment.order_id);
  return { ok: true, error: null, id: event?.id };
}

export async function shipOrder(orderId: string, shipmentId: string): Promise<ShipmentActionResult> {
  await guard();
  const statusResult = await updateOrderStatus(orderId, "shipped");
  if (!statusResult.ok) return statusResult;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("shipments")
    .update({ status: "in_transit", shipped_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", shipmentId);

  revalidate(orderId);
  return { ok: true, error: null, id: shipmentId };
}
