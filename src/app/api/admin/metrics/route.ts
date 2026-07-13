import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { jsonOk, requireStaffApi } from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

/** Performance metrics placeholder API for dashboards / external monitoring. */
export async function GET() {
  const auth = await requireStaffApi(PERMISSIONS.REPORTS_VIEW);
  if (!auth.ok) return auth.response;

  const mem = process.memoryUsage();
  const supabase = await createSupabaseServerClient();
  const dbStart = Date.now();
  await supabase.from("settings").select("key").limit(1);

  return jsonOk({
    timestamp: new Date().toISOString(),
    metrics: {
      dbLatencyMs: Date.now() - dbStart,
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      rssMb: Math.round(mem.rss / 1024 / 1024),
    },
    note: "Wire to Datadog/Grafana in production",
  });
}
