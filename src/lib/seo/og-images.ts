import { BRAND_OG_DEFAULT, BRAND_OG_HOME, BRAND_OG_PRODUCTS } from "@/lib/brand/logo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, absoluteUrl, getSiteUrl } from "./site";

export { BRAND_OG_DEFAULT, BRAND_OG_HOME, BRAND_OG_PRODUCTS };

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Static OG asset for the storefront catalog. */
export const BRAND_OG_CATALOG = BRAND_OG_PRODUCTS;

/** Build absolute URL for the dynamic OG image API. */
export function dynamicOgImageUrl(title: string, subtitle = SITE_TAGLINE): string {
  const params = new URLSearchParams({
    title: title.slice(0, 120),
    subtitle: subtitle.slice(0, 160),
  });
  return absoluteUrl(`/api/og?${params.toString()}`);
}
