/** Standalone ComfyUI + FLUX.1 Schnell client for Node scripts (no Next.js). */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULTS = {
  comfyUiUrl: "http://127.0.0.1:8188",
  fluxModel: "flux1-schnell-fp8",
  requestTimeoutMs: 120_000,
  pollIntervalMs: 1_000,
  maxPollAttempts: 900,
  steps: 4,
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadConfig(env = {}) {
  const flux = env.FLUX_MODEL?.trim() || process.env.FLUX_MODEL?.trim() || DEFAULTS.fluxModel;
  return {
    comfyUiUrl: env.COMFYUI_URL?.trim() || process.env.COMFYUI_URL?.trim() || DEFAULTS.comfyUiUrl,
    fluxModel: flux.endsWith(".safetensors") ? flux.replace(/\.safetensors$/, "") : flux,
    requestTimeoutMs: Number(env.AI_REQUEST_TIMEOUT_MS ?? process.env.AI_REQUEST_TIMEOUT_MS ?? DEFAULTS.requestTimeoutMs),
    pollIntervalMs: Number(env.AI_POLL_INTERVAL_MS ?? process.env.AI_POLL_INTERVAL_MS ?? DEFAULTS.pollIntervalMs),
    maxPollAttempts: Number(env.AI_MAX_POLL_ATTEMPTS ?? process.env.AI_MAX_POLL_ATTEMPTS ?? DEFAULTS.maxPollAttempts),
    steps: DEFAULTS.steps,
  };
}

function loadWorkflowTemplate(root) {
  const path = join(root, "tools/comfyui/workflows/flux-schnell.json");
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  delete parsed._comment;
  return parsed;
}

export function buildFluxWorkflow(root, params) {
  const workflow = structuredClone(loadWorkflowTemplate(root));
  const modelFile = params.fluxModel.endsWith(".safetensors")
    ? params.fluxModel
    : `${params.fluxModel}.safetensors`;

  workflow["37"].inputs.unet_name = modelFile;
  workflow["37"].inputs.weight_dtype = params.fluxModel.includes("fp8") ? "fp8_e4m3fn" : "default";
  workflow["40"].inputs.width = params.width;
  workflow["40"].inputs.height = params.height;
  workflow["42"].inputs.text = params.prompt;
  workflow["43"].inputs.text = params.negativePrompt ?? "";
  workflow["31"].inputs.seed = params.seed;
  workflow["31"].inputs.steps = params.steps ?? 4;
  return workflow;
}

async function checkComfyHealth(configOrEnv = {}) {
  const config = configOrEnv.comfyUiUrl ? configOrEnv : loadConfig(configOrEnv);
  const started = Date.now();
  try {
    const res = await fetch(`${config.comfyUiUrl}/system_stats`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return { available: false, error: `HTTP ${res.status}` };
    return { available: true, latencyMs: Date.now() - started, url: config.comfyUiUrl };
  } catch (err) {
    return { available: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

async function queuePrompt(config, workflow) {
  const res = await fetch(`${config.comfyUiUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow, client_id: `bbc-${Date.now()}` }),
    signal: AbortSignal.timeout(config.requestTimeoutMs),
  });
  if (!res.ok) throw new Error(`ComfyUI queue failed: ${await res.text()}`);
  const data = await res.json();
  if (data.error || !data.prompt_id) throw new Error(data.error ?? "No prompt_id");
  return data.prompt_id;
}

function snapDim(n) {
  return Math.max(64, Math.round(n / 8) * 8);
}

/** Cap ComfyUI latent size on Apple MPS (BFloat16 fails above ~768px). */
export function resolveGenerationDimensions(width, height) {
  const targetWidth = width;
  const targetHeight = height;
  const maxDim =
    Number(process.env.AI_MPS_MAX_DIM ?? process.env.AI_MAX_GEN_DIM ?? (process.platform === "darwin" ? 512 : 1280));
  const longest = Math.max(width, height);
  if (longest <= maxDim) {
    return { genWidth: width, genHeight: height, targetWidth, targetHeight, upscaled: false };
  }
  const scale = maxDim / longest;
  return {
    genWidth: snapDim(width * scale),
    genHeight: snapDim(height * scale),
    targetWidth,
    targetHeight,
    upscaled: true,
  };
}

function extractExecutionError(entry) {
  const messages = entry?.status?.messages ?? [];
  for (const msg of messages) {
    if (msg[0] === "execution_error") {
      return msg[1]?.exception_message ?? "ComfyUI execution failed";
    }
  }
  return null;
}

async function waitForOutput(config, promptId) {
  for (let i = 0; i < config.maxPollAttempts; i++) {
    const res = await fetch(`${config.comfyUiUrl}/history/${promptId}`, { cache: "no-store" });
    if (res.ok) {
      const history = await res.json();
      const entry = history[promptId];
      if (entry) {
        const execError = extractExecutionError(entry);
        if (execError) throw new Error(execError.trim());
        if (entry.outputs) {
          for (const output of Object.values(entry.outputs)) {
            const image = output.images?.[0];
            if (image) return image;
          }
        }
      }
    }
    await sleep(config.pollIntervalMs);
  }
  throw new Error("ComfyUI generation timed out");
}

async function downloadImage(config, { filename, subfolder, type }) {
  const params = new URLSearchParams({ filename, subfolder, type });
  const res = await fetch(`${config.comfyUiUrl}/view?${params}`, {
    signal: AbortSignal.timeout(config.requestTimeoutMs),
  });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Generate one image via local ComfyUI.
 * @returns {{ buffer: Buffer, seed: number, durationMs: number }}
 */
export async function generateComfyImage(root, env, options) {
  const config = loadConfig(env);
  const health = await checkComfyHealth(config);
  if (!health.available) {
    throw new Error(`ComfyUI offline: ${health.error}. Run: npm run ai:start`);
  }

  const seed = options.seed ?? Math.floor(Math.random() * 2 ** 32);
  const started = Date.now();
  const workflow = buildFluxWorkflow(root, {
    prompt: options.prompt,
    negativePrompt:
      options.negativePrompt ??
      "text, watermark, logo, typography, letters, deformed, blurry, low quality, cartoon, oversaturated",
    width: options.width ?? 1024,
    height: options.height ?? 1024,
    seed,
    steps: options.steps ?? config.steps,
    fluxModel: config.fluxModel,
  });

  const promptId = await queuePrompt(config, workflow);
  const output = await waitForOutput(config, promptId);
  const buffer = await downloadImage(config, output);
  return { buffer, seed, durationMs: Date.now() - started, model: config.fluxModel };
}

export { loadConfig, checkComfyHealth };
