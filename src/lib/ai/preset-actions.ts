"use server";

import { isAiDevEnabled } from "./config";
import type { AiImagePresetId } from "./preset-definitions";
import {
  generateCategoryIllustration,
  generateHeroBackground,
  generateLifestyleImage,
  generateMarketingBanner,
} from "./presets";
import type { GenerateImageResult } from "./types";

export type PresetActionResult =
  | { ok: true; result: GenerateImageResult }
  | { ok: false; error: string };

export async function runAiPresetAction(
  presetId: AiImagePresetId,
  customPrompt?: string,
): Promise<PresetActionResult> {
  if (!isAiDevEnabled()) {
    return { ok: false, error: "AI tools are disabled in this environment." };
  }

  try {
    const runners = {
      hero_background: generateHeroBackground,
      lifestyle: generateLifestyleImage,
      category_illustration: generateCategoryIllustration,
      marketing_banner: generateMarketingBanner,
    } as const;

    const result = await runners[presetId]({ customPrompt });
    return { ok: true, result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Preset generation failed",
    };
  }
}
