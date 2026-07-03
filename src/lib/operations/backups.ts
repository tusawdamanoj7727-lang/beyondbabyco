import type { BackupStatusItem } from "./types";

/** Informational backup status — no live backup tooling in repo. */
export function getBackupStatus(): BackupStatusItem[] {
  return [
    {
      id: "database",
      label: "Database backup",
      status: "warning",
      detail: "Use Supabase Dashboard → Database → Backups (Pro plan) or pg_dump for self-hosted",
      lastRun: undefined,
    },
    {
      id: "media",
      label: "Media backup",
      status: "warning",
      detail: "Supabase Storage — enable bucket replication or periodic sync to cold storage",
    },
    {
      id: "config",
      label: "Configuration export",
      status: "ready",
      detail: "Environment variables documented in .env.example — store secrets in deployment vault",
    },
    {
      id: "restore",
      label: "Restore guide",
      status: "ready",
      detail: "Restore DB from Supabase backup snapshot; redeploy app with matching env; revalidate CDN cache",
    },
  ];
}

export function getRestoreGuideSteps(): string[] {
  return [
    "Identify the backup snapshot or pg_dump file to restore.",
    "Restore database via Supabase Dashboard or psql against a maintenance window.",
    "Verify RLS policies and migrations match the deployed app version.",
    "Restore media from Supabase Storage backup if applicable.",
    "Redeploy the application with the same environment variable set.",
    "Run health checks at /api/health and /admin/operations.",
    "Verify payment webhooks and cron jobs with production URLs.",
  ];
}
