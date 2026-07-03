import type { AnalyticsIntegrationStatus, ExternalAnalyticsProvider } from "./types";

type IntegrationEnvConfig = {
  envKeys: string[];
  verificationKey?: string;
  connectedCheck: () => boolean;
};

function hasEnv(...keys: string[]): boolean {
  return keys.every((k) => Boolean(process.env[k]?.trim()));
}

const INTEGRATION_ENV: Record<ExternalAnalyticsProvider, IntegrationEnvConfig> = {
  google_analytics_4: {
    envKeys: ["NEXT_PUBLIC_GA4_MEASUREMENT_ID"],
    connectedCheck: () => hasEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID"),
  },
  meta_pixel: {
    envKeys: ["NEXT_PUBLIC_META_PIXEL_ID"],
    connectedCheck: () => hasEnv("NEXT_PUBLIC_META_PIXEL_ID"),
  },
  microsoft_clarity: {
    envKeys: ["NEXT_PUBLIC_CLARITY_PROJECT_ID"],
    connectedCheck: () => hasEnv("NEXT_PUBLIC_CLARITY_PROJECT_ID"),
  },
  google_search_console: {
    envKeys: ["NEXT_PUBLIC_GSC_VERIFICATION"],
    verificationKey: "google-site-verification",
    connectedCheck: () => hasEnv("NEXT_PUBLIC_GSC_VERIFICATION"),
  },
};

/** Extension points for external analytics — env-driven status. */
export const ANALYTICS_INTEGRATIONS: AnalyticsIntegrationStatus[] = [
  {
    provider: "google_analytics_4",
    label: "Google Analytics 4",
    description: "Web traffic, funnels, and conversion events.",
    connected: false,
    configured: false,
  },
  {
    provider: "meta_pixel",
    label: "Meta Pixel",
    description: "Facebook and Instagram ad attribution.",
    connected: false,
    configured: false,
  },
  {
    provider: "microsoft_clarity",
    label: "Microsoft Clarity",
    description: "Session recordings and heatmaps.",
    connected: false,
    configured: false,
  },
  {
    provider: "google_search_console",
    label: "Google Search Console",
    description: "Organic search impressions and queries.",
    connected: false,
    configured: false,
  },
];

export function getAnalyticsIntegrationStatuses(): AnalyticsIntegrationStatus[] {
  return ANALYTICS_INTEGRATIONS.map((item) => {
    const env = INTEGRATION_ENV[item.provider];
    const configured = env.envKeys.some((k) => Boolean(process.env[k]?.trim()));
    const connected = env.connectedCheck();
    return { ...item, configured, connected };
  });
}

export function validateAnalyticsIntegration(provider: ExternalAnalyticsProvider): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const env = INTEGRATION_ENV[provider];
  const missing = env.envKeys.filter((k) => !process.env[k]?.trim());
  const warnings: string[] = [];

  if (provider === "google_analytics_4") {
    const id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim();
    if (id && !id.startsWith("G-")) warnings.push("GA4 measurement ID should start with G-");
  }

  if (provider === "meta_pixel") {
    const id = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
    if (id && !/^\d+$/.test(id)) warnings.push("Meta Pixel ID should be numeric");
  }

  return { valid: missing.length === 0, missing, warnings };
}

export function getSearchConsoleVerificationMeta(): { name: string; content: string } | null {
  const content = process.env.NEXT_PUBLIC_GSC_VERIFICATION?.trim();
  if (!content) return null;
  return { name: "google-site-verification", content };
}

/** Test event payload for admin tools — no live network call required. */
export function buildTestAnalyticsEvent(provider: ExternalAnalyticsProvider): {
  provider: ExternalAnalyticsProvider;
  eventName: string;
  payload: Record<string, string>;
} {
  const timestamp = new Date().toISOString();
  switch (provider) {
    case "google_analytics_4":
      return {
        provider,
        eventName: "ops_test_event",
        payload: { event: "ops_test_event", measurement_id: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? "", timestamp },
      };
    case "meta_pixel":
      return {
        provider,
        eventName: "OpsTestEvent",
        payload: { event: "OpsTestEvent", pixel_id: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "", timestamp },
      };
    case "microsoft_clarity":
      return {
        provider,
        eventName: "clarity_session_check",
        payload: { project_id: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? "", timestamp },
      };
    case "google_search_console":
      return {
        provider,
        eventName: "verification_check",
        payload: {
          verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION ? "[set]" : "[missing]",
          timestamp,
        },
      };
  }
}

export interface AnalyticsIntegrationAdapter {
  provider: AnalyticsIntegrationStatus["provider"];
  fetchMetrics?: (range: { from: string; to: string }) => Promise<Record<string, number>>;
}

export const INTEGRATION_ADAPTERS: Record<AnalyticsIntegrationStatus["provider"], AnalyticsIntegrationAdapter> = {
  google_analytics_4: { provider: "google_analytics_4" },
  meta_pixel: { provider: "meta_pixel" },
  microsoft_clarity: { provider: "microsoft_clarity" },
  google_search_console: { provider: "google_search_console" },
};
