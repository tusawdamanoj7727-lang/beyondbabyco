import "server-only";

import { NextResponse } from "next/server";

import { jsonError } from "@/lib/api/route-helpers";
import { isDeployedEnvironment } from "@/lib/security/webhook-auth";

function cronSecret(): string | null {
  return process.env.CRON_SECRET?.trim() || null;
}

/**
 * Validates cron Bearer token.
 * Deployed environments always require CRON_SECRET; local dev requires it when set.
 */
export function requireCronAuth(request: Request): NextResponse | null {
  const secret = cronSecret();

  if (isDeployedEnvironment()) {
    if (!secret) {
      return jsonError("Cron not configured", 503);
    }
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return jsonError("Unauthorized", 401);
    }
    return null;
  }

  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return jsonError("Unauthorized", 401);
  }

  return null;
}
