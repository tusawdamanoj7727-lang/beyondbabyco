import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

/** Performance metrics placeholder API for dashboards / external monitoring. */
export async function GET() {
  try {
    await requirePermission(PERMISSIONS.REPORTS_VIEW);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mem = process.memoryUsage();
  const supabase = await createSupabaseServerClient();
  const dbStart = Date.now();
  await supabase.from("settings").select("key").limit(1);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    metrics: {
      dbLatencyMs: Date.now() - dbStart,
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      rssMb: Math.round(mem.rss / 1024 / 1024),
    },
    note: "Wire to Datadog/Grafana in production",
  });
}
