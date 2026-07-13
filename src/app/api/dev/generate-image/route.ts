import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api/route-helpers";
import {
  AiGenerationError,
  checkComfyUiHealth,
  generateImage,
  isAiDevEnabled,
} from "@/lib/ai/generateImage";
import { isDevApiBlocked } from "@/lib/security/dev-api";

const generateSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(4000),
  negativePrompt: z.string().max(4000).optional(),
  width: z.number().int().min(256).max(2048).optional(),
  height: z.number().int().min(256).max(2048).optional(),
  seed: z.number().int().min(0).optional(),
  steps: z.number().int().min(1).max(50).optional(),
  category: z
    .enum(["hero", "products", "lifestyle", "ingredients", "marketing", "blog", "temporary"])
    .optional(),
  filename: z
    .string()
    .regex(/^[a-zA-Z0-9._-]+$/, "Filename may only contain letters, numbers, dots, dashes, underscores")
    .max(120)
    .optional(),
  outputPath: z.string().max(200).optional(),
});

function devGuard(): NextResponse | null {
  if (isDevApiBlocked()) {
    return jsonError("Not found", 404);
  }
  if (!isAiDevEnabled()) {
    return jsonError("AI dev tools are disabled in this environment", 403);
  }
  return null;
}

/** GET /api/dev/generate-image — ComfyUI health probe (dev only) */
export async function GET() {
  const blocked = devGuard();
  if (blocked) return blocked;

  const health = await checkComfyUiHealth();
  return jsonOk({ health });
}

/** POST /api/dev/generate-image — local FLUX generation (dev only) */
export async function POST(request: Request) {
  const blocked = devGuard();
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join("; "), 400);
  }

  const { prompt, outputPath, category, filename, ...options } = parsed.data;

  const relativePath =
    outputPath?.trim() ||
    (category && filename ? `${category}/${filename}` : undefined) ||
    (category ? `${category}/dev-${Date.now()}.png` : `temporary/dev-${Date.now()}.png`);

  try {
    const result = await generateImage(prompt, relativePath, {
      ...options,
      category,
      filename,
    });

    return jsonOk({ result });
  } catch (error) {
    if (error instanceof AiGenerationError) {
      const status =
        error.code === "AI_DISABLED" || error.code === "COMFYUI_UNAVAILABLE" ? 503 : 500;
      return jsonError(error.message, status);
    }

    return jsonError(
      error instanceof Error ? error.message : "Generation failed",
      500,
    );
  }
}
