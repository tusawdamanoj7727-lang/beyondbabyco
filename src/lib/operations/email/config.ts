import type { EmailProviderId } from "../types";

export interface EmailProviderConfig {
  provider: EmailProviderId | null;
  fromEmail: string | null;
  fromName: string | null;
  replyTo: string | null;
  maxRetries: number;
  retryDelayMs: number;
}

const VALID_PROVIDERS: EmailProviderId[] = ["resend", "sendgrid", "ses", "smtp"];

export function getEmailProviderId(): EmailProviderId | null {
  const raw = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (!raw || raw === "none" || raw === "disabled") return null;
  if (VALID_PROVIDERS.includes(raw as EmailProviderId)) return raw as EmailProviderId;
  return null;
}

export function getEmailProviderConfig(): EmailProviderConfig {
  return {
    provider: getEmailProviderId(),
    fromEmail: process.env.EMAIL_FROM?.trim() || process.env.EMAIL_FROM_ADDRESS?.trim() || null,
    fromName: process.env.EMAIL_FROM_NAME?.trim() || "BeyondBabyCo",
    replyTo: process.env.EMAIL_REPLY_TO?.trim() || null,
    maxRetries: Number(process.env.EMAIL_MAX_RETRIES ?? 3),
    retryDelayMs: Number(process.env.EMAIL_RETRY_DELAY_MS ?? 1_000),
  };
}

export function getEmailProviderEnvRequirements(provider: EmailProviderId): string[] {
  switch (provider) {
    case "resend":
      return ["EMAIL_PROVIDER=resend", "RESEND_API_KEY", "EMAIL_FROM"];
    case "sendgrid":
      return ["EMAIL_PROVIDER=sendgrid", "SENDGRID_API_KEY", "EMAIL_FROM"];
    case "ses":
      return ["EMAIL_PROVIDER=ses", "AWS_SES_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "EMAIL_FROM"];
    case "smtp":
      return ["EMAIL_PROVIDER=smtp", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM"];
    default:
      return [];
  }
}

export function validateEmailProviderEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  const config = getEmailProviderConfig();
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!config.provider) {
    missing.push("EMAIL_PROVIDER");
    return { valid: false, missing, warnings };
  }

  const required = getEmailProviderEnvRequirements(config.provider);
  for (const key of required) {
    if (key.includes("=")) continue;
    const value = process.env[key]?.trim();
    if (!value) missing.push(key);
  }

  if (!config.fromEmail) missing.push("EMAIL_FROM");

  if (config.provider === "smtp" && !process.env.SMTP_SECURE && process.env.SMTP_PORT !== "465") {
    warnings.push("SMTP_SECURE not set — using STARTTLS on port 587");
  }

  return { valid: missing.length === 0, missing, warnings };
}
