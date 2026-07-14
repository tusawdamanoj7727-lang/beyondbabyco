import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getDelhiveryConfig } from "@/lib/delhivery/config";
import { delhiveryCreateOrderShipment } from "@/lib/delhivery/service";

/**
 * After payment success: create Delhivery shipment and persist AWB/tracking.
 * Safe to call multiple times — skips if AWB already exists.
 */
export async function fulfillOrderWithDelhivery(orderId: string): Promise<{
  ok: boolean;
  error: string | null;
  awb?: string;
}> {
  if (!getDelhiveryConfig().isConfigured) {
    return { ok: false, error: "Delhivery not configured" };
  }

  const supabase = createSupabaseServiceClient();

  const { data: existing } = await supabase
    .from("shipments")
    .select("id, tracking_number")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existing?.tracking_number) {
    return { ok: true, error: null, awb: existing.tracking_number };
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("status, amount, method")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isCod = payment?.method?.toLowerCase() === "cod";
  const codAmount = isCod ? Number(payment?.amount ?? 0) : 0;

  // Order confirmation (pending → confirmed) is owned by runOrderCompletionEmails /
  // markOrderConfirmed so COD + Razorpay share one pipeline. Do not confirm here.

  const result = await delhiveryCreateOrderShipment({
    orderId,
    shipmentId: existing?.id,
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
