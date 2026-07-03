import "server-only";

import { getDelhiveryConfig } from "./config";
import { checkServiceability } from "./client";
import { logger } from "@/lib/observability/logger";

export interface DelhiveryHealthResult {
  status: "ok" | "degraded" | "error";
  configured: boolean;
  production: boolean;
  baseUrl: string;
  webhookSecretSet: boolean;
  detail: string;
}

/** Production Delhivery health probe — pincode serviceability check. */
export async function checkDelhiveryHealth(): Promise<DelhiveryHealthResult> {
  const config = getDelhiveryConfig();
  const production = config.baseUrl.includes("track.delhivery.com");

  if (!config.isConfigured) {
    return {
      status: "error",
      configured: false,
      production,
      baseUrl: config.baseUrl,
      webhookSecretSet: Boolean(config.webhookSecret),
      detail: "DELHIVERY_API_KEY not configured",
    };
  }

  if (process.env.NODE_ENV === "production" && !production) {
    return {
      status: "degraded",
      configured: true,
      production: false,
      baseUrl: config.baseUrl,
      webhookSecretSet: Boolean(config.webhookSecret),
      detail: "Production env using non-production Delhivery base URL",
    };
  }

  if (process.env.NODE_ENV === "production" && !config.webhookSecret) {
    return {
      status: "degraded",
      configured: true,
      production,
      baseUrl: config.baseUrl,
      webhookSecretSet: false,
      detail: "DELHIVERY_WEBHOOK_SECRET not set",
    };
  }

  try {
    const result = await checkServiceability("110001");
    if (result.serviceable !== undefined) {
      return {
        status: "ok",
        configured: true,
        production,
        baseUrl: config.baseUrl,
        webhookSecretSet: Boolean(config.webhookSecret),
        detail: `API reachable (${config.baseUrl})`,
      };
    }
    return {
      status: "degraded",
      configured: true,
      production,
      baseUrl: config.baseUrl,
      webhookSecretSet: Boolean(config.webhookSecret),
      detail: "Serviceability response empty",
    };
  } catch (err) {
    logger.warn("delhivery.health.failed", { error: err });
    return {
      status: "degraded",
      configured: true,
      production,
      baseUrl: config.baseUrl,
      webhookSecretSet: Boolean(config.webhookSecret),
      detail: err instanceof Error ? err.message : "Health probe failed",
    };
  }
}
