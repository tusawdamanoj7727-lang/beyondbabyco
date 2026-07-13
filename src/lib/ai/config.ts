import "server-only";

import { isProduction } from "@/lib/env.validation";

import type { AiProvider } from "./types";

export interface AiConfig {
  provider: AiProvider;
  comfyUiUrl: string;
  fluxModel: string;
  /** Whether dev AI tools (API + /dev/ai) are allowed */
  devEnabled: boolean;
  requestTimeoutMs: number;
  pollIntervalMs: number;
  maxPollAttempts: number;
}

function parseFluxModel(): string {
  const raw = process.env.FLUX_MODEL?.trim();
  if (!raw) return "flux1-schnell";
  return raw.endsWith(".safetensors") ? raw.replace(/\.safetensors$/, "") : raw;
}

export function getAiConfig(): AiConfig {
  const provider = (process.env.AI_PROVIDER?.trim() || "local") as AiProvider;
  const devEnabled =
    !isProduction() &&
    process.env.AI_DEV_ENABLED !== "false";

  return {
    provider,
    comfyUiUrl: process.env.COMFYUI_URL?.trim() || "http://127.0.0.1:8188",
    fluxModel: parseFluxModel(),
    devEnabled,
    requestTimeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 120_000),
    pollIntervalMs: Number(process.env.AI_POLL_INTERVAL_MS ?? 1_000),
    maxPollAttempts: Number(process.env.AI_MAX_POLL_ATTEMPTS ?? 180),
  };
}

/** Returns true when local ComfyUI generation is configured and dev tools are allowed. Never true in production. */
export function isAiDevEnabled(): boolean {
  if (isProduction()) return false;
  const config = getAiConfig();
  return config.devEnabled && config.provider === "local";
}

/** Gracefully disabled — never throws. */
export function isAiConfigured(): boolean {
  return getAiConfig().provider === "local";
}
