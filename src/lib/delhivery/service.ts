import "server-only";

import type { Json, ShipmentStatus } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  cancelShipment as delhiveryCancel,
  checkServiceability,
  createShipment as delhiveryCreate,
  generateLabel,
  getWaybill,
  requestPickup,
  trackShipment,
} from "./client";
import { getDelhiveryConfig, requireDelhiveryConfig } from "./config";
import { mapDelhiveryStatus } from "./status-map";
import { onShipmentStatusChanged } from "@/lib/email/events/orders";
import type {
  DelhiveryApiError,
  DelhiveryCreateShipmentPayload,
  DelhiveryTrackingScan,
} from "./types";

export interface DelhiveryActionResult {
  ok: boolean;
  error: string | null;
  data?: Record<string, unknown>;
}

async function getLogClient() {
  try {
    return createSupabaseServiceClient();
  } catch {
    return await createSupabaseServerClient();
  }
}

async function logCourierCall(input: {
  action: string;
  orderId?: string | null;
  shipmentId?: string | null;
  requestUrl?: string;
  requestBody?: Record<string, unknown>;
  responseBody?: Record<string, unknown>;
  statusCode?: number;
  success: boolean;
  errorMessage?: string | null;
}) {
  try {
    const supabase = await getLogClient();
    await supabase.from("courier_logs").insert({
      courier_name: "delhivery",
      action: input.action,
      order_id: input.orderId ?? null,
      shipment_id: input.shipmentId ?? null,
      request_url: input.requestUrl ?? null,
      request_body: (input.requestBody ?? null) as Json,
      response_body: (input.responseBody ?? null) as Json,
      status_code: input.statusCode ?? null,
      success: input.success,
      error_message: input.errorMessage ?? null,
    });
  } catch {
    /* non-blocking */
  }
}

async function buildCreatePayload(
  orderId: string,
  opts?: {
    waybill?: string;
    weightGrams?: number;
    codAmount?: number;
    paymentMode?: "Prepaid" | "COD";
  },
): Promise<DelhiveryCreateShipmentPayload> {
  const config = requireDelhiveryConfig();
  // Service role: checkout writes shipping_addresses under service RLS; webhook/auto-fulfill
  // often has no customer session, so the cookie client cannot read the address.
  const supabase = createSupabaseServiceClient();

  const [{ data: order }, { data: address }, { data: items }] = await Promise.all([
    supabase.from("orders").select("id, order_number, grand_total").eq("id", orderId).single(),
    supabase
      .from("shipping_addresses")
      .select("full_name, phone, line1, line2, city, state, pincode, country")
      .eq("order_id", orderId)
      .maybeSingle(),
    supabase.from("order_items").select("name, quantity").eq("order_id", orderId),
  ]);

  if (!order || !address) throw new Error("Order or shipping address not found.");

  const phone = (address.phone ?? "").replace(/\D/g, "").slice(-10);
  if (phone.length !== 10) {
    throw new Error("Shipping phone must be a valid 10-digit Indian mobile number.");
  }
  const pin = String(address.pincode ?? "").replace(/\D/g, "");
  if (pin.length !== 6) {
    throw new Error("Shipping pincode must be a valid 6-digit PIN.");
  }
  const line = [address.line1, address.line2].filter(Boolean).join(", ").trim();
  if (!address.full_name?.trim() || !line || !address.city?.trim() || !address.state?.trim()) {
    throw new Error("Shipping address is incomplete for Delhivery.");
  }
  const paymentMode = opts?.paymentMode ?? (opts?.codAmount && opts.codAmount > 0 ? "COD" : "Prepaid");
  const productsDesc = (items ?? []).map((i) => i.name).join(", ").slice(0, 200);

  return {
    pickup_location: { name: config.pickupLocation },
    shipments: [
      {
        name: address.full_name.trim(),
        order: order.order_number,
        phone,
        add: line,
        pin,
        city: address.city.trim(),
        state: address.state.trim(),
        country: (address.country?.trim() || "India"),
        payment_mode: paymentMode,
        cod_amount: paymentMode === "COD" ? (opts?.codAmount ?? order.grand_total) : 0,
        total_amount: order.grand_total,
        weight: opts?.weightGrams ? opts.weightGrams / 1000 : 0.5,
        waybill: opts?.waybill,
        products_desc: productsDesc || "Baby care products",
        seller_name: "BeyondBabyCo",
        seller_gst_tin: "",
        hsn_code: "33049990",
      },
    ],
  };
}

