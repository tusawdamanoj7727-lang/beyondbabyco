import { NextResponse, type NextRequest } from "next/server";

import { logger } from "@/lib/observability/logger";

/**
 * Shared rate limiter — Postgres RPC across all Vercel instances when
 * SUPABASE_SERVICE_ROLE_KEY is available; in-memory fallback for local/dev.
 */

interface WindowEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, WindowEntry>();

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX = 120;

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function memoryLimit(
  key: string,
  max: number,
  windowMs: number,
): { limited: boolean; retryAfter: number; remaining: number } {
  const now = Date.now();
  let entry = memoryStore.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    memoryStore.set(key, entry);
  }
  entry.count += 1;
  if (entry.count > max) {
    return {
      limited: true,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      remaining: 0,
    };
  }
  return {
    limited: false,
    retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    remaining: Math.max(0, max - entry.count),
  };
}

async function sharedLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ limited: boolean; retryAfter: number; remaining: number } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return null;

  try {
    const res = await fetch(`${url}/rest/v1/rpc/check_rate_limit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        p_key: key,
        p_max: max,
        p_window_ms: windowMs,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      logger.warn("rate_limit.shared_rpc_failed", { status: res.status, key });
      return null;
    }

    const rows = (await res.json()) as Array<{
      allowed: boolean;
      remaining: number;
      retry_after_seconds: number;
    }>;
    const row = rows[0];
    if (!row) return null;

    return {
      limited: !row.allowed,
      retryAfter: row.retry_after_seconds,
      remaining: row.remaining,
    };
  } catch (error) {
    logger.warn("rate_limit.shared_rpc_error", {
      key,
      error: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}

function limitedResponse(max: number, retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests", retryAfter },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(max),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}

/** Async shared rate limit — prefer this in middleware / API routes. */
export async function checkRateLimitAsync(
  request: NextRequest,
  opts: RateLimitOptions = {},
): Promise<NextResponse | null> {
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;
  const max = opts.max ?? DEFAULT_MAX;
  const ip = getClientIp(request);
  const key = `${opts.keyPrefix ?? "global"}:${ip}`;

  const shared = await sharedLimit(key, max, windowMs);
  const result = shared ?? memoryLimit(key, max, windowMs);

  if (result.limited) {
    return limitedResponse(max, result.retryAfter);
  }
  return null;
}

/**
 * Sync wrapper kept for call sites that cannot await.
 * Uses memory only — prefer checkRateLimitAsync in production paths.
 */
export function checkRateLimit(
  request: NextRequest,
  opts: RateLimitOptions = {},
): NextResponse | null {
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;
  const max = opts.max ?? DEFAULT_MAX;
  const ip = getClientIp(request);
  const key = `${opts.keyPrefix ?? "global"}:${ip}`;
  const result = memoryLimit(key, max, windowMs);
  if (result.limited) return limitedResponse(max, result.retryAfter);
  return null;
}

export async function checkAdminRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return checkRateLimitAsync(request, { windowMs: 60_000, max: 60, keyPrefix: "admin" });
}

export async function checkAdminApiRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return checkRateLimitAsync(request, { windowMs: 60_000, max: 60, keyPrefix: "api-admin" });
}

export async function checkAuthRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return checkRateLimitAsync(request, { windowMs: 60_000, max: 30, keyPrefix: "auth" });
}

export async function checkCheckoutRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return checkRateLimitAsync(request, { windowMs: 60_000, max: 40, keyPrefix: "checkout" });
}

export async function checkWebhookRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return checkRateLimitAsync(request, { windowMs: 60_000, max: 300, keyPrefix: "webhook" });
}

export async function checkHealthRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return checkRateLimitAsync(request, { windowMs: 60_000, max: 30, keyPrefix: "health" });
}

/** Cleanup stale in-memory entries (best effort). */
export function pruneRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (now >= entry.resetAt) memoryStore.delete(key);
  }
}
