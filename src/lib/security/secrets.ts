import "server-only";

/**
 * Server-only secrets — never import from client components.
 * Values are validated lazily at access time.
 */

function requireSecret(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required secret: ${name}. Configure in your deployment environment.`);
    }
    return "";
  }
  return value;
}

export const secrets = {
  get supabaseServiceRoleKey(): string {
    return requireSecret("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get cronSecret(): string {
    return requireSecret("CRON_SECRET", process.env.CRON_SECRET);
  },
  get errorTrackingDsn(): string | undefined {
    return process.env.SENTRY_DSN || process.env.ERROR_TRACKING_DSN;
  },
  get delhiveryApiKey(): string {
    return process.env.DELHIVERY_API_KEY?.trim() ?? "";
  },
  get delhiveryBaseUrl(): string {
    return process.env.DELHIVERY_BASE_URL?.trim() ?? "";
  },
  get delhiveryWebhookSecret(): string {
    return process.env.DELHIVERY_WEBHOOK_SECRET?.trim() ?? "";
  },
};

/** Redact secrets for logs. */
export function redact(value: string | undefined, visible = 4): string {
  if (!value) return "[unset]";
  if (value.length <= visible * 2) return "***";
  return `${value.slice(0, visible)}…${value.slice(-visible)}`;
}
