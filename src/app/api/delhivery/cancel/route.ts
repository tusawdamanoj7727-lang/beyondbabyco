import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseJsonBody } from "@/lib/api/request";
import { jsonError, jsonOk, requireStaffApi } from "@/lib/api/route-helpers";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { cancelBodySchema } from "@/lib/delhivery/schemas";
import { delhiveryCancelOrderShipment } from "@/lib/delhivery/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireStaffApi(PERMISSIONS.SHIPPING_MANAGE);
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, { schema: cancelBodySchema });
  if (!parsed.ok) {
    return jsonError(parsed.error, parsed.status === 400 ? 400 : 422);
  }

  const supabase = await createSupabaseServerClient();
  const { data: shipment } = await supabase
    .from("shipments")
    .select("id, order_id")
    .eq("id", parsed.data.shipmentId)
    .maybeSingle();
  if (!shipment) return jsonError("Shipment not found", 404);

  const result = await delhiveryCancelOrderShipment({
    waybill: parsed.data.waybill,
    shipmentId: parsed.data.shipmentId,
    orderId: shipment.order_id,
  });

  if (!result.ok) return jsonError(result.error ?? "Cancel failed", 502);
  return jsonOk(result.data ?? {});
}
