import { logger } from "@/lib/observability/logger";

export function logAiGenerationStart(context: {
  prompt: string;
  outputPath: string;
  seed: number;
  width: number;
  height: number;
  steps: number;
}) {
  logger.info("ai.generation.start", {
    prompt: context.prompt.slice(0, 500),
    outputPath: context.outputPath,
    seed: context.seed,
    width: context.width,
    height: context.height,
    steps: context.steps,
  });
}

export function logAiGenerationSuccess(context: {
  prompt: string;
  outputPath: string;
  publicPath: string;
  seed: number;
  durationMs: number;
}) {
  logger.info("ai.generation.success", {
    prompt: context.prompt.slice(0, 500),
    outputPath: context.outputPath,
    publicPath: context.publicPath,
    seed: context.seed,
    durationMs: context.durationMs,
  });
}

export function logAiGenerationError(context: {
  prompt: string;
  outputPath?: string;
  seed?: number;
  durationMs?: number;
  error: unknown;
}) {
  logger.error("ai.generation.error", {
    prompt: context.prompt.slice(0, 500),
    outputPath: context.outputPath,
    seed: context.seed,
    durationMs: context.durationMs,
    error: context.error,
  });
}

export function logAiHealth(context: { available: boolean; url: string; latencyMs?: number; error?: string }) {
  logger.info("ai.health", context);
}
