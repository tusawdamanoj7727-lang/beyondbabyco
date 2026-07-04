import "server-only";

import { headers } from "next/headers";

import {
  getAppUrl,
  normalizeAppUrl,
} from "@/lib/app-url";

function isLocalhostOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Origin of the current request (e.g. https://beyondbabyco.in). */
export async function getRequestOrigin(): Promise<string | null> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;

  const forwardedProto = h.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    forwardedProto ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return normalizeAppUrl(`${proto}://${host}`);
}

/**
 * Base URL for Supabase auth redirects from server actions.
 * Uses the live request host so OAuth never sends production users to localhost.
 */
export async function getAuthBaseUrlForRequest(): Promise<string> {
  const origin = await getRequestOrigin();
  if (origin) {
    if (process.env.NODE_ENV === "production" && isLocalhostOrigin(origin)) {
      return getAppUrl();
    }
    return origin;
  }
  return getAppUrl();
}
