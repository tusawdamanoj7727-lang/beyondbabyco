export const PRODUCTION_SITE_URL = "https://beyondbabyco.in";

/** Canonical public site URL for metadata, OG tags, sitemap, and JSON-LD. */
export const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL;

export const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME || "BeyondBabyCo";
export const SITE_TAGLINE = "Every Baby Deserves The Safest Touch";
export const SITE_DESCRIPTION =
  "Safe, research-backed baby care products created with love and developed through years of research by BeyondBabyCo, a unit of Tusawda Global Private Limited.";

/** @deprecated Use PUBLIC_SITE_URL or getSiteUrl(). */
export const SITE_URL = PUBLIC_SITE_URL;

export const SITE_LOCALE = "en_IN";
export const SITE_TWITTER = "@beyondbabyco";

export function getSiteUrl(): string {
  return PUBLIC_SITE_URL;
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl().replace(/\/$/, "");
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
