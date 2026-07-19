export type OpsStatus = "ready" | "warning" | "missing" | "error" | "ok" | "degraded";

export type EmailProviderId = "smtp";

export type ErrorTrackingProviderId = "sentry" | "better_stack" | "logtail" | "none";

export const OPERATIONS_NAV = [
  { href: "/admin/operations", label: "Health" },
  { href: "/admin/operations/queues", label: "Queues" },
  { href: "/admin/operations/monitoring", label: "Monitoring" },
  { href: "/admin/operations/security", label: "Security" },
  { href: "/admin/operations/performance", label: "Performance" },
  { href: "/admin/operations/backups", label: "Backups" },
  { href: "/admin/operations/integrations", label: "Integrations" },
  { href: "/admin/operations/deployment", label: "Deployment" },
] as const;

export interface OpsCheckItem {
  id: string;
  label: string;
  status: OpsStatus;
  detail?: string;
  hint?: string;
}

export interface HealthProbe {
  name: string;
  status: "ok" | "degraded" | "error";
  latencyMs?: number;
  detail?: string;
}

export interface DeploymentCheckItem {
  id: string;
  label: string;
  status: OpsStatus;
  detail: string;
  category: "infrastructure" | "integrations" | "seo" | "security" | "automation";
}

export interface IntegrationProviderStatus {
  id: string;
  label: string;
  configured: boolean;
  connected: boolean;
  status: OpsStatus;
  detail?: string;
  missingEnv?: string[];
}

export interface BackupStatusItem {
  id: string;
  label: string;
  status: OpsStatus;
  lastRun?: string;
  detail: string;
}

export interface PerformanceReportItem {
  id: string;
  label: string;
  value: string;
  hint?: string;
  status?: OpsStatus;
}
