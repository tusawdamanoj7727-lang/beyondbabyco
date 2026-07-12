import "server-only";

import { getSmtpConfig, isSmtpConfigured, validateSmtpEnv } from "@/lib/email/config";

export interface EmailProviderConfig {
  provider: "smtp" | null;
  fromEmail: string | null;
  fromName: string | null;
  replyTo: string | null;
  maxRetries: number;
  retryDelayMs: number;
}

export function getEmailProviderId(): "smtp" | null {
  return isSmtpConfigured() ? "smtp" : null;
}

export function getEmailProviderConfig(): EmailProviderConfig {
  const smtp = getSmtpConfig();
  if (!smtp) {
    return {
      provider: null,
      fromEmail: null,
      fromName: null,
      replyTo: null,
      maxRetries: 3,
      retryDelayMs: 1_000,
    };
  }

  const fromMatch = smtp.from.match(/^(.+?)\s*<([^>]+)>$/);
  return {
    provider: "smtp",
    fromEmail: fromMatch?.[2] ?? smtp.from,
    fromName: fromMatch?.[1]?.trim() ?? "BeyondBabyCo",
    replyTo: smtp.replyTo,
    maxRetries: smtp.maxRetries,
    retryDelayMs: smtp.retryDelayMs,
  };
}

export function getEmailProviderEnvRequirements(): string[] {
  return ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM"];
}

export function validateEmailProviderEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  return validateSmtpEnv();
}

export { isSmtpConfigured };
