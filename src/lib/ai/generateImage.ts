import "server-only";

import fs from "node:fs";

import {
  assertComfyUiAvailable,
  downloadComfyUiImage,
  queueComfyUiPrompt,
  waitForComfyUiOutput,
} from "./comfy-client";
import { getAiConfig, isAiDevEnabled } from "./config";
import {
  logAiGenerationError,
  logAiGenerationStart,
  logAiGenerationSuccess,
} from "./logger";
import {
  defaultOutputFilename,
  resolveOutputPaths,
  sanitizeFilename,
} from "./paths";
import {
  AiGenerationError,
  type GenerateImageOptions,
  type GenerateImageResult,
  type ImageCategory,
} from "./types";
import { buildFluxSchnellWorkflow, resolveGenerationParams } from "./workflow";

/**
 * Generate an image via local ComfyUI (FLUX.1 Schnell) and save it under
 * `public/images/generated/`.
 *
 * @param prompt - Text prompt for generation
 * @param outputPath - Relative path under generated/, e.g. `hero/banner.png` or `products/wipes-01.png`
 * @param options - Optional generation parameters
 * @returns Paths and metadata for the saved image
 */
export async function generateImage(
  prompt: string,
  outputPath: string,
  options: GenerateImageOptions = {},
): Promise<GenerateImageResult> {
  if (!isAiDevEnabled()) {
    throw new AiGenerationError(
      "AI generation is disabled outside development mode",
      "AI_DISABLED",
    );
  }

  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) {
    throw new AiGenerationError("Prompt is required", "GENERATION_FAILED");
  }

  const config = getAiConfig();
  const category = options.category ?? inferCategory(outputPath);
  const filename = options.filename
    ? sanitizeFilename(options.filename)
    : undefined;

  const relativeOutput =
    outputPath.trim() ||
    (filename ? `${category}/${filename}` : defaultOutputFilename(category));

  let paths;
  try {
    paths = resolveOutputPaths(relativeOutput, category);
  } catch (error) {
    throw new AiGenerationError(
      error instanceof Error ? error.message : "Invalid output path",
      "INVALID_PATH",
      error,
    );
  }

  const params = resolveGenerationParams(trimmedPrompt, options, config.fluxModel);
  const started = Date.now();

  logAiGenerationStart({
    prompt: trimmedPrompt,
    outputPath: paths.relativePublicPath,
    seed: params.seed,
    width: params.width,
    height: params.height,
    steps: params.steps,
  });

  try {
    await assertComfyUiAvailable();

    const workflow = buildFluxSchnellWorkflow(params);
    const promptId = await queueComfyUiPrompt(workflow);
    const output = await waitForComfyUiOutput(promptId);
    const imageBuffer = await downloadComfyUiImage(
      output.filename,
      output.subfolder,
      output.type,
    );

    fs.writeFileSync(paths.absolutePath, imageBuffer);

    const durationMs = Date.now() - started;
    const result: GenerateImageResult = {
      localPath: paths.relativePublicPath,
      publicPath: paths.publicUrl,
      seed: params.seed,
      durationMs,
      prompt: trimmedPrompt,
    };

    logAiGenerationSuccess({
      prompt: trimmedPrompt,
      outputPath: result.localPath,
      publicPath: result.publicPath,
      seed: result.seed,
      durationMs: result.durationMs,
    });

    return result;
  } catch (error) {
    logAiGenerationError({
      prompt: trimmedPrompt,
      outputPath: paths.relativePublicPath,
      seed: params.seed,
      durationMs: Date.now() - started,
      error,
    });

    if (error instanceof AiGenerationError) throw error;

    throw new AiGenerationError(
      error instanceof Error ? error.message : "Image generation failed",
      "GENERATION_FAILED",
      error,
    );
  }
}

function inferCategory(outputPath: string): ImageCategory {
  const first = outputPath.replace(/\\/g, "/").split("/")[0];
  const categories: ImageCategory[] = [
    "hero",
    "products",
    "lifestyle",
    "ingredients",
    "marketing",
    "blog",
    "temporary",
  ];
  if (categories.includes(first as ImageCategory)) {
    return first as ImageCategory;
  }
  return "temporary";
}

export { checkComfyUiHealth } from "./comfy-client";
export { isAiDevEnabled, isAiConfigured, getAiConfig } from "./config";
export type { GenerateImageOptions, GenerateImageResult, ImageCategory } from "./types";
export { AiGenerationError } from "./types";
