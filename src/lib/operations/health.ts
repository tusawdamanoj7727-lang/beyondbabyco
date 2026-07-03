import "server-only";

import fs from "node:fs";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProductionEnvWarnings, validatePublicEnv } from "@/lib/env.validation";
import { isAiDevEnabled, getAiConfig } from "@/lib/ai/config";
import { checkEmailProviderHealth } from "./email/health";
import type { HealthProbe, OpsCheckItem } from "./types";

async function probeDatabase(): Promise<HealthProbe> {
  const start = Date.now();
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("settings").select("key").limit(1);
    if (error) throw error;
    return { name: "database", status: "ok", latencyMs: Date.now() - start };
  } catch (e) {
    return {
      name: "database",
      status: "error",
      latencyMs: Date.now() - start,
      detail: e instanceof Error ? e.message : "Unknown",
    };
  }
}

async function probeStorage(): Promise<HealthProbe> {
  const start = Date.now();
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.storage.from("products").list("", { limit: 1 });
    if (error) throw error;
    return { name: "storage", status: "ok", latencyMs: Date.now() - start };
  } catch (e) {
    return {
      name: "storage",
      status: "degraded",
      latencyMs: Date.now() - start,
      detail: e instanceof Error ? e.message : "Unknown",
    };
  }
}

async function probeQueues(): Promise<HealthProbe> {
  const start = Date.now();
  try {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase
      .from("email_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "queued");
    if (error) {
      return { name: "queues", status: "degraded", latencyMs: Date.now() - start, detail: "Queue tables unavailable" };
    }
    return {
      name: "queues",
      status: "ok",
      latencyMs: Date.now() - start,
      detail: `${count ?? 0} email items queued`,
    };
  } catch {
    return { name: "queues", status: "degraded", latencyMs: Date.now() - start, detail: "Queue check skipped" };
  }
}

function probeMemory(): HealthProbe {
  const mem = process.memoryUsage();
  const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
  const heapTotalMb = Math.round(mem.heapTotal / 1024 / 1024);
  const rssMb = Math.round(mem.rss / 1024 / 1024);
  const status = heapUsedMb / heapTotalMb > 0.9 ? "degraded" : "ok";
  return { name: "memory", status, detail: `heap ${heapUsedMb}/${heapTotalMb} MB, RSS ${rssMb} MB` };
}

function probeEnvironment(): HealthProbe {
  try {
    validatePublicEnv();
    const warnings = getProductionEnvWarnings();
    if (warnings.length) {
      return { name: "environment", status: "degraded", detail: `${warnings.length} production warning(s)` };
    }
    return { name: "environment", status: "ok" };
  } catch (e) {
    return { name: "environment", status: "error", detail: e instanceof Error ? e.message : "Invalid" };
  }
}

function probeApplication(): HealthProbe {
  return {
    name: "application",
    status: "ok",
    detail: `Node ${process.version}, ${process.env.NODE_ENV ?? "development"}`,
  };
}

async function probePayment(): Promise<HealthProbe> {
  const hasRazorpay = Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
  return {
    name: "payment",
    status: hasRazorpay ? "ok" : "degraded",
    detail: hasRazorpay ? "Razorpay credentials present" : "Razorpay credentials not configured",
  };
}

async function probeShipping(): Promise<HealthProbe> {
  try {
    const { checkDelhiveryHealth } = await import("@/lib/delhivery/health");
    const health = await checkDelhiveryHealth();
    return {
      name: "shipping",
      status: health.status,
      detail: health.detail,
    };
  } catch {
    const hasDelhivery = Boolean(process.env.DELHIVERY_API_KEY?.trim() && process.env.DELHIVERY_BASE_URL?.trim());
    return {
      name: "shipping",
      status: hasDelhivery ? "ok" : "degraded",
      detail: hasDelhivery ? "Delhivery credentials present" : "Delhivery not fully configured",
    };
  }
}

async function probeAi(): Promise<HealthProbe> {
  const config = getAiConfig();
  if (process.env.NODE_ENV === "production" && isAiDevEnabled()) {
    return { name: "ai", status: "error", detail: "AI dev tools enabled in production" };
  }
  if (!config.devEnabled) {
    return { name: "ai", status: "ok", detail: "AI disabled (production safe)" };
  }
  return { name: "ai", status: "ok", detail: `Local AI (${config.provider}) — dev only` };
}

export async function getAggregatedHealth(): Promise<{
  overall: "ok" | "degraded" | "error";
  probes: HealthProbe[];
  checks: OpsCheckItem[];
}> {
  const emailHealth = await checkEmailProviderHealth();

  const probes: HealthProbe[] = await Promise.all([
    Promise.resolve(probeApplication()),
    Promise.resolve(probeEnvironment()),
    probeDatabase(),
    probeStorage(),
    probeQueues(),
    Promise.resolve(probeMemory()),
    Promise.resolve({
      name: "email",
      status: emailHealth.status,
      detail: emailHealth.detail,
    } satisfies HealthProbe),
    probePayment(),
    probeShipping(),
    probeAi(),
  ]);

  const hasError = probes.some((p) => p.status === "error");
  const hasDegraded = probes.some((p) => p.status === "degraded");
  const overall = hasError ? "error" : hasDegraded ? "degraded" : "ok";

  const checks: OpsCheckItem[] = probes.map((p) => ({
    id: p.name,
    label: p.name.charAt(0).toUpperCase() + p.name.slice(1),
    status: p.status === "ok" ? "ready" : p.status === "degraded" ? "warning" : "error",
    detail: p.detail,
    hint: "latencyMs" in p && p.latencyMs !== undefined ? `${p.latencyMs}ms` : undefined,
  }));

  return { overall, probes, checks };
}

export function getDiskUsageHint(): string {
  try {
    if (typeof fs.statfsSync !== "function") {
      return "Disk usage unavailable on this platform";
    }
    const stats = fs.statfsSync(process.cwd());
    const totalGb = ((stats.bsize * stats.blocks) / 1024 ** 3).toFixed(1);
    const freeGb = ((stats.bsize * stats.bfree) / 1024 ** 3).toFixed(1);
    return `${freeGb} GB free of ${totalGb} GB`;
  } catch {
    return "Disk usage probe unavailable";
  }
}
