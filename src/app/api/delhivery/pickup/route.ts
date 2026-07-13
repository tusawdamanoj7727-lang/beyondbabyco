import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseJsonBody } from "@/lib/api/request";
import { jsonError, jsonOk, requireStaffApi } from "@/lib/api/route-helpers";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { pickupBodySchema } from "@/lib/delhivery/schemas";
import { delhiverySchedulePickup } from "@/lib/delhivery/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireStaffApi(PERMISSIONS.SHIPPING_MANAGE);
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, { schema: pickupBodySchema });
  if (!parsed.ok) {
    return jsonError(parsed.error, parsed.status === 400 ? 400 : 422);
  }

  let orderId: string | undefined;
  if (parsed.data.shipmentId) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("shipments")
      .select("order_id")
      .eq("id", parsed.data.shipmentId)
      .maybeSingle();
    orderId = data?.order_id;
  }

  const result = await delhiverySchedulePickup({
    shipmentId: parsed.data.shipmentId,
    orderId,
    pickupDate: parsed.data.pickupDate,
    pickupTime: parsed.data.pickupTime,
    expectedPackageCount: parsed.data.expectedPackageCount,
    pickupLocation: parsed.data.pickupLocation,
  });

  if (!result.ok) return jsonError(result.error ?? "Pickup failed", 502);
  return jsonOk(result.data ?? {});
}
