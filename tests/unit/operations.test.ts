import { describe, expect, it } from "vitest";

import { OPERATIONS_NAV } from "@/lib/operations/types";
import { validateEmailProviderEnv, getEmailProviderId } from "@/lib/operations/email/config";
import { getDeploymentChecklist, getDeploymentSummary } from "@/lib/operations/deployment";
import { getSecurityChecks } from "@/lib/operations/security";
import { getAnalyticsIntegrationStatuses, validateAnalyticsIntegration } from "@/lib/analytics/integrations";
import { getErrorTrackingStatus, listErrorTrackingProviders } from "@/lib/operations/error-tracking";
import { getBackupStatus, getRestoreGuideSteps } from "@/lib/operations/backups";
import { getPerformanceReport } from "@/lib/operations/performance";

describe("operations navigation", () => {
  it("defines operations hub routes", () => {
    expect(OPERATIONS_NAV.map((n) => n.label)).toEqual([
      "Health",
      "Monitoring",
      "Security",
      "Performance",
      "Backups",
      "Integrations",
      "Deployment",
    ]);
  });
});

describe("email provider config", () => {
  it("returns null when SMTP unset", () => {
    expect(getEmailProviderId()).toBeNull();
  });

  it("validates missing SMTP env", () => {
    const result = validateEmailProviderEnv();
    expect(result.valid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
  });
});

describe("deployment checklist", () => {
  it("includes production readiness items", () => {
    const items = getDeploymentChecklist();
    expect(items.length).toBeGreaterThanOrEqual(10);
    expect(items.some((i) => i.id === "supabase")).toBe(true);
    expect(items.some((i) => i.id === "razorpay")).toBe(true);
    expect(items.some((i) => i.id === "ai-disabled")).toBe(true);
  });

  it("summarizes checklist counts", () => {
    const summary = getDeploymentSummary();
    expect(summary.total).toBe(getDeploymentChecklist().length);
    expect(summary.ready + summary.warning + summary.missing).toBe(summary.total);
  });
});

describe("security checks", () => {
  it("includes CSRF and RLS summary", () => {
    const checks = getSecurityChecks();
    expect(checks.some((c) => c.id === "csrf")).toBe(true);
    expect(checks.some((c) => c.id === "rls")).toBe(true);
  });
});

describe("analytics integrations", () => {
  it("reports env-driven status for GA4, Meta, Clarity, Search Console", () => {
    const statuses = getAnalyticsIntegrationStatuses();
    expect(statuses).toHaveLength(4);
    for (const item of statuses) {
      expect(typeof item.configured).toBe("boolean");
      expect(typeof item.connected).toBe("boolean");
    }
  });

  it("validates GA4 env keys", () => {
    const result = validateAnalyticsIntegration("google_analytics_4");
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("NEXT_PUBLIC_GA4_MEASUREMENT_ID");
  });
});

describe("error tracking", () => {
  it("lists optional providers", () => {
    expect(listErrorTrackingProviders()).toHaveLength(3);
  });

  it("defaults to none when unconfigured", () => {
    const status = getErrorTrackingStatus();
    expect(status.provider).toBe("none");
    expect(status.configured).toBe(false);
  });
});

describe("backups and performance", () => {
  it("returns informational backup status", () => {
    expect(getBackupStatus().length).toBeGreaterThanOrEqual(3);
    expect(getRestoreGuideSteps().length).toBeGreaterThanOrEqual(5);
  });

  it("returns performance report items", () => {
    expect(getPerformanceReport().length).toBeGreaterThanOrEqual(5);
  });
});
