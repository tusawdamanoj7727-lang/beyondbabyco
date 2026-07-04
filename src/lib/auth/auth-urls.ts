import { getAppUrl, normalizeAppUrl } from "@/lib/app-url";

/** Canonical app origin for Supabase redirect allowlisting. */
export function getAuthBaseUrl(baseUrl?: string): string {
  return baseUrl ? normalizeAppUrl(baseUrl) : normalizeAppUrl(getAppUrl());
}

/** Supabase auth callback — must be allowlisted in Supabase Dashboard redirect URLs. */
export function authCallbackUrl(params?: {
  next?: string;
  type?: string;
  baseUrl?: string;
}): string {
  const url = new URL("/auth/callback", `${getAuthBaseUrl(params?.baseUrl)}/`);
  if (params?.next) url.searchParams.set("next", params.next);
  if (params?.type) url.searchParams.set("type", params.type);
  return url.toString();
}

/** All redirect URLs to allowlist in Supabase Dashboard (Site URL + Redirect URLs). */
export function supabaseRedirectAllowlist(baseUrl?: string): string[] {
  const base = getAuthBaseUrl(baseUrl);
  return [
    base,
    `${base}/auth/callback`,
    `${base}/auth/callback?*`,
    authCallbackUrl({ baseUrl: base }),
    authCallbackUrl({ baseUrl: base, type: "signup", next: "/account?verified=1" }),
    authCallbackUrl({ baseUrl: base, type: "recovery", next: "/reset-password" }),
    authCallbackUrl({ baseUrl: base, next: "/account" }),
    authCallbackUrl({ baseUrl: base, next: "/checkout" }),
  ];
}

export function passwordResetRedirectUrl(baseUrl?: string): string {
  return authCallbackUrl({ baseUrl, type: "recovery", next: "/reset-password" });
}

export function emailVerificationRedirectUrl(baseUrl?: string): string {
  return authCallbackUrl({ baseUrl, type: "signup", next: "/account?verified=1" });
}

export function oauthRedirectUrl(next = "/account", baseUrl?: string): string {
  return authCallbackUrl({ next, baseUrl });
}
