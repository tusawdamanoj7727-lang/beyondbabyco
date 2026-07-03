import "server-only";

import { getAggregatedHealth, getDiskUsageHint } from "@/lib/operations/health";
import { getSecurityChecks } from "@/lib/operations/security";
import { getDeploymentChecklist, getDeploymentSummary } from "@/lib/operations/deployment";
import { getBackupStatus, getRestoreGuideSteps } from "@/lib/operations/backups";
import { getPerformanceReport, getLighthouseChecklist } from "@/lib/operations/performance";
import { getErrorTrackingStatus, listErrorTrackingProviders } from "@/lib/operations/error-tracking";
import { checkEmailProviderHealth, getEmailProviderConfig } from "@/lib/operations/email";
import { getAnalyticsIntegrationStatuses } from "@/lib/analytics/integrations";
import { getProductionEnvWarnings } from "@/lib/env.validation";
import type { OpsCheckItem } from "@/lib/operations/types";

export interface OperationsOverview {
  health: Awaited<ReturnType<typeof getAggregatedHealth>>;
  diskUsage: string;
  envWarnings: string[];
  security: OpsCheckItem[];
  deployment: ReturnType<typeof getDeploymentChecklist>;
  deploymentSummary: ReturnType<typeof getDeploymentSummary>;
  backups: ReturnType<typeof getBackupStatus>;
  restoreSteps: string[];
  performance: ReturnType<typeof getPerformanceReport>;
  lighthouse: ReturnType<typeof getLighthouseChecklist>;
  email: Awaited<ReturnType<typeof checkEmailProviderHealth>>;
  emailConfig: ReturnType<typeof getEmailProviderConfig>;
  analytics: ReturnType<typeof getAnalyticsIntegrationStatuses>;
  errorTracking: ReturnType<typeof getErrorTrackingStatus>;
  errorTrackingProviders: ReturnType<typeof listErrorTrackingProviders>;
}

export async function getOperationsOverview(): Promise<OperationsOverview> {
  const [health, email] = await Promise.all([getAggregatedHealth(), checkEmailProviderHealth()]);

  return {
    health,
    diskUsage: getDiskUsageHint(),
    envWarnings: getProductionEnvWarnings(),
    security: getSecurityChecks(),
    deployment: getDeploymentChecklist(),
    deploymentSummary: getDeploymentSummary(),
    backups: getBackupStatus(),
    restoreSteps: getRestoreGuideSteps(),
    performance: getPerformanceReport(),
    lighthouse: getLighthouseChecklist(),
    email,
    emailConfig: getEmailProviderConfig(),
    analytics: getAnalyticsIntegrationStatuses(),
    errorTracking: getErrorTrackingStatus(),
    errorTrackingProviders: listErrorTrackingProviders(),
  };
}
