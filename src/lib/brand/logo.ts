/** Phase 12.0 — Official BeyondBabyCo brand logo paths & production derivatives. */

export const BRAND_LOGO_ALT = "BeyondBabyCo";

/** Primary lockup — official PNG on light backgrounds. */
export const BRAND_LOGO_PATH = "/images/brand/logo.png";
export const BRAND_LOGO_DARK_PATH = "/images/brand/logo-dark.png";
export const BRAND_LOGO_LIGHT_PATH = "/images/brand/logo-light.png";
export const BRAND_LOGO_ICON_PATH = "/images/brand/logo-icon.png";
export const BRAND_LOGO_MONOCHROME_PATH = "/images/brand/logo-monochrome.png";

/** Intrinsic dimensions of official file (791 × 1024). */
export const BRAND_LOGO_WIDTH = 791;
export const BRAND_LOGO_HEIGHT = 1024;

/** Email-optimised lockup (max 320px wide). */
export const BRAND_EMAIL_LOGO = "/images/brand/logo-email.png";
export const BRAND_EMAIL_LOGO_WIDTH = 320;
export const BRAND_EMAIL_LOGO_HEIGHT = 414;

/** Favicon & PWA */
export const BRAND_FAVICON_SVG = "/images/brand/favicon.svg";
export const BRAND_FAVICON_16 = "/images/brand/favicon-16.png";
export const BRAND_FAVICON_32 = "/images/brand/favicon-32.png";
export const BRAND_FAVICON_48 = "/images/brand/favicon-48.png";
export const BRAND_APPLE_TOUCH_ICON = "/images/brand/apple-touch-icon.png";
export const BRAND_ICON_192 = "/images/brand/icon-192.png";
export const BRAND_ICON_512 = "/images/brand/icon-512.png";
export const BRAND_ICON_MASKABLE_512 = "/images/brand/icon-maskable-512.png";
export const BRAND_ANDROID_CHROME_192 = "/images/brand/android-chrome-192.png";
export const BRAND_ANDROID_CHROME_512 = "/images/brand/android-chrome-512.png";

/** OpenGraph — 1200×630 production cards */
export const BRAND_OG_IMAGE = "/images/brand/og-default.png";
export const BRAND_OG_HOME = "/images/brand/og-home.png";
export const BRAND_OG_WIDTH = 1200;
export const BRAND_OG_HEIGHT = 630;

/** Social share assets */
export const BRAND_SOCIAL = {
  twitter: "/images/brand/social/twitter-card.png",
  linkedin: "/images/brand/social/linkedin.png",
  whatsapp: "/images/brand/social/whatsapp-preview.png",
  instagramPost: "/images/brand/social/instagram-post.png",
  instagramStory: "/images/brand/social/instagram-story.png",
  pinterest: "/images/brand/social/pinterest.png",
} as const;

export type BrandLogoVariant = "default" | "dark" | "light" | "icon" | "monochrome";

const VARIANT_PATHS: Record<BrandLogoVariant, string> = {
  default: BRAND_LOGO_PATH,
  dark: BRAND_LOGO_DARK_PATH,
  light: BRAND_LOGO_LIGHT_PATH,
  icon: BRAND_LOGO_ICON_PATH,
  monochrome: BRAND_LOGO_MONOCHROME_PATH,
};

export function brandLogoPath(variant: BrandLogoVariant = "default"): string {
  return VARIANT_PATHS[variant];
}

export function brandLogoDimensions(variant: BrandLogoVariant = "default") {
  if (variant === "icon") return { width: 512, height: 512 };
  return { width: BRAND_LOGO_WIDTH, height: BRAND_LOGO_HEIGHT };
}
