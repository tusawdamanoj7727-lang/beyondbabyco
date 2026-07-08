import { STATIC_IMAGE_BLUR } from "@/lib/media/image-placeholder";

/** Image quality tiers for Next.js Image optimization. */
export const IMAGE_QUALITY = {
  hero: 82,
  editorial: 78,
  product: 80,
  /** Small decorative mascots (hero accents, footer row). */
  mascot: 70,
  mascotFooter: 65,
  /** Feature-card thumbnails & science icons (48–72px display). */
  thumbnail: 68,
} as const;

/** Intrinsic dimensions for Next.js Image (caps optimizer srcset width). */
export const IMAGE_DIMENSIONS = {
  productCard: { width: 400, height: 400 },
  /** Hero floating mascots — max CSS display ~106px (2× retina headroom). */
  mascotHero: { width: 112, height: 112 },
  mascotGrid: { width: 256, height: 256 },
  mascotFooter: { width: 64, height: 64 },
  /** 48px lifestyle/science card icons. */
  sectionThumbnail: { width: 96, height: 96 },
  /** 56px science feature row icons. */
  featureIcon: { width: 112, height: 112 },
  /** 72px brand-promise card icons. */
  brandPromiseIcon: { width: 144, height: 144 },
  /** Floating section mascots (140–170px). */
  decorativeMascot: { width: 170, height: 170 },
} as const;

/** @deprecated Use IMAGE_QUALITY.editorial */
export const EDITORIAL_IMAGE_QUALITY = IMAGE_QUALITY.editorial;

/** Responsive `sizes` hints for common layouts. */
export const IMAGE_SIZES = {
  /** Full-width hero / above-the-fold photography */
  hero: "(max-width: 768px) 100vw, 50vw",
  /** Lifestyle split hero, beyond-care panels */
  lifestyleHero: "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw",
  /** Small lifestyle icon inside feature cards (48px display, 2× retina) */
  lifestyleThumbnail: "96px",
  /** Brand promise card icons (72px display, 2× retina) */
  brandPromiseIcon: "144px",
  /** Product cards in grids (homepage featured, /products, wishlist) */
  productCard: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  /** @deprecated Use productCard */
  featuredProduct: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  /** Category tiles on homepage */
  categoryCard: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  /** Decorative mascot clusters — homepage grid */
  mascotGrid: "(max-width: 640px) 35vw, 20vw",
  /** Hero floating mascots (~78–106px display) */
  mascotHero: "112px",
  /** Footer mascot row */
  mascotFooter: "64px",
  /** Faded full-bleed section backgrounds (low opacity) */
  sectionBackground: "(max-width: 768px) 100vw, 800px",
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
  if (displayPx <= IMAGE_DIMENSIONS.mascotFooter.width) return IMAGE_QUALITY.mascotFooter;
  if (displayPx <= IMAGE_DIMENSIONS.mascotHero.width) return IMAGE_QUALITY.mascot;
  return IMAGE_QUALITY.mascot;
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
