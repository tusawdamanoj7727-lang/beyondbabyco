import "server-only";

import { getAiConfig } from "./config";
import { AiGenerationError, type ComfyUiHealthStatus } from "./types";

type QueueResponse = {
  prompt_id?: string;
  error?: string;
  node_errors?: Record<string, unknown>;
};

type HistoryEntry = {
  outputs?: Record<
    string,
    {
      images?: Array<{ filename: string; subfolder: string; type: string }>;
    }
  >;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function checkComfyUiHealth(): Promise<ComfyUiHealthStatus> {
  const config = getAiConfig();
  const started = Date.now();

  try {
    const res = await fetch(`${config.comfyUiUrl}/system_stats`, {
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        available: false,
        url: config.comfyUiUrl,
        error: `HTTP ${res.status}`,
      };
    }

    return {
      available: true,
      url: config.comfyUiUrl,
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      available: false,
      url: config.comfyUiUrl,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

export async function assertComfyUiAvailable(): Promise<void> {
  const health = await checkComfyUiHealth();
  if (!health.available) {
    throw new AiGenerationError(
      `ComfyUI is not reachable at ${health.url}. Run: npm run ai:start`,
      "COMFYUI_UNAVAILABLE",
      health.error,
    );
  }
}

export async function queueComfyUiPrompt(
  workflow: Record<string, unknown>,
): Promise<string> {
  const config = getAiConfig();
  const clientId = `bbc-${Date.now()}`;

  const res = await fetch(`${config.comfyUiUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow, client_id: clientId }),
    signal: AbortSignal.timeout(config.requestTimeoutMs),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new AiGenerationError(
      `ComfyUI queue failed: ${text}`,
      "GENERATION_FAILED",
    );
  }

  const data = (await res.json()) as QueueResponse;
  if (data.error || !data.prompt_id) {
    throw new AiGenerationError(
      data.error ?? "ComfyUI did not return a prompt_id",
      "GENERATION_FAILED",
      data.node_errors,
    );
  }

  return data.prompt_id;
}

export async function waitForComfyUiOutput(promptId: string): Promise<{
  filename: string;
  subfolder: string;
  type: string;
}> {
  const config = getAiConfig();

  for (let attempt = 0; attempt < config.maxPollAttempts; attempt += 1) {
    const res = await fetch(`${config.comfyUiUrl}/history/${promptId}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      await sleep(config.pollIntervalMs);
      continue;
    }

    const history = (await res.json()) as Record<string, HistoryEntry>;
    const entry = history[promptId];
    if (!entry?.outputs) {
      await sleep(config.pollIntervalMs);
      continue;
    }

    for (const output of Object.values(entry.outputs)) {
      const image = output.images?.[0];
      if (image) return image;
    }

    await sleep(config.pollIntervalMs);
  }

  throw new AiGenerationError(
    "Timed out waiting for ComfyUI generation",
    "TIMEOUT",
  );
}

export async function downloadComfyUiImage(
  filename: string,
  subfolder: string,
  type: string,
): Promise<Buffer> {
  const config = getAiConfig();
  const params = new URLSearchParams({
    filename,
    subfolder,
    type,
  });

  const res = await fetch(`${config.comfyUiUrl}/view?${params.toString()}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(config.requestTimeoutMs),
  });

  if (!res.ok) {
    throw new AiGenerationError(
      `Failed to download generated image (${res.status})`,
      "INVALID_OUTPUT",
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
