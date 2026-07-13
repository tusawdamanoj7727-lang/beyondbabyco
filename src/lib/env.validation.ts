import { z } from "zod";

import { getAppUrl as resolveAppUrl } from "./app-url";

/**
 * Environment validation schema.
 * Public vars are validated at runtime when accessed; server secrets via `secrets` module.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
});

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnvConfig = z.infer<typeof serverEnvSchema>;

let cachedPublic: PublicEnv | null = null;

/** Validate public environment variables (safe to call at startup). */
export function validatePublicEnv(): PublicEnv {
  if (cachedPublic) return cachedPublic;

  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!result.success) {
    const msg = result.error.issues.map((i) => i.message).join("; ");
    throw new Error(`Environment validation failed: ${msg}`);
  }

  cachedPublic = result.data;
  return cachedPublic;
}

/** Validate server/runtime config. */
export function validateServerEnv(): ServerEnvConfig {
  const result = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });

  if (!result.success) {
    throw new Error(`Server env validation failed: ${result.error.message}`);
  }

  return result.data;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getAppUrl(): string {
  return resolveAppUrl();
}

/** Production checklist — warn if secrets missing (non-throwing). */
export function getProductionEnvWarnings(): string[] {
  const warnings: string[] = [];
  if (!isProduction()) return warnings;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push("SUPABASE_SERVICE_ROLE_KEY not set (required for admin operations at scale)");
  }
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    warnings.push("NEXT_PUBLIC_APP_URL not set (recommended for CSRF/origin validation)");
  }
  if (!process.env.CRON_SECRET) {
    warnings.push("CRON_SECRET not set (required for secure cron endpoints in production)");
  }
  if (!process.env.HEALTH_CHECK_SECRET && !process.env.CRON_SECRET) {
    warnings.push("HEALTH_CHECK_SECRET not set (detailed health probes require Bearer auth in production)");
  }
  if (!process.env.DELHIVERY_WEBHOOK_SECRET) {
    warnings.push("DELHIVERY_WEBHOOK_SECRET not set (webhook verification disabled)");
  }
  if (process.env.AI_DEV_ENABLED === "true") {
    warnings.push("AI_DEV_ENABLED is true in production — dev AI routes may be exposed");
  }
  if (!process.env.SENTRY_DSN && !process.env.ERROR_TRACKING_DSN && !process.env.LOGTAIL_SOURCE_TOKEN) {
    warnings.push("Error tracking DSN not configured (SENTRY_DSN, ERROR_TRACKING_DSN, or LOGTAIL_SOURCE_TOKEN)");
  }
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    warnings.push("RAZORPAY_WEBHOOK_SECRET not set (webhook HMAC verification requires dedicated secret)");
  }
  if (!process.env.RAZORPAY_KEY_ID?.trim() && !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim()) {
    warnings.push("RAZORPAY_KEY_ID not set (online payments disabled unless configured in Admin → Payment Gateways)");
  }
  if (!process.env.RAZORPAY_KEY_SECRET?.trim()) {
    warnings.push("RAZORPAY_KEY_SECRET not set (online payments disabled unless configured in Admin → Payment Gateways)");
  }
  if (!process.env.SMTP_HOST?.trim() || !process.env.SMTP_USER?.trim() || !process.env.SMTP_PASS?.trim()) {
    warnings.push("SMTP not configured (transactional email disabled)");
  }
  if (!process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID && !process.env.NEXT_PUBLIC_META_PIXEL_ID) {
    warnings.push("No analytics providers configured (GA4 or Meta Pixel)");
  }

  return warnings;
}
