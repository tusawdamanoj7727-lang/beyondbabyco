import { z } from "zod";
import { NextResponse } from "next/server";

import { fulfillOrderWithDelhivery } from "@/lib/checkout/fulfillment";
import { requireStaffApi } from "@/lib/api/route-helpers";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  orderId: z.string().uuid(),
});

/** Trigger post-payment fulfillment (Delhivery shipment creation). Staff-only. */
export async function POST(request: Request) {
  const auth = await requireStaffApi(PERMISSIONS.ORDERS_MANAGE);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid orderId" }, { status: 422 });
  }

  const result = await fulfillOrderWithDelhivery(parsed.data.orderId);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, awb: result.awb ?? null });
}
