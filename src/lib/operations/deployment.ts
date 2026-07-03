import "server-only";

import { getAppUrl, isProduction } from "@/lib/env.validation";
import { isAiDevEnabled } from "@/lib/ai/config";
import { validateEmailProviderEnv } from "./email/config";
import { getAnalyticsIntegrationStatuses } from "@/lib/analytics/integrations";
import { getErrorTrackingStatus } from "./error-tracking";
import type { DeploymentCheckItem, OpsStatus } from "./types";

function statusFromBool(ok: boolean, partial?: boolean): OpsStatus {
  if (ok) return "ready";
  if (partial) return "warning";
  return "missing";
}

export function getDeploymentChecklist(): DeploymentCheckItem[] {
  const appUrl = getAppUrl();
  const emailValidation = validateEmailProviderEnv();
  const analytics = getAnalyticsIntegrationStatuses();
  const errorTracking = getErrorTrackingStatus();
  const analyticsConfigured = analytics.some((a) => a.configured);

  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  const hasRazorpay = Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
  const hasDelhivery = Boolean(process.env.DELHIVERY_API_KEY?.trim() && process.env.DELHIVERY_BASE_URL?.trim());
  const hasCron = Boolean(process.env.CRON_SECRET?.trim());
  const prodUrlReady = isProduction() ? appUrl.startsWith("https://") && !appUrl.includes("localhost") : true;

  return [
    {
      id: "prod-url",
      label: "Production URL",
      status: statusFromBool(prodUrlReady, !isProduction()),
      detail: appUrl,
      category: "infrastructure",
    },
    {
      id: "supabase",
      label: "Supabase",
      status: statusFromBool(hasSupabase && hasServiceRole, hasSupabase),
      detail: hasSupabase
        ? hasServiceRole
          ? "Public + service role configured"
          : "Public keys only — service role missing"
        : "Supabase URL/anon key missing",
      category: "infrastructure",
    },
    {
      id: "razorpay",
      label: "Razorpay",
      status: statusFromBool(hasRazorpay),
      detail: hasRazorpay ? "Key ID and secret present" : "RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing",
      category: "integrations",
    },
    {
      id: "delhivery",
      label: "Delhivery",
      status: statusFromBool(hasDelhivery),
      detail: hasDelhivery ? "API key and base URL present" : "Delhivery credentials incomplete",
      category: "integrations",
    },
    {
      id: "smtp",
      label: "Email (SMTP/provider)",
      status: statusFromBool(emailValidation.valid, Boolean(process.env.EMAIL_PROVIDER)),
      detail: emailValidation.valid
        ? `Provider: ${process.env.EMAIL_PROVIDER}`
        : emailValidation.missing.length
          ? `Missing: ${emailValidation.missing.join(", ")}`
          : "EMAIL_PROVIDER not set",
      category: "integrations",
    },
    {
      id: "analytics",
      label: "Analytics",
      status: statusFromBool(analyticsConfigured, analytics.some((a) => a.connected)),
      detail: analyticsConfigured
        ? `${analytics.filter((a) => a.configured).map((a) => a.label).join(", ")} configured`
        : "No analytics providers configured",
      category: "integrations",
    },
    {
      id: "robots",
      label: "Robots.txt",
      status: "ready",
      detail: "Generated at /robots.txt via src/app/robots.ts",
      category: "seo",
    },
    {
      id: "sitemap",
      label: "Sitemap",
      status: "ready",
      detail: "Generated at /sitemap.xml via src/app/sitemap.ts",
      category: "seo",
    },
    {
      id: "favicons",
      label: "Favicons",
      status: "warning",
      detail: "Verify favicon.ico and app icons in public/ or app/ metadata",
      category: "seo",
    },
    {
      id: "open-graph",
      label: "Open Graph",
      status: "ready",
      detail: "Native Metadata API and page metadata configured — verify per-route OG tags",
      category: "seo",
    },
    {
      id: "social-cards",
      label: "Social cards",
      status: "warning",
      detail: "Add og:image assets for key landing pages before launch",
      category: "seo",
    },
    {
      id: "cron",
      label: "Cron jobs",
      status: statusFromBool(hasCron),
      detail: hasCron ? "CRON_SECRET set — sync-shipments cron available" : "CRON_SECRET not configured",
      category: "automation",
    },
    {
      id: "webhooks",
      label: "Webhook URLs",
      status: statusFromBool(Boolean(process.env.DELHIVERY_WEBHOOK_SECRET), hasDelhivery),
      detail: `${appUrl}/api/webhooks/* — verify Delhivery/Razorpay callback URLs`,
      category: "automation",
    },
    {
      id: "ai-disabled",
      label: "AI disabled in production",
      status: isProduction() && isAiDevEnabled() ? "missing" : "ready",
      detail:
        isProduction() && isAiDevEnabled()
          ? "AI_DEV_ENABLED is true in production"
          : isAiDevEnabled()
            ? "AI enabled in development"
            : "AI dev tools disabled",
      category: "security",
    },
    {
      id: "error-tracking",
      label: "Error tracking",
      status: statusFromBool(errorTracking.configured),
      detail: errorTracking.configured
        ? `${errorTracking.provider} configured`
        : "No error tracking DSN configured",
      category: "security",
    },
  ];
}

export function getDeploymentSummary(): { ready: number; warning: number; missing: number; total: number } {
  const items = getDeploymentChecklist();
  return {
    ready: items.filter((i) => i.status === "ready").length,
    warning: items.filter((i) => i.status === "warning").length,
    missing: items.filter((i) => i.status === "missing" || i.status === "error").length,
    total: items.length,
  };
}
