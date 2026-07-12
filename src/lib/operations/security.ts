import "server-only";

import { getAppUrl, getProductionEnvWarnings, isProduction } from "@/lib/env.validation";
import { SECURITY_HEADERS } from "@/lib/security/headers";
import { secrets } from "@/lib/security/secrets";
import type { OpsCheckItem } from "./types";

const SECRET_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "RAZORPAY_KEY_SECRET",
  "DELHIVERY_API_KEY",
  "DELHIVERY_WEBHOOK_SECRET",
  "SMTP_PASS",
  "SENTRY_DSN",
  "ERROR_TRACKING_DSN",
] as const;

export function getSecurityChecks(): OpsCheckItem[] {
  const appUrl = getAppUrl();
  const isHttps = appUrl.startsWith("https://");
  const prodWarnings = getProductionEnvWarnings();
  const missingSecrets = SECRET_KEYS.filter((k) => !process.env[k]?.trim());

  return [
    {
      id: "https",
      label: "HTTPS",
      status: isProduction() ? (isHttps ? "ready" : "missing") : isHttps ? "ready" : "warning",
      detail: isHttps ? "App URL uses HTTPS" : `App URL is ${appUrl}`,
      hint: isProduction() && !isHttps ? "Set NEXT_PUBLIC_APP_URL to https://" : undefined,
    },
    {
      id: "env-validation",
      label: "Environment validation",
      status: prodWarnings.length === 0 ? "ready" : "warning",
      detail: prodWarnings.length ? `${prodWarnings.length} warning(s)` : "No production warnings",
      hint: prodWarnings[0],
    },
    {
      id: "missing-secrets",
      label: "Missing secrets",
      status: missingSecrets.length === 0 ? "ready" : missingSecrets.length <= 3 ? "warning" : "missing",
      detail: missingSecrets.length ? missingSecrets.join(", ") : "All tracked secrets present",
    },
    {
      id: "webhook-validation",
      label: "Webhook validation",
      status: secrets.delhiveryWebhookSecret ? "ready" : "warning",
      detail: secrets.delhiveryWebhookSecret
        ? "Delhivery webhook secret configured"
        : "DELHIVERY_WEBHOOK_SECRET not set",
    },
    {
      id: "api-health",
      label: "API health endpoints",
      status: "ready",
      detail: "/api/health and sub-routes available",
    },
    {
      id: "rate-limiting",
      label: "Rate limiting",
      status: "ready",
      detail: "In-memory sliding window on /admin/* and /api/*",
    },
    {
      id: "cookie-settings",
      label: "Cookie settings",
      status: "ready",
      detail: "Supabase auth cookies via @supabase/ssr (httpOnly, secure in prod)",
    },
    {
      id: "security-headers",
      label: "Security headers",
      status: Object.keys(SECURITY_HEADERS).length >= 5 ? "ready" : "warning",
      detail: `${Object.keys(SECURITY_HEADERS).join(", ")}`,
    },
    {
      id: "csrf",
      label: "CSRF protection",
      status: "ready",
      detail: "Origin/Referer validation on API mutations; Server Actions built-in",
    },
    {
      id: "rls",
      label: "Row Level Security",
      status: "ready",
      detail: "Supabase RLS enabled on tables — verify policies in Supabase Dashboard",
      hint: "Read-only summary; no schema changes from admin",
    },
  ];
}
