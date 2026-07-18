import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_JSON_BODY_LIMIT, WEBHOOK_JSON_BODY_LIMIT } from "@/lib/api/request";
import { validateCsrf } from "@/lib/security/csrf";
import { isDevApiBlocked } from "@/lib/security/dev-api";
import { applySecurityHeaders } from "@/lib/security/headers";
import {
  checkAdminApiRateLimit,
  checkAdminRateLimit,
  checkAuthRateLimit,
  checkCheckoutRateLimit,
  checkRateLimitAsync,
  checkWebhookRateLimit,
} from "@/lib/security/rate-limit";
import { generateRequestId, attachRequestHeaders, REQUEST_ID_HEADER } from "@/lib/observability/request-id";

import { updateSessionAndGuard } from "./middleware/auth";

export async function middleware(request: NextRequest) {
  const requestId = request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";

  // Apex is canonical — redirect www once TLS for www is valid (Vercel domain alias).
  if (host === "www.beyondbabyco.in") {
    const url = request.nextUrl.clone();
    url.hostname = "beyondbabyco.in";
    url.protocol = "https:";
    const res = NextResponse.redirect(url, 308);
    attachRequestHeaders(res.headers, requestId);
    return applySecurityHeaders(res);
  }

  if (isDevApiBlocked() && request.nextUrl.pathname.startsWith("/api/dev")) {
    const res = NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    attachRequestHeaders(res.headers, requestId);
    return applySecurityHeaders(res);
  }

  const path = request.nextUrl.pathname;
  const isApi = path.startsWith("/api/");
  const isAdminApi = path.startsWith("/api/admin");
  const isAdmin = path.startsWith("/admin");
  const isWebhook = path.startsWith("/api/webhooks/");
  const isAuthApi =
    path.startsWith("/api/auth") || path === "/login" || path === "/register" || path.startsWith("/forgot-password");
  const isCheckoutApi = path.startsWith("/api/checkout") || path === "/checkout";

  const rateLimited = isWebhook
    ? await checkWebhookRateLimit(request)
    : isAdmin
      ? await checkAdminRateLimit(request)
      : isAdminApi
        ? await checkAdminApiRateLimit(request)
        : isAuthApi
          ? await checkAuthRateLimit(request)
          : isCheckoutApi
            ? await checkCheckoutRateLimit(request)
            : isApi
              ? await checkRateLimitAsync(request, { max: 200, keyPrefix: "api" })
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
