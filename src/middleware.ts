import { NextResponse, type NextRequest } from "next/server";

import { validateCsrf } from "@/lib/security/csrf";
import { applySecurityHeaders } from "@/lib/security/headers";
import { checkAdminRateLimit, checkRateLimit } from "@/lib/security/rate-limit";
import { generateRequestId, attachRequestHeaders, REQUEST_ID_HEADER } from "@/lib/observability/request-id";

import { updateSessionAndGuard } from "./middleware/auth";

export async function middleware(request: NextRequest) {
  const requestId = request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();

  const isApi = request.nextUrl.pathname.startsWith("/api/");
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");

  const rateLimited = isAdmin
    ? checkAdminRateLimit(request)
    : isApi
      ? checkRateLimit(request, { max: 200, keyPrefix: "api" })
      : null;

  if (rateLimited) {
    attachRequestHeaders(rateLimited.headers, requestId);
    return applySecurityHeaders(rateLimited);
  }

  if (isApi) {
    const csrf = validateCsrf(request);
    if (!csrf.ok) {
      const body =
        process.env.NODE_ENV === "production"
          ? { error: "CSRF validation failed" }
          : { error: "CSRF validation failed", reason: csrf.reason };
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
