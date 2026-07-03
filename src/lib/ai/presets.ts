import "server-only";

import { generateImage } from "./generateImage";
import {
  AI_IMAGE_PRESETS,
  type AiImagePresetId,
} from "./preset-definitions";
import type { GenerateImageOptions, GenerateImageResult } from "./types";

export type { AiImagePresetId, AiImagePreset } from "./preset-definitions";
export { AI_IMAGE_PRESETS } from "./preset-definitions";

function presetFilename(prefix: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${prefix}-${stamp}.png`;
}

export async function generatePresetImage(
  presetId: AiImagePresetId,
  overrides: GenerateImageOptions & { customPrompt?: string } = {},
): Promise<GenerateImageResult> {
  const preset = AI_IMAGE_PRESETS.find((p) => p.id === presetId);
  if (!preset) {
    throw new Error(`Unknown preset: ${presetId}`);
  }

  const filename = overrides.filename ?? presetFilename(preset.filenamePrefix);
  const outputPath = `${preset.category}/${filename}`;
  const prompt = overrides.customPrompt?.trim() || preset.prompt;

  return generateImage(prompt, outputPath, {
    category: preset.category,
    width: overrides.width ?? preset.width,
    height: overrides.height ?? preset.height,
    negativePrompt: overrides.negativePrompt,
    seed: overrides.seed,
    steps: overrides.steps,
  });
}

export async function generateHeroBackground(
  options?: GenerateImageOptions & { customPrompt?: string },
) {
  return generatePresetImage("hero_background", options ?? {});
}

export async function generateLifestyleImage(
  options?: GenerateImageOptions & { customPrompt?: string },
) {
  return generatePresetImage("lifestyle", options ?? {});
}

export async function generateCategoryIllustration(
  options?: GenerateImageOptions & { customPrompt?: string },
) {
  return generatePresetImage("category_illustration", options ?? {});
}

export async function generateMarketingBanner(
  options?: GenerateImageOptions & { customPrompt?: string },
) {
  return generatePresetImage("marketing_banner", options ?? {});
}
