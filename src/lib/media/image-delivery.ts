import { STATIC_IMAGE_BLUR } from "@/lib/media/image-placeholder";

/** Pick per-image blur from media library or fall back to static marketing blur. */
export function resolveImageBlur(blurDataUrl?: string | null): string {
  return blurDataUrl?.trim() || STATIC_IMAGE_BLUR;
}

/** CDN cache TTL recommendations by asset class (for deployment docs / headers). */
export const CDN_CACHE_POLICY = {
  immutableStatic: "public, max-age=31536000, immutable",
  nextImageOptimized: "public, max-age=86400, stale-while-revalidate=604800",
  cmsHero: "public, max-age=604800, stale-while-revalidate=86400",
  productUpload: "public, max-age=2592000, immutable",
  avatar: "public, max-age=86400, stale-while-revalidate=604800",
  marketingGenerated: "public, max-age=31536000, immutable",
} as const;
