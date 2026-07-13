import { userOwnsOrder } from "@/lib/orders/customer-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError, jsonOk, requireAuthenticatedApi, requireStaffApi } from "@/lib/api/route-helpers";
import { trackQuerySchema } from "@/lib/delhivery/schemas";
import { delhiveryTrackAndPersist } from "@/lib/delhivery/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = trackQuerySchema.safeParse({
    waybill: searchParams.get("waybill"),
    shipmentId: searchParams.get("shipmentId") ?? undefined,
  });
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid query", 422);
  }

  const supabase = await createSupabaseServerClient();
  let shipmentId = parsed.data.shipmentId;
  let orderId: string | null = null;

  if (shipmentId) {
    const { data } = await supabase.from("shipments").select("id, order_id").eq("id", shipmentId).maybeSingle();
    if (!data) return jsonError("Shipment not found", 404);
    orderId = data.order_id;
  } else {
    const { data } = await supabase
      .from("shipments")
      .select("id, order_id")
      .eq("tracking_number", parsed.data.waybill)
      .maybeSingle();
    if (!data) return jsonError("Shipment not found", 404);
    shipmentId = data.id;
    orderId = data.order_id;
  }

  const staff = await requireStaffApi();
  if (!staff.ok) {
    const customer = await requireAuthenticatedApi();
    if (!customer.ok) return customer.response;

    const { data: order } = await supabase
      .from("orders")
      .select("customer_id")
      .eq("id", orderId!)
      .maybeSingle();
    if (!order?.customer_id) return jsonError("Forbidden", 403);
    const owns = await userOwnsOrder(orderId!, customer.userId);
    if (!owns) return jsonError("Forbidden", 403);
  }

  const result = await delhiveryTrackAndPersist({
    waybill: parsed.data.waybill,
    shipmentId: shipmentId!,
    orderId: orderId!,
  });

  if (!result.ok) return jsonError(result.error ?? "Tracking failed", 502);
  return jsonOk(result.data ?? {});
}
