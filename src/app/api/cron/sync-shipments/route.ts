import { jsonOk } from "@/lib/api/route-helpers";
import { syncPendingDelhiveryShipments } from "@/lib/delhivery/service";
import { requireCronAuth } from "@/lib/security/cron-auth";

export const dynamic = "force-dynamic";

/** Cron endpoint — sync Delhivery tracking for pending shipments. */
export async function GET(request: Request) {
  const denied = requireCronAuth(request);
  if (denied) return denied;

  const result = await syncPendingDelhiveryShipments();
  return jsonOk({ ...result, timestamp: new Date().toISOString() });
}

export async function POST(request: Request) {
  return GET(request);
}
