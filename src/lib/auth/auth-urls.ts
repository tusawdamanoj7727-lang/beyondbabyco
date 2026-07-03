import { getAppUrl, normalizeAppUrl } from "@/lib/app-url";

/** Canonical app origin for Supabase redirect allowlisting. */
export function getAuthBaseUrl(): string {
  return normalizeAppUrl(getAppUrl());
}

/** Supabase auth callback — must be allowlisted in Supabase Dashboard redirect URLs. */
export function authCallbackUrl(params?: { next?: string; type?: string }): string {
  const url = new URL("/auth/callback", `${getAuthBaseUrl()}/`);
  if (params?.next) url.searchParams.set("next", params.next);
  if (params?.type) url.searchParams.set("type", params.type);
  return url.toString();
}

/** All redirect URLs to allowlist in Supabase Dashboard (Site URL + Redirect URLs). */
export function supabaseRedirectAllowlist(): string[] {
  const base = getAuthBaseUrl();
  return [
    base,
    `${base}/auth/callback`,
    `${base}/auth/callback?*`,
    authCallbackUrl(),
    authCallbackUrl({ type: "signup", next: "/account?verified=1" }),
    authCallbackUrl({ type: "recovery", next: "/reset-password" }),
    authCallbackUrl({ next: "/account" }),
    authCallbackUrl({ next: "/checkout" }),
  ];
}

export function passwordResetRedirectUrl(): string {
  return authCallbackUrl({ type: "recovery", next: "/reset-password" });
}

export function emailVerificationRedirectUrl(): string {
  return authCallbackUrl({ type: "signup", next: "/account?verified=1" });
}

export function oauthRedirectUrl(next = "/account"): string {
  return authCallbackUrl({ next });
}
