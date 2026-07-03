/**
 * Single source of truth for the public app origin.
 * All Supabase auth redirect URLs must derive from NEXT_PUBLIC_APP_URL.
 */

export function normalizeAppUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/**
 * Returns NEXT_PUBLIC_APP_URL (required). No localhost fallbacks.
 * In test, falls back to http://localhost:3000 only when unset (CI).
 */
export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return normalizeAppUrl(configured);
  }

  if (process.env.NODE_ENV === "test") {
    return "http://localhost:3000";
  }

  throw new Error(
    "NEXT_PUBLIC_APP_URL is required. Set it in .env.local to match your running dev server (run npm run check:auth).",
  );
}

/** Parse port from a base URL (defaults 443/80 when omitted). */
export function getAppUrlPort(baseUrl?: string): number {
  const url = new URL(baseUrl ?? getAppUrl());
  if (url.port) return Number(url.port);
  return url.protocol === "https:" ? 443 : 80;
}

/** True when request origin matches configured NEXT_PUBLIC_APP_URL. */
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
