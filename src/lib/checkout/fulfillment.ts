import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getDelhiveryConfig } from "@/lib/delhivery/config";
import { delhiveryCreateOrderShipment } from "@/lib/delhivery/service";

const PAID_STATUSES = new Set(["paid", "captured"]);

/**
 * Create Delhivery shipment exactly once after prepaid payment is settled.
 * Safe under concurrent webhook retries — claims a shipment row before calling Delhivery.
 */
export async function fulfillOrderWithDelhivery(orderId: string): Promise<{
  ok: boolean;
  error: string | null;
  awb?: string;
  skipped?: boolean;
}> {
  if (!getDelhiveryConfig().isConfigured) {
    return { ok: false, error: "Delhivery not configured" };
  }

  const supabase = createSupabaseServiceClient();

  const [{ data: order }, { data: payment }, { data: existing }] = await Promise.all([
    supabase.from("orders").select("id, status").eq("id", orderId).maybeSingle(),
    supabase
      .from("payments")
      .select("status, amount, method")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("shipments")
      .select("id, tracking_number, label_url, status")
      .eq("order_id", orderId)
      .maybeSingle(),
  ]);

  if (!order) {
    return { ok: false, error: "Order not found." };
  }

  // Already shipped — never call Delhivery again.
  if (existing?.tracking_number) {
    return { ok: true, error: null, awb: existing.tracking_number, skipped: true };
  }

  if (!payment || !PAID_STATUSES.has(payment.status)) {
    return { ok: true, error: null, skipped: true };
  }

  if (order.status !== "confirmed") {
    return { ok: true, error: null, skipped: true };
  }

  // Claim the shipment slot before hitting Delhivery (one row per order).
  let shipmentId = existing?.id ?? null;
  if (!shipmentId) {
    const { data: claimed, error: claimError } = await supabase
      .from("shipments")
      .insert({
        order_id: orderId,
        carrier: "Delhivery",
        status: "pending",
      })
      .select("id, tracking_number")
      .single();

    if (claimError) {
      // Concurrent claim won (unique order_id) — return existing; never double-call Delhivery.
      const { data: raced } = await supabase
        .from("shipments")
        .select("id, tracking_number")
        .eq("order_id", orderId)
        .maybeSingle();

      if (raced?.tracking_number) {
        return { ok: true, error: null, awb: raced.tracking_number, skipped: true };
      }
      // Another worker holds the claim / is creating — do not call Delhivery again.
      return { ok: true, error: null, skipped: true };
    }

    if (claimed?.tracking_number) {
      return { ok: true, error: null, awb: claimed.tracking_number, skipped: true };
    }
    shipmentId = claimed?.id ?? null;
  }

  if (!shipmentId) {
    return { ok: false, error: "Could not claim shipment slot." };
  }

  // Re-check after claim (another process may have filled AWB).
  const { data: locked } = await supabase
    .from("shipments")
    .select("id, tracking_number")
    .eq("id", shipmentId)
    .maybeSingle();

  if (locked?.tracking_number) {
    return { ok: true, error: null, awb: locked.tracking_number, skipped: true };
  }

  const isCod = payment.method?.toLowerCase() === "cod";
  const codAmount = isCod ? Number(payment.amount ?? 0) : 0;

  const result = await delhiveryCreateOrderShipment({
    orderId,
    shipmentId,
    codAmount: codAmount > 0 ? codAmount : undefined,
    paymentMode: codAmount > 0 ? "COD" : "Prepaid",
  });

  if (!result.ok) {
    await supabase.from("order_events").insert({
      order_id: orderId,
      type: "shipment",
      message: `Delhivery auto-fulfillment failed: ${result.error}`,
      metadata: { provider: "delhivery" },
    });
    return { ok: false, error: result.error };
  }

  await supabase.from("order_events").insert({
    order_id: orderId,
    type: "shipment",
    message: "Delhivery shipment created after payment.",
    metadata: (result.data ?? {}) as Json,
  });

  return {
    ok: true,
    error: null,
    awb: String(result.data?.waybill ?? result.data?.awbNumber ?? ""),
  };
}
