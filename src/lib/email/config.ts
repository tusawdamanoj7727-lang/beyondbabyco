import "server-only";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  replyTo: string | null;
  maxRetries: number;
  retryDelayMs: number;
  adminAlertEmail: string | null;
}

function parseFromAddress(raw: string | undefined): string | null {
  const value = raw?.trim();
  return value || null;
}

function extractEmailAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] ?? from).trim();
}

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = parseFromAddress(process.env.EMAIL_FROM?.trim());

  if (!host || !user || !pass || !from) return null;

  const port = Number(process.env.SMTP_PORT ?? 465);
  const secure =
    process.env.SMTP_SECURE === "true" || port === 465;

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
    replyTo: process.env.EMAIL_REPLY_TO?.trim() || extractEmailAddress(from),
    maxRetries: Number(process.env.EMAIL_MAX_RETRIES ?? 3),
    retryDelayMs: Number(process.env.EMAIL_RETRY_DELAY_MS ?? 1_000),
    adminAlertEmail:
      process.env.ADMIN_ALERT_EMAIL?.trim() ||
      extractEmailAddress(from) ||
      user,
  };
}

export function isSmtpConfigured(): boolean {
  return getSmtpConfig() !== null;
}

export function validateSmtpEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!process.env.SMTP_HOST?.trim()) missing.push("SMTP_HOST");
  if (!process.env.SMTP_PORT?.trim()) missing.push("SMTP_PORT");
  if (!process.env.SMTP_USER?.trim()) missing.push("SMTP_USER");
  if (!process.env.SMTP_PASS?.trim()) missing.push("SMTP_PASS");
  if (!process.env.EMAIL_FROM?.trim()) missing.push("EMAIL_FROM");

  if (process.env.SMTP_PORT === "587" && process.env.SMTP_SECURE !== "true") {
    warnings.push("Port 587 typically uses STARTTLS (SMTP_SECURE=false)");
  }

  return { valid: missing.length === 0, missing, warnings };
}
