import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_JSON_BODY_LIMIT, WEBHOOK_JSON_BODY_LIMIT } from "@/lib/api/request";
import { validateCsrf } from "@/lib/security/csrf";
import { isDevApiBlocked } from "@/lib/security/dev-api";
import { applySecurityHeaders } from "@/lib/security/headers";
import { checkAdminApiRateLimit, checkAdminRateLimit, checkRateLimit } from "@/lib/security/rate-limit";
import { generateRequestId, attachRequestHeaders, REQUEST_ID_HEADER } from "@/lib/observability/request-id";

import { updateSessionAndGuard } from "./middleware/auth";

export async function middleware(request: NextRequest) {
  const requestId = request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();

  if (isDevApiBlocked() && request.nextUrl.pathname.startsWith("/api/dev")) {
    const res = NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    attachRequestHeaders(res.headers, requestId);
    return applySecurityHeaders(res);
  }

  const isApi = request.nextUrl.pathname.startsWith("/api/");
  const isAdminApi = request.nextUrl.pathname.startsWith("/api/admin");
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");

  const rateLimited = isAdmin
    ? checkAdminRateLimit(request)
    : isAdminApi
      ? checkAdminApiRateLimit(request)
      : isApi
        ? checkRateLimit(request, { max: 200, keyPrefix: "api" })
        : null;

  if (rateLimited) {
    attachRequestHeaders(rateLimited.headers, requestId);
    return applySecurityHeaders(rateLimited);
  }

  if (isApi) {
    const method = request.method.toUpperCase();
    if (method === "POST" || method === "PUT" || method === "PATCH") {
      const contentLength = request.headers.get("content-length");
      if (contentLength) {
        const length = Number.parseInt(contentLength, 10);
        const isWebhook = request.nextUrl.pathname.startsWith("/api/webhooks/");
        const maxBytes = isWebhook ? WEBHOOK_JSON_BODY_LIMIT : DEFAULT_JSON_BODY_LIMIT;
        if (!Number.isNaN(length) && length > maxBytes) {
          const res = NextResponse.json(
            { ok: false, error: "Request body too large" },
            { status: 413 },
          );
          attachRequestHeaders(res.headers, requestId);
          return applySecurityHeaders(res);
        }
      }
    }

    const csrf = validateCsrf(request);
    if (!csrf.ok) {
      const body =
        process.env.NODE_ENV === "production"
          ? { ok: false, error: "CSRF validation failed" }
          : { ok: false, error: "CSRF validation failed", reason: csrf.reason };
      const res = NextResponse.json(body, { status: 403 });
      attachRequestHeaders(res.headers, requestId);
      return applySecurityHeaders(res);
    }
  }

  const response = await updateSessionAndGuard(request);
  attachRequestHeaders(response.headers, requestId);
  return applySecurityHeaders(response);
}

/**
 * Session refresh on all page routes + admin/API security (rate limit, CSRF, guards).
 * Static assets are excluded via the matcher.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
