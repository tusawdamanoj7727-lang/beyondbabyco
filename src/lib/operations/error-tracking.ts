import type { ErrorTrackingProviderId } from "./types";

export interface ErrorTrackingStatus {
  provider: ErrorTrackingProviderId;
  label: string;
  configured: boolean;
  dsnPresent: boolean;
  missingEnv: string[];
  detail: string;
}

const PROVIDERS: { id: ErrorTrackingProviderId; label: string; envKeys: string[] }[] = [
  { id: "sentry", label: "Sentry", envKeys: ["SENTRY_DSN"] },
  { id: "better_stack", label: "Better Stack", envKeys: ["BETTER_STACK_DSN", "ERROR_TRACKING_DSN"] },
  { id: "logtail", label: "Logtail", envKeys: ["LOGTAIL_SOURCE_TOKEN", "ERROR_TRACKING_DSN"] },
];

export function getSelectedErrorTrackingProvider(): ErrorTrackingProviderId {
  const raw = process.env.ERROR_TRACKING_PROVIDER?.trim().toLowerCase();
  if (raw === "sentry" || raw === "better_stack" || raw === "logtail") return raw;
  if (process.env.SENTRY_DSN?.trim()) return "sentry";
  if (process.env.BETTER_STACK_DSN?.trim()) return "better_stack";
  if (process.env.LOGTAIL_SOURCE_TOKEN?.trim()) return "logtail";
  if (process.env.ERROR_TRACKING_DSN?.trim()) return "better_stack";
  return "none";
}

export function getErrorTrackingStatus(): ErrorTrackingStatus {
  const provider = getSelectedErrorTrackingProvider();
  const def = PROVIDERS.find((p) => p.id === provider);

  if (provider === "none" || !def) {
    return {
      provider: "none",
      label: "None",
      configured: false,
      dsnPresent: false,
      missingEnv: ["ERROR_TRACKING_PROVIDER or SENTRY_DSN"],
      detail: "Error tracking not configured — logs only",
    };
  }

  const missingEnv = def.envKeys.filter((k) => !process.env[k]?.trim());
  const dsnPresent = missingEnv.length < def.envKeys.length;

  return {
    provider,
    label: def.label,
    configured: missingEnv.length === 0 || (provider === "sentry" && Boolean(process.env.SENTRY_DSN)),
    dsnPresent,
    missingEnv,
    detail: dsnPresent ? `${def.label} credentials present` : `Missing: ${missingEnv.join(", ")}`,
  };
}

export function listErrorTrackingProviders(): ErrorTrackingStatus[] {
  return PROVIDERS.map((p) => {
    const missingEnv = p.envKeys.filter((k) => !process.env[k]?.trim());
    const configured = missingEnv.length === 0;
    return {
      provider: p.id,
      label: p.label,
      configured,
      dsnPresent: configured,
      missingEnv,
      detail: configured ? "Configured" : `Requires ${p.envKeys.join(" or ")}`,
    };
  });
}

export function validateErrorTrackingEnv(): { valid: boolean; missing: string[] } {
  const status = getErrorTrackingStatus();
  if (status.provider === "none") return { valid: false, missing: status.missingEnv };
  return { valid: status.configured, missing: status.missingEnv };
}