export async function delhiveryCheckServiceability(pincode: string): Promise<DelhiveryActionResult> {
  try {
    const result = await checkServiceability(pincode);
    await logCourierCall({
      action: "serviceability",
      requestUrl: `/c/api/pin-codes/json/?filter_codes=${pincode}`,
      responseBody: result.raw,
      statusCode: result.httpStatus,
      success: true,
    });
    return { ok: true, error: null, data: result as unknown as Record<string, unknown> };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Serviceability check failed";
    const statusCode = (err as DelhiveryApiError).statusCode;
    await logCourierCall({
      action: "serviceability",
      requestUrl: `/c/api/pin-codes/json/?filter_codes=${pincode}`,
      success: false,
      errorMessage: message,
      statusCode,
    });
    return { ok: false, error: message };
  }
}

export async function delhiveryCreateOrderShipment(input: {
  orderId: string;
  shipmentId?: string;
  waybill?: string;
  weightGrams?: number;
  codAmount?: number;
  paymentMode?: "Prepaid" | "COD";
}): Promise<DelhiveryActionResult> {
  try {
    requireDelhiveryConfig();
    const supabase = createSupabaseServiceClient();

    let waybill = input.waybill;
    if (!waybill) {
      const wb = await getWaybill(1);
      waybill = wb.waybills[0];
    }

    const payload = await buildCreatePayload(input.orderId, {
      waybill,
      weightGrams: input.weightGrams,
      codAmount: input.codAmount,
      paymentMode: input.paymentMode,
    });

    const result = await delhiveryCreate(payload);
    await logCourierCall({
      action: "create_shipment",
      orderId: input.orderId,
      shipmentId: input.shipmentId,
      requestBody: payload as unknown as Record<string, unknown>,
      responseBody: result.raw,
      success: result.success,
      errorMessage: result.success ? null : result.remarks.join("; ") || "Create failed",
    });

    if (!result.success || !result.waybill) {
      return { ok: false, error: result.remarks.join("; ") || "Delhivery shipment creation failed." };
    }

    const label = await generateLabel(result.waybill).catch(() => ({
      labelUrl: null,
      pdfBase64: null,
      raw: {},
    }));

    let shipmentId = input.shipmentId;
    if (!shipmentId) {
      const { data: existing } = await supabase
        .from("shipments")
        .select("id")
        .eq("order_id", input.orderId)
        .maybeSingle();
      if (existing) {
        shipmentId = existing.id;
      } else {
        const { data: created } = await supabase
          .from("shipments")
          .insert({
            order_id: input.orderId,
            carrier: "Delhivery",
            status: "label_created",
          })
          .select("id")
          .single();
        shipmentId = created?.id;
      }
    }

    if (!shipmentId) return { ok: false, error: "Could not resolve shipment record." };

    const labelUrl =
      label.labelUrl ??
      (label.pdfBase64
        ? `/api/delhivery/label?waybill=${encodeURIComponent(result.waybill)}&format=pdf`
        : null);

    await supabase
      .from("shipments")
      .update({
        tracking_number: result.waybill,
        carrier: "Delhivery",
        label_url: labelUrl,
        status: "label_created",
        updated_at: new Date().toISOString(),
      })
      .eq("id", shipmentId);

    await supabase.from("tracking_events").insert({
      shipment_id: shipmentId,
      status: "label_created",
      message: "Delhivery AWB generated.",
      event_type: "status",
      raw: result.raw as Json,
    });

    return {
      ok: true,
      error: null,
      data: { shipmentId, waybill: result.waybill, awbNumber: result.waybill, labelUrl },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Shipment creation failed";
    await logCourierCall({
      action: "create_shipment",
      orderId: input.orderId,
      shipmentId: input.shipmentId,
      success: false,
      errorMessage: message,
    });
    return { ok: false, error: message };
  }
}

async function persistTrackingScans(
  shipmentId: string,
  orderId: string,
  trackingNumber: string,
  scans: DelhiveryTrackingScan[],
) {
  const supabase = await createSupabaseServerClient();

  for (const scan of scans) {
    if (!scan.status) continue;
    await supabase.from("shipment_tracking").insert({
      shipment_id: shipmentId,
      order_id: orderId,
      tracking_number: trackingNumber,
      status: scan.status,
      status_code: scan.statusCode,
      message: scan.message,
      location: scan.location,
      event_time: scan.timestamp ? new Date(scan.timestamp).toISOString() : new Date().toISOString(),
      raw: scan as unknown as Json,
    });

    await supabase.from("tracking_events").insert({
      shipment_id: shipmentId,
      status: mapDelhiveryStatus(scan.status),
      message: scan.message ?? scan.status,
      location: scan.location,
      event_type: "webhook",
      raw: scan as unknown as Json,
      occurred_at: scan.timestamp ? new Date(scan.timestamp).toISOString() : undefined,
    });
  }
}

export async function delhiveryTrackAndPersist(input: {
  waybill: string;
  shipmentId: string;
  orderId: string;
}): Promise<DelhiveryActionResult> {
  try {
    const tracking = await trackShipment(input.waybill);
    const supabase = await createSupabaseServerClient();
    const mappedStatus = mapDelhiveryStatus(tracking.status);

    await persistTrackingScans(input.shipmentId, input.orderId, input.waybill, tracking.scans);

    const patch: {
      status: ShipmentStatus;
      updated_at: string;
      estimated_delivery?: string | null;
      delivered_at?: string;
      shipped_at?: string;
    } = {
      status: mappedStatus,
      updated_at: new Date().toISOString(),
      estimated_delivery: tracking.expectedDelivery,
    };

    if (mappedStatus === "delivered") patch.delivered_at = new Date().toISOString();
    if (mappedStatus === "in_transit" || mappedStatus === "out_for_delivery") {
      patch.shipped_at = new Date().toISOString();
    }

    await supabase.from("shipments").update(patch).eq("id", input.shipmentId);

    onShipmentStatusChanged(input.orderId, mappedStatus);

    if (mappedStatus === "delivered") {
      await supabase
        .from("orders")
        .update({ status: "delivered", updated_at: new Date().toISOString() })
        .eq("id", input.orderId);
    } else if (mappedStatus === "in_transit" || mappedStatus === "out_for_delivery") {
      await supabase
        .from("orders")
        .update({ status: "shipped", updated_at: new Date().toISOString() })
        .eq("id", input.orderId);
    }

    await logCourierCall({
      action: "track",
      orderId: input.orderId,
      shipmentId: input.shipmentId,
      responseBody: tracking.raw,
      success: true,
    });

    return { ok: true, error: null, data: tracking as unknown as Record<string, unknown> };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tracking failed";
    await logCourierCall({
      action: "track",
      orderId: input.orderId,
      shipmentId: input.shipmentId,
      success: false,
      errorMessage: message,
    });
    return { ok: false, error: message };
  }
}

export async function delhiveryCancelOrderShipment(input: {
  waybill: string;
  shipmentId: string;
  orderId: string;
}): Promise<DelhiveryActionResult> {
  try {
    const result = await delhiveryCancel(input.waybill);
    const supabase = await createSupabaseServerClient();

    if (result.success) {
      await supabase
        .from("shipments")
        .update({
          status: "returned",
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.shipmentId);
    }

    await logCourierCall({
      action: "cancel",
      orderId: input.orderId,
      shipmentId: input.shipmentId,
      responseBody: result.raw,
      success: result.success,
      errorMessage: result.message,
    });

    return {
      ok: result.success,
      error: result.success ? null : result.message ?? "Cancellation failed",
      data: result.raw,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Cancel failed" };
  }
}

export async function delhiverySchedulePickup(input: {
  shipmentId?: string;
  orderId?: string;
  pickupDate: string;
  pickupTime?: string;
  expectedPackageCount?: number;
  pickupLocation?: string;
}): Promise<DelhiveryActionResult> {
  try {
    const config = requireDelhiveryConfig();
    const result = await requestPickup({
      pickupDate: input.pickupDate,
      pickupTime: input.pickupTime ?? "11:00:00",
      pickupLocation: input.pickupLocation ?? config.pickupLocation,
      expectedPackageCount: input.expectedPackageCount ?? 1,
    });

    if (input.shipmentId) {
      const supabase = await createSupabaseServerClient();
      await supabase
        .from("shipments")
        .update({
          pickup_status: result.success ? "scheduled" : "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.shipmentId);
    }

    await logCourierCall({
      action: "pickup",
      orderId: input.orderId,
      shipmentId: input.shipmentId,
      responseBody: result.raw,
      success: result.success,
    });

    return {
      ok: result.success,
      error: result.success ? null : "Pickup scheduling failed",
      data: { pickupId: result.pickupId, ...result.raw },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Pickup failed" };
  }
}

export async function delhiveryFetchLabel(waybill: string): Promise<DelhiveryActionResult> {
  try {
    const result = await generateLabel(waybill);
    await logCourierCall({
      action: "label",
      requestUrl: `/api/p/packing_slip?wbns=${waybill}`,
      responseBody: result.raw,
      success: Boolean(result.labelUrl || result.pdfBase64),
    });
    return { ok: true, error: null, data: result as unknown as Record<string, unknown> };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Label fetch failed" };
  }
}

export async function processDelhiveryWebhook(
  payload: Record<string, unknown>,
): Promise<DelhiveryActionResult> {
  const waybill = String(payload.waybill ?? payload.AWB ?? "");
  const status = String(payload.status ?? payload.Status ?? "");
  if (!waybill) return { ok: false, error: "Missing waybill in webhook." };

  const supabase = createSupabaseServiceClient();
  const { data: shipment } = await supabase
    .from("shipments")
    .select("id, order_id")
    .eq("tracking_number", waybill)
    .maybeSingle();

  if (!shipment) return { ok: false, error: "Shipment not found for waybill." };

  const scan: DelhiveryTrackingScan = {
    status,
    statusCode: null,
    location: payload.location ? String(payload.location) : null,
    message: status,
    timestamp: payload.scan_date_time ? String(payload.scan_date_time) : new Date().toISOString(),
  };

  await persistTrackingScans(shipment.id, shipment.order_id, waybill, [scan]);

  const mapped = mapDelhiveryStatus(status);
  await supabase
    .from("shipments")
    .update({ status: mapped, updated_at: new Date().toISOString() })
    .eq("id", shipment.id);

  await logCourierCall({
    action: "webhook",
    orderId: shipment.order_id,
    shipmentId: shipment.id,
    requestBody: payload,
    success: true,
  });

  return { ok: true, error: null, data: { shipmentId: shipment.id, status: mapped } };
}

export async function syncPendingDelhiveryShipments(): Promise<{ synced: number; errors: number }> {
  if (!getDelhiveryConfig().isConfigured) return { synced: 0, errors: 0 };

  const supabase = createSupabaseServiceClient();
  const { data: rows } = await supabase
    .from("shipments")
    .select("id, order_id, tracking_number, status")
    .eq("carrier", "Delhivery")
    .in("status", ["pending", "label_created", "in_transit", "out_for_delivery"])
    .limit(100);

  let synced = 0;
  let errors = 0;

  for (const row of rows ?? []) {
    const waybill = row.tracking_number;
    if (!waybill) continue;
    const result = await delhiveryTrackAndPersist({
      waybill,
      shipmentId: row.id,
      orderId: row.order_id,
    });
    if (result.ok) synced += 1;
    else errors += 1;
  }

  return { synced, errors };
}
