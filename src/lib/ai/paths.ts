import fs from "node:fs";
import path from "node:path";

import { IMAGE_CATEGORIES, type ImageCategory } from "./types";

const PROJECT_ROOT = process.cwd();
const GENERATED_ROOT = path.join(PROJECT_ROOT, "public/images/generated");

export function getGeneratedRoot(): string {
  return GENERATED_ROOT;
}

/** Ensure all category folders exist under public/images/generated/. */
export function ensureCategoryDirs(): void {
  fs.mkdirSync(GENERATED_ROOT, { recursive: true });
  for (const category of IMAGE_CATEGORIES) {
    fs.mkdirSync(path.join(GENERATED_ROOT, category), { recursive: true });
  }
}

export function resolveOutputPaths(
  outputPath: string,
  category: ImageCategory = "temporary",
): { absolutePath: string; relativePublicPath: string; publicUrl: string } {
  ensureCategoryDirs();

  const normalized = outputPath.replace(/\\/g, "/").replace(/^\/+/, "");
  const hasCategory = IMAGE_CATEGORIES.some(
    (c) => normalized === c || normalized.startsWith(`${c}/`),
  );

  const relative = hasCategory ? normalized : path.posix.join(category, normalized);
  const segments = relative.split("/").filter(Boolean);

  if (segments.some((s) => s === ".." || s === ".")) {
    throw new Error("Invalid output path: path traversal not allowed");
  }

  const absolutePath = path.join(GENERATED_ROOT, ...segments);
  if (!absolutePath.startsWith(GENERATED_ROOT)) {
    throw new Error("Invalid output path: outside generated directory");
  }

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

  const ext = path.extname(absolutePath);
  const finalAbsolute =
    ext.length > 0 ? absolutePath : `${absolutePath}.png`;

  const relativeFromPublic = path.posix.join(
    "images/generated",
    path.posix.relative(GENERATED_ROOT.replace(/\\/g, "/"), finalAbsolute.replace(/\\/g, "/")),
  );

  return {
    absolutePath: finalAbsolute,
    relativePublicPath: path.posix.join("public", relativeFromPublic),
    publicUrl: `/${relativeFromPublic}`,
  };
}

export function sanitizeFilename(name: string): string {
  const base = name.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return base || `gen-${Date.now()}`;
}

export function defaultOutputFilename(category: ImageCategory): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${category}-${stamp}.png`;
}
