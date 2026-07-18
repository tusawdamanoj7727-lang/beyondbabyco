import "server-only";

import { isProduction } from "@/lib/env.validation";
import { timingSafeEqualString } from "@/lib/security/timing-safe";

/**
 * Local machine development only (not Vercel preview/production).
 * Unsigned webhooks are allowed only here when no secret is configured.
 */
export function isLocalDevelopment(): boolean {
  return process.env.NODE_ENV === "development" && process.env.VERCEL !== "1";
}

/** Preview and production deployments (Vercel or NODE_ENV=production). */
export function isDeployedEnvironment(): boolean {
  return process.env.VERCEL === "1" || isProduction();
}

/**
 * Validates Delhivery webhook token.
 * Deployed environments always require a configured secret and matching header.
 */
export function verifyDelhiveryWebhookToken(
  request: Request,
  webhookSecret: string | null | undefined,
): boolean {
  const secret = webhookSecret?.trim();
  if (!secret) {
    return isLocalDevelopment();
  }

  const token = request.headers.get("x-delhivery-webhook-token")?.trim();
  if (!token) return false;
  return timingSafeEqualString(token, secret);
}
