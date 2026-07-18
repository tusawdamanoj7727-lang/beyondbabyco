import { jsonOk } from "@/lib/api/route-helpers";
import { isProduction } from "@/lib/env.validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProductionEnvWarnings, validatePublicEnv } from "@/lib/env.validation";
import { logger } from "@/lib/observability/logger";
import { getRequestContext } from "@/lib/observability/request-context";
import { attachRequestHeaders } from "@/lib/observability/request-id";
import { withTiming } from "@/lib/observability/performance";

export const dynamic = "force-dynamic";

interface HealthCheck {
  name: string;
  status: "ok" | "degraded" | "error";
  latencyMs?: number;
  detail?: string;
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("settings").select("key").limit(1);
    if (error) throw error;
    return { name: "database", status: "ok", latencyMs: Date.now() - start };
  } catch (e) {
    return { name: "database", status: "error", latencyMs: Date.now() - start, detail: e instanceof Error ? e.message : "Unknown" };
  }
}

async function checkStorage(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.storage.from("products").list("", { limit: 1 });
    if (error) throw error;
    return { name: "storage", status: "ok", latencyMs: Date.now() - start };
  } catch (e) {
    return { name: "storage", status: "degraded", latencyMs: Date.now() - start, detail: e instanceof Error ? e.message : "Unknown" };
  }
}

async function checkQueues(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase.from("email_queue").select("id", { count: "exact", head: true }).eq("status", "queued");
    if (error) {
      return { name: "queues", status: "degraded", latencyMs: Date.now() - start, detail: "Queue tables not available" };
    }
    return { name: "queues", status: "ok", latencyMs: Date.now() - start, detail: `${count ?? 0} email items queued` };
  } catch {
    return { name: "queues", status: "degraded", latencyMs: Date.now() - start, detail: "Queue check skipped" };
  }
}

async function checkOpsSignals(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // Service role — ops counters must not be masked by anon/authenticated RLS.
    const { createSupabaseServiceClient } = await import("@/lib/supabase/service");
    const supabase = createSupabaseServiceClient();
    const [{ count: failedEmails }, { count: unprocessedWebhooks }, { count: pendingShipments }] =
      await Promise.all([
        supabase
          .from("order_email_logs")
          .select("id", { count: "exact", head: true })
          .eq("status", "failed"),
        supabase
          .from("payment_webhooks")
          .select("id", { count: "exact", head: true })
          .eq("processed", false),
        supabase
          .from("shipments")
          .select("id", { count: "exact", head: true })
          .eq("carrier", "Delhivery")
          .is("tracking_number", null),
      ]);

    const failed = failedEmails ?? 0;
    const webhooks = unprocessedWebhooks ?? 0;
    const pending = pendingShipments ?? 0;
    const degraded = failed > 0 || webhooks > 0 || pending > 5;
    return {
      name: "ops",
      status: degraded ? "degraded" : "ok",
      latencyMs: Date.now() - start,
      detail: `failed_emails=${failed} unprocessed_webhooks=${webhooks} shipments_missing_awb=${pending}`,
    };
  } catch (e) {
    return {
      name: "ops",
      status: "degraded",
      latencyMs: Date.now() - start,
      detail: e instanceof Error ? e.message : "Ops check unavailable",
    };
  }
}

function checkMemory(): HealthCheck {
  try {
    const mem = process.memoryUsage();
    const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
    const heapTotalMb = Math.round(mem.heapTotal / 1024 / 1024);
    const status = heapTotalMb > 0 && heapUsedMb / heapTotalMb > 0.9 ? "degraded" : "ok";
    return { name: "memory", status, detail: `heap ${heapUsedMb}/${heapTotalMb} MB` };
  } catch {
    return { name: "memory", status: "degraded", detail: "Check unavailable" };
  }
}

function sanitizeCheck(check: HealthCheck): HealthCheck {
  if (!isProduction()) return check;
  if (check.name === "environment" && check.status !== "ok") {
    const warnings = getProductionEnvWarnings();
    return { ...check, detail: `${warnings.length} configuration warning(s)` };
  }
  if (check.status === "error" || check.status === "degraded") {
    return { ...check, detail: "Check unavailable" };
  }
  return { ...check, detail: undefined };
}

export async function GET() {
  const { requestId, correlationId } = await getRequestContext();

  const checks = await withTiming("health.all", async () => {
    let envStatus: HealthCheck = { name: "environment", status: "ok" };
    try {
      validatePublicEnv();
      const warnings = getProductionEnvWarnings();
      if (warnings.length) envStatus = { name: "environment", status: "degraded", detail: warnings.join("; ") };
    } catch (e) {
      envStatus = { name: "environment", status: "error", detail: e instanceof Error ? e.message : "Invalid" };
    }

    return Promise.all([
      envStatus,
      checkDatabase(),
      checkStorage(),
      checkQueues(),
      Promise.resolve(checkMemory()),
      checkOpsSignals(),
    ]);
  });

  const hasError = checks.some((c) => c.status === "error");
  const hasDegraded = checks.some((c) => c.status === "degraded");
  const overall = hasError ? "error" : hasDegraded ? "degraded" : "ok";

  logger.info("Health check", { requestId, correlationId, overall });

  const res = jsonOk(
    {
      status: overall,
      timestamp: new Date().toISOString(),
      requestId: isProduction() ? undefined : requestId,
      checks: checks.map(sanitizeCheck),
    },
    hasError ? 503 : 200,
  );
  attachRequestHeaders(res.headers, requestId, correlationId);
  return res;
}
