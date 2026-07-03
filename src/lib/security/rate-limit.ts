import { NextResponse, type NextRequest } from "next/server";

/** Simple in-memory sliding-window rate limiter (per IP). Suitable for single-instance; use Redis at scale. */

interface WindowEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, WindowEntry>();

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

export function checkRateLimit(
  request: NextRequest,
  opts: RateLimitOptions = {},
): NextResponse | null {
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;
  const max = opts.max ?? DEFAULT_MAX;
  const ip = getClientIp(request);
  const key = `${opts.keyPrefix ?? "global"}:${ip}`;
  const now = Date.now();

  let entry = store.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count += 1;

  if (entry.count > max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
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

  return null;
}

/** Stricter limits for auth-sensitive routes. */
export function checkAdminRateLimit(request: NextRequest): NextResponse | null {
  return checkRateLimit(request, { windowMs: 60_000, max: 60, keyPrefix: "admin" });
}

/** Cleanup stale entries periodically (edge-safe best effort). */
export function pruneRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now >= entry.resetAt) store.delete(key);
  }
}
