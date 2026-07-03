import "server-only";

import { createHmac } from "node:crypto";

import { getAppUrl, isProduction } from "@/lib/env.validation";
import { checkEmailProviderHealth } from "@/lib/operations/email/health";
import { getAnalyticsIntegrationStatuses } from "@/lib/analytics/integrations";
import { getErrorTrackingStatus } from "@/lib/operations/error-tracking";
import { getDeploymentChecklist, getDeploymentSummary } from "@/lib/operations/deployment";
import { checkDelhiveryHealth } from "@/lib/delhivery/health";
import { verifyRazorpayWebhookSignature } from "@/lib/admin/gateway-adapters/razorpay";
import type { OpsStatus } from "@/lib/operations/types";

export interface ReadinessCheck {
  id: string;
  label: string;
  category: string;
  status: OpsStatus;
  detail: string;
}

export interface ProductionReadinessReport {
  generatedAt: string;
  appUrl: string;
  https: boolean;
  summary: ReturnType<typeof getDeploymentSummary>;
  checks: ReadinessCheck[];
  integrations: {
    email: Awaited<ReturnType<typeof checkEmailProviderHealth>>;
    delhivery: Awaited<ReturnType<typeof checkDelhiveryHealth>>;
    analytics: ReturnType<typeof getAnalyticsIntegrationStatuses>;
    errorTracking: ReturnType<typeof getErrorTrackingStatus>;
    razorpayWebhook: { configured: boolean; detail: string };
  };
  readyForLaunch: boolean;
  blockers: string[];
}

export async function generateProductionReadinessReport(): Promise<ProductionReadinessReport> {
  const appUrl = getAppUrl();
  const https = appUrl.startsWith("https://");
  const [email, delhivery] = await Promise.all([checkEmailProviderHealth(), checkDelhiveryHealth()]);
  const analytics = getAnalyticsIntegrationStatuses();
  const errorTracking = getErrorTrackingStatus();
  const deployment = getDeploymentChecklist();
  const summary = getDeploymentSummary();

  const razorpayWebhookConfigured = Boolean(process.env.RAZORPAY_WEBHOOK_SECRET?.trim());
  const cronConfigured = Boolean(process.env.CRON_SECRET?.trim());

  const checks: ReadinessCheck[] = [
    {
      id: "https",
      label: "HTTPS",
      category: "Infrastructure",
      status: !isProduction() || https ? "ready" : "missing",
      detail: appUrl,
    },
    {
      id: "cron",
      label: "Cron secret",
      category: "Automation",
      status: cronConfigured ? "ready" : "missing",
      detail: cronConfigured ? "CRON_SECRET set" : "CRON_SECRET missing",
    },
    {
      id: "health",
      label: "Health endpoints",
      category: "Monitoring",
      status: "ready",
      detail: "/api/health available",
    },
    {
      id: "webhooks-razorpay",
      label: "Razorpay webhooks",
      category: "Payments",
      status: razorpayWebhookConfigured ? "ready" : "missing",
      detail: razorpayWebhookConfigured
        ? "RAZORPAY_WEBHOOK_SECRET configured; HMAC verification enabled"
        : "Set RAZORPAY_WEBHOOK_SECRET from Razorpay Dashboard",
    },
    {
      id: "webhooks-delhivery",
      label: "Delhivery webhooks",
      category: "Shipping",
      status: delhivery.webhookSecretSet ? "ready" : "warning",
      detail: delhivery.webhookSecretSet ? "Webhook secret configured" : "DELHIVERY_WEBHOOK_SECRET missing",
    },
    {
      id: "email",
      label: "Email provider",
      category: "Communications",
      status: email.status === "ok" ? "ready" : email.configured ? "warning" : "missing",
      detail: email.detail,
    },
    {
      id: "sentry",
      label: "Sentry",
      category: "Error tracking",
      status: errorTracking.configured ? "ready" : "warning",
      detail: errorTracking.detail,
    },
    {
      id: "ga4",
      label: "Google Analytics 4",
      category: "Analytics",
      status: analytics.find((a) => a.provider === "google_analytics_4")?.configured ? "ready" : "warning",
      detail: analytics.find((a) => a.provider === "google_analytics_4")?.configured
        ? "GA4 measurement ID set"
        : "NEXT_PUBLIC_GA4_MEASUREMENT_ID not set",
    },
    ...deployment.map((d) => ({
      id: d.id,
      label: d.label,
      category: d.category,
      status: d.status,
      detail: d.detail,
    })),
  ];

  const blockers = checks
    .filter((c) => c.status === "missing" || c.status === "error")
    .map((c) => `${c.label}: ${c.detail}`);

  const readyForLaunch = blockers.length === 0 && https;

  return {
    generatedAt: new Date().toISOString(),
    appUrl,
    https,
    summary,
    checks,
    integrations: {
      email,
      delhivery,
      analytics,
      errorTracking,
      razorpayWebhook: {
        configured: razorpayWebhookConfigured,
        detail: razorpayWebhookConfigured
          ? "X-Razorpay-Signature HMAC SHA256 verification active"
          : "Webhook secret required for production",
      },
    },
    readyForLaunch,
    blockers,
  };
}

/** Self-test for Razorpay webhook HMAC (used in ops validation). */
export function selfTestRazorpayWebhookVerification(secret: string): boolean {
  const body = '{"event":"payment.captured"}';
  const sig = createHmac("sha256", secret).update(body).digest("hex");
  return verifyRazorpayWebhookSignature(body, sig, secret);
}
