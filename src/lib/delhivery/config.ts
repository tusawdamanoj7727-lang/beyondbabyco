import "server-only";

/**
 * Delhivery configuration — server-side only. Never import from client components.
 */
export interface DelhiveryConfig {
  apiKey: string;
  baseUrl: string;
  pickupLocation: string;
  webhookSecret: string | null;
  isConfigured: boolean;
}

const PRODUCTION_BASE = "https://track.delhivery.com";
const STAGING_BASE = "https://staging-express.delhivery.com";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Resolve Delhivery API config from environment variables. */
export function getDelhiveryConfig(): DelhiveryConfig {
  const apiKey = process.env.DELHIVERY_API_KEY?.trim() ?? "";
  const explicitBase = process.env.DELHIVERY_BASE_URL?.trim();
  const baseUrl = normalizeBaseUrl(
    explicitBase ||
      (process.env.NODE_ENV === "production" ? PRODUCTION_BASE : STAGING_BASE),
  );
  const pickupLocation = process.env.DELHIVERY_PICKUP_LOCATION?.trim() ?? "BeyondBabyCo Warehouse";
  const webhookSecret = process.env.DELHIVERY_WEBHOOK_SECRET?.trim() || null;

  return {
    apiKey,
    baseUrl,
    pickupLocation,
    webhookSecret,
    isConfigured: Boolean(apiKey),
  };
}

export function requireDelhiveryConfig(): DelhiveryConfig {
  const config = getDelhiveryConfig();
  if (!config.isConfigured) {
    throw new Error(
      "Delhivery is not configured. Set DELHIVERY_API_KEY and DELHIVERY_BASE_URL in .env.local.",
    );
  }
  return config;
}
