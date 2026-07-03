import { type NextRequest } from "next/server";

/** Routes exempt from CSRF origin checks (webhooks, health probes). */
const CSRF_EXEMPT_PREFIXES = ["/api/health", "/api/webhooks", "/api/cron"];

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Validates Origin/Referer for state-changing API requests.
 * Next.js Server Actions have built-in CSRF protection; this covers Route Handlers.
 */
export function validateCsrf(request: NextRequest): { ok: true } | { ok: false; reason: string } {
  if (!MUTATION_METHODS.has(request.method)) {
    return { ok: true };
  }

  const pathname = request.nextUrl.pathname;
  if (CSRF_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) {
    return { ok: true };
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (!host) {
    return { ok: false, reason: "Missing host header" };
  }

  const expectedOrigin = `${request.nextUrl.protocol}//${host}`;

  if (origin) {
    if (origin === expectedOrigin) return { ok: true };
    return { ok: false, reason: "Origin mismatch" };
  }

  if (referer) {
    try {
      const ref = new URL(referer);
      if (ref.host === host) return { ok: true };
    } catch {
      return { ok: false, reason: "Invalid referer" };
    }
    return { ok: false, reason: "Referer mismatch" };
  }

  // Same-origin fetch from browser always sends Origin; reject missing on mutations.
  if (process.env.NODE_ENV === "production") {
    return { ok: false, reason: "Missing origin/referer on mutation" };
  }

  return { ok: true };
}
