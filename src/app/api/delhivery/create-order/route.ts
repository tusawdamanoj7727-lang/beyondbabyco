import { jsonError, jsonOk, requireStaffApi } from "@/lib/api/route-helpers";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createOrderBodySchema } from "@/lib/delhivery/schemas";
import { delhiveryCreateOrderShipment } from "@/lib/delhivery/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireStaffApi(PERMISSIONS.SHIPPING_MANAGE);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = createOrderBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid payload", 422);
  }

  const result = await delhiveryCreateOrderShipment({
    orderId: parsed.data.orderId,
    shipmentId: parsed.data.shipmentId,
    waybill: parsed.data.waybill,
    weightGrams: parsed.data.weightGrams,
    codAmount: parsed.data.codAmount,
    paymentMode: parsed.data.paymentMode,
  });

  if (!result.ok) return jsonError(result.error ?? "Create shipment failed", 502);
  return jsonOk({ data: result.data ?? {} });
}
