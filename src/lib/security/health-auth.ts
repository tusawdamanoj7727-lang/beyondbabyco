import "server-only";

import { jsonError, jsonOk } from "@/lib/api/route-helpers";
import { timingSafeEqualString } from "@/lib/security/timing-safe";
import { isDeployedEnvironment, isLocalDevelopment } from "@/lib/security/webhook-auth";

function healthCheckSecret(): string | null {
  return (
    process.env.HEALTH_CHECK_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    null
  );
}

/** True when the request presents a valid health monitoring Bearer token. */
export function isHealthCheckAuthorized(request: Request): boolean {
  const secret = healthCheckSecret();
  if (!secret) {
    return isLocalDevelopment();
  }
  const header = request.headers.get("authorization")?.trim() ?? "";
  const expected = `Bearer ${secret}`;
  return timingSafeEqualString(header, expected);
}

/**
 * Blocks unauthenticated access to detailed health probes in deployed environments.
 */
export function requireHealthCheckAuth(request: Request) {
  if (isHealthCheckAuthorized(request)) {
    return null;
  }

  if (isDeployedEnvironment()) {
    return jsonError("Unauthorized", 401);
  }

  return jsonError("Unauthorized", 401);
}

/** Public-safe health payload — no infrastructure internals. */
export function publicHealthStatusResponse(
  status: "ok" | "degraded" | "error",
  httpStatus = status === "error" ? 503 : 200,
) {
  if (httpStatus === 401) {
    return jsonError("Unauthorized", 401);
  }
  return jsonOk({ status }, httpStatus);
}
