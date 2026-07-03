"use server";

import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { renderEmailTemplate } from "@/lib/communications/layout";
import { getEmailTemplate } from "@/lib/communications/templates/registry";
import { sendEmail } from "@/lib/operations/email/send";
import { validateEmailProviderEnv } from "@/lib/operations/email/config";
import {
  buildTestAnalyticsEvent,
  validateAnalyticsIntegration,
} from "@/lib/analytics/integrations";
import type { ExternalAnalyticsProvider } from "@/lib/analytics/types";
import { triggerSampleError } from "@/lib/observability/error-tracking";
import { logger } from "@/lib/observability/logger";
import { isProduction } from "@/lib/env.validation";

async function requireOpsAccess() {
  await requirePermission(PERMISSIONS.SETTINGS_MANAGE);
}

export type ActionResult = { ok: true; message: string; detail?: string } | { ok: false; error: string };

export async function sendTestEmailAction(to: string): Promise<ActionResult> {
  await requireOpsAccess();

  const validation = validateEmailProviderEnv();
  if (!validation.valid) {
    return { ok: false, error: `Email provider not configured: ${validation.missing.join(", ")}` };
  }

  const template = getEmailTemplate("welcome");
  if (!template) {
    return { ok: false, error: "Welcome template not found" };
  }

  const rendered = renderEmailTemplate(template, template.sampleData);
  const result = await sendEmail({
    to,
    subject: `[Test] ${rendered.subject}`,
    html: rendered.html,
    text: rendered.text,
    tags: ["ops-test"],
    metadata: { source: "admin_operations" },
  });

  logger.info("ops.test_email", { to, ok: result.ok, attempts: result.attempts });

  if (!result.ok) {
    return { ok: false, error: result.error ?? "Send failed" };
  }

  return {
    ok: true,
    message: `Test email sent to ${to}`,
    detail: `Provider message ID: ${result.id} (${result.attempts} attempt(s))`,
  };
}

export async function testAnalyticsEventAction(provider: ExternalAnalyticsProvider): Promise<ActionResult> {
  await requireOpsAccess();

  const validation = validateAnalyticsIntegration(provider);
  if (!validation.valid) {
    return { ok: false, error: `Not configured: ${validation.missing.join(", ")}` };
  }

  const event = buildTestAnalyticsEvent(provider);
  logger.info("ops.analytics_test_event", event);

  return {
    ok: true,
    message: `Test event prepared for ${provider}`,
    detail: JSON.stringify(event.payload),
  };
}

export async function triggerSampleErrorAction(): Promise<ActionResult> {
  await requireOpsAccess();

  if (isProduction()) {
    return { ok: false, error: "Sample errors are disabled in production" };
  }

  try {
    triggerSampleError();
    return { ok: true, message: "Sample error captured" };
  } catch (e) {
    return {
      ok: true,
      message: "Sample error triggered (check logs / error tracking)",
      detail: e instanceof Error ? e.message : undefined,
    };
  }
}

export async function checkEmailHealthAction(): Promise<ActionResult & { status?: string }> {
  await requireOpsAccess();

  const { checkEmailProviderHealth } = await import("@/lib/operations/email/health");
  const health = await checkEmailProviderHealth();

  return {
    ok: health.status !== "error",
    message: `Email provider: ${health.provider ?? "none"} — ${health.status}`,
    detail: health.detail,
    status: health.status,
  } as ActionResult & { status?: string };
}
