export type AiProvider = "local";

export type ImageCategory =
  | "hero"
  | "products"
  | "lifestyle"
  | "ingredients"
  | "marketing"
  | "blog"
  | "temporary";

export const IMAGE_CATEGORIES: ImageCategory[] = [
  "hero",
  "products",
  "lifestyle",
  "ingredients",
  "marketing",
  "blog",
  "temporary",
];

export interface GenerateImageOptions {
  negativePrompt?: string;
  width?: number;
  height?: number;
  seed?: number;
  steps?: number;
  category?: ImageCategory;
  filename?: string;
}

export interface GenerateImageResult {
  /** Path relative to project root, e.g. public/images/generated/hero/foo.png */
  localPath: string;
  /** URL path served by Next.js, e.g. /images/generated/hero/foo.png */
  publicPath: string;
  seed: number;
  durationMs: number;
  prompt: string;
}

export interface ComfyUiHealthStatus {
  available: boolean;
  url: string;
  latencyMs?: number;
  error?: string;
}

export type AiErrorCode =
  | "AI_DISABLED"
  | "COMFYUI_UNAVAILABLE"
  | "GENERATION_FAILED"
  | "INVALID_OUTPUT"
  | "INVALID_PATH"
  | "TIMEOUT";

export class AiGenerationError extends Error {
  readonly code: AiErrorCode;

  constructor(message: string, code: AiErrorCode, cause?: unknown) {
    super(message);
    this.name = "AiGenerationError";
    this.code = code;
    if (cause instanceof Error) this.cause = cause;
  }
}
