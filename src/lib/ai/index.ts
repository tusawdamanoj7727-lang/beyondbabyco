export {
  generateImage,
  checkComfyUiHealth,
  isAiDevEnabled,
  isAiConfigured,
  getAiConfig,
  AiGenerationError,
} from "./generateImage";

export {
  AI_IMAGE_PRESETS,
  generatePresetImage,
  generateHeroBackground,
  generateLifestyleImage,
  generateCategoryIllustration,
  generateMarketingBanner,
} from "./presets";

export { runAiPresetAction } from "./preset-actions";
export type { AiImagePresetId } from "./preset-definitions";

export type {
  GenerateImageOptions,
  GenerateImageResult,
  ImageCategory,
  ComfyUiHealthStatus,
} from "./types";

export { IMAGE_CATEGORIES } from "./types";
