import { z } from "zod";

import { logApiAction } from "@/lib/api/audit";
import { parseJsonBody } from "@/lib/api/request";
import { uuidSchema } from "@/lib/api/schemas";
import { jsonError, jsonOk, requireStaffApi } from "@/lib/api/route-helpers";
import { fulfillOrderWithDelhivery } from "@/lib/checkout/fulfillment";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  orderId: uuidSchema,
});

/** Trigger post-payment fulfillment (Delhivery shipment creation). Staff-only. */
export async function POST(request: Request) {
  const auth = await requireStaffApi(PERMISSIONS.ORDERS_MANAGE);
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, { schema: bodySchema });
  if (!parsed.ok) {
    return jsonError(parsed.error, parsed.status);
  }

  const result = await fulfillOrderWithDelhivery(parsed.data.orderId);
  if (!result.ok) {
    return jsonError(result.error ?? "Fulfillment failed", 502);
  }

  logApiAction({
    action: "api.checkout.complete",
    entity: "orders",
    entityId: parsed.data.orderId,
    metadata: { awb: result.awb ?? null },
  });

  return jsonOk({ awb: result.awb ?? null });
}
