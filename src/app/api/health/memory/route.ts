import { jsonOk } from "@/lib/api/route-helpers";
import { requireHealthCheckAuth } from "@/lib/security/health-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireHealthCheckAuth(request);
  if (denied) return denied;

  const mem = process.memoryUsage();
  const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
  const heapTotalMb = Math.round(mem.heapTotal / 1024 / 1024);
  const rssMb = Math.round(mem.rss / 1024 / 1024);

  return jsonOk({
    status: heapUsedMb / heapTotalMb > 0.9 ? "degraded" : "ok",
    memory: {
      heapUsedMb,
      heapTotalMb,
      rssMb,
      externalMb: Math.round(mem.external / 1024 / 1024),
    },
  });
}
