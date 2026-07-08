/**
 * Client-safe blur lookup for generated editorial URLs.
 * Keeps ~350KB of asset review JSON out of the browser bundle.
 */

import { GENERATED_ROOT } from "./art-direction";
import { STATIC_IMAGE_BLUR } from "@/lib/media/image-placeholder";

import blurs from "./generated-blurs.json";

const BLUR_MAP = blurs as Record<string, string>;

export function blurForGeneratedUrl(url: string | null | undefined): string {
  if (!url?.includes(GENERATED_ROOT)) return STATIC_IMAGE_BLUR;
  const path = url
    .replace(`${GENERATED_ROOT}/`, "")
    .replace(/\.(webp|avif|png)$/i, "");
  return BLUR_MAP[path] ?? STATIC_IMAGE_BLUR;
}
