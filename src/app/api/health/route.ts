import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProductionEnvWarnings, isProduction, validatePublicEnv } from "@/lib/env.validation";
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

function checkMemory(): HealthCheck {
  const mem = process.memoryUsage();
  const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
  const heapTotalMb = Math.round(mem.heapTotal / 1024 / 1024);
  const status = heapUsedMb / heapTotalMb > 0.9 ? "degraded" : "ok";
  return { name: "memory", status, detail: `heap ${heapUsedMb}/${heapTotalMb} MB` };
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

    return Promise.all([envStatus, checkDatabase(), checkStorage(), checkQueues(), Promise.resolve(checkMemory())]);
  });

  const hasError = checks.some((c) => c.status === "error");
  const hasDegraded = checks.some((c) => c.status === "degraded");
  const overall = hasError ? "error" : hasDegraded ? "degraded" : "ok";

  logger.info("Health check", { requestId, correlationId, overall });

  const body = {
    status: overall,
    timestamp: new Date().toISOString(),
    requestId: isProduction() ? undefined : requestId,
    checks: checks.map(sanitizeCheck),
  };

  const res = NextResponse.json(body, { status: hasError ? 503 : 200 });
  attachRequestHeaders(res.headers, requestId, correlationId);
  return res;
}
