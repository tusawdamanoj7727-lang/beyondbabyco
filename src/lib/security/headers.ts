import type { NextResponse } from "next/server";

/**
 * Production security headers — CSP, XSS, clickjacking, HSTS, etc.
 * Applied via middleware and next.config.ts.
 */

const isProduction = process.env.NODE_ENV === "production";

/** HSTS / upgrade-insecure-requests only on HTTPS deploys — not local `next start` on HTTP. */
function isHttpsDeploy(): boolean {
  if (!isProduction) return false;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl?.startsWith("https://")) return true;
  if (process.env.VERCEL === "1") return true;
  if (process.env.DOCKER_BUILD === "1") return true;
  return false;
}

const isSecureOrigin = isHttpsDeploy();

/** Content Security Policy — tuned for Next.js + Supabase + Razorpay Checkout. */
export function buildContentSecurityPolicy(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).origin : "";

  // checkout.js (+ cdn risk scripts); frames for hosted checkout modal/iframe.
  // Production omits 'unsafe-eval' (Next does not require it for the storefront bundle).
  const scriptSrc = isProduction
    ? "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://cdn.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.facebook.com https://www.clarity.ms https://scripts.clarity.ms"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.facebook.com https://www.clarity.ms https://scripts.clarity.ms";

  const directives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:" + (supabaseHost ? ` ${supabaseHost}` : ""),
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://www.googletagmanager.com https://www.facebook.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];

  if (isSecureOrigin) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

export const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": buildContentSecurityPolicy(),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  ...(isSecureOrigin
    ? {
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      }
    : {}),
};

export function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function getNextConfigSecurityHeaders() {
  return Object.entries(SECURITY_HEADERS).map(([key, value]) => ({
    key,
    value,
  }));
}
