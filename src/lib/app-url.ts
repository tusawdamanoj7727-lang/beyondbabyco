/**
 * Single source of truth for the public app origin.
 * All Supabase auth redirect URLs must derive from NEXT_PUBLIC_APP_URL (or fallbacks below).
 */

export const PRODUCTION_APP_URL = "https://beyondbabyco.in";
export const DEVELOPMENT_APP_URL = "http://localhost:3000";

export function normalizeAppUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function resolveConfiguredAppUrl(): string | null {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim();
  if (!configured) return null;

  const normalized = normalizeAppUrl(configured);

  // Misconfigured production deploys often copy localhost from .env.local.
  if (process.env.NODE_ENV === "production" && isLocalhostUrl(normalized)) {
    return null;
  }

  return normalized;
}

/**
 * Canonical app origin for redirects, CSRF, and Supabase allowlisting.
 *
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL / APP_URL (unless localhost in production)
 * 2. https://{VERCEL_URL} on Vercel preview/production
 * 3. https://beyondbabyco.in in production
 * 4. http://localhost:3000 in development
 * 5. http://localhost:3000 in test (when unset)
 */
export function getAppUrl(): string {
  const configured = resolveConfiguredAppUrl();
  if (configured) return configured;

  if (process.env.NODE_ENV === "test") {
    return DEVELOPMENT_APP_URL;
  }

  if (process.env.NODE_ENV === "production") {
    const vercelUrl = process.env.VERCEL_URL?.trim();
    if (vercelUrl) return normalizeAppUrl(`https://${vercelUrl}`);
    return PRODUCTION_APP_URL;
  }

  return DEVELOPMENT_APP_URL;
}

/** Parse port from a base URL (defaults 443/80 when omitted). */
export function getAppUrlPort(baseUrl?: string): number {
  const url = new URL(baseUrl ?? getAppUrl());
  if (url.port) return Number(url.port);
  return url.protocol === "https:" ? 443 : 80;
}

/** True when request origin matches configured canonical app URL. */
export function appUrlMatchesOrigin(origin: string): boolean {
  try {
    return normalizeAppUrl(origin) === getAppUrl();
  } catch {
    return false;
  }
}

/** Dev-only: throws when configured APP_URL does not match the incoming request origin. */
export function assertAppUrlMatchesOrigin(origin: string): void {
  if (process.env.NODE_ENV !== "development") return;

  let configured: string;
  try {
    configured = getAppUrl();
  } catch (err) {
    throw new Error(
      `${err instanceof Error ? err.message : "NEXT_PUBLIC_APP_URL missing"} — run npm run check:auth`,
    );
  }

  const normalizedOrigin = normalizeAppUrl(origin);
  if (normalizedOrigin !== configured) {
    throw new Error(
      `APP_URL mismatch: NEXT_PUBLIC_APP_URL=${configured} but request origin=${normalizedOrigin}. ` +
        `Update .env.local and Supabase redirect URLs, then run npm run check:auth.`,
    );
  }
}
