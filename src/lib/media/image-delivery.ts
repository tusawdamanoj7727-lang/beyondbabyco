import { STATIC_IMAGE_BLUR } from "@/lib/media/image-placeholder";

/** Image quality tiers for Next.js Image optimization. */
export const IMAGE_QUALITY = {
  hero: 90,
  editorial: 85,
  product: 85,
  mascot: 90,
  mascotFooter: 75,
} as const;

/** Intrinsic dimensions for Next.js Image (caps optimizer srcset width). */
export const IMAGE_DIMENSIONS = {
  productCard: { width: 400, height: 400 },
  mascotHero: { width: 200, height: 200 },
  mascotGrid: { width: 300, height: 300 },
  mascotFooter: { width: 64, height: 64 },
} as const;

/** @deprecated Use IMAGE_QUALITY.editorial */
export const EDITORIAL_IMAGE_QUALITY = IMAGE_QUALITY.editorial;

/** Responsive `sizes` hints for common layouts. */
export const IMAGE_SIZES = {
  /** Full-width hero / above-the-fold photography */
  hero: "100vw",
  /** Lifestyle split hero, beyond-care panels */
  lifestyleHero: "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw",
  /** Small lifestyle icon inside feature cards (48–64px display, 2× retina) */
  lifestyleThumbnail: "128px",
  /** Product cards in grids (homepage featured, /products, wishlist) */
  productCard: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  /** @deprecated Use productCard */
  featuredProduct: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  /** Category tiles on homepage */
  categoryCard: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  /** Decorative mascot clusters — homepage grid */
  mascotGrid: "(max-width: 640px) 35vw, 20vw",
  /** Hero floating mascots */
  mascotHero: "(max-width: 768px) 100px, 180px",
  /** Footer mascot row */
  mascotFooter: "64px",
  /** Cart line item thumbnails */
  cartLineItem: "(max-width: 768px) 25vw, 80px",
  /** Product detail page main gallery */
  productDetail: "(max-width: 1024px) 100vw, 50vw",
  /** Navbar / footer logo */
  logo: "(max-width: 1024px) 110px, 140px",
} as const;

/** Pick responsive `sizes` for mascot Image by display width. */
export function mascotImageSizes(displayPx: number): string {
  if (displayPx <= 80) return IMAGE_SIZES.mascotFooter;
  if (displayPx <= 220) return IMAGE_SIZES.mascotHero;
  return IMAGE_SIZES.mascotGrid;
}

/** Mascot JPEG/WebP quality by display size. */
export function mascotImageQuality(displayPx: number): number {
  return displayPx <= IMAGE_DIMENSIONS.mascotFooter.width
    ? IMAGE_QUALITY.mascotFooter
    : IMAGE_QUALITY.mascot;
}

/** `sizes` for fixed-pixel mascot or icon assets (2× retina). */
export function fixedImageSizes(displayPx: number): string {
  return `${Math.max(Math.ceil(displayPx * 2), 96)}px`;
}

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
