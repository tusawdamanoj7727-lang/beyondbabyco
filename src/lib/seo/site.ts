import { getAppUrl } from "@/lib/app-url";

export const PRODUCTION_SITE_URL = "https://beyondbabyco.in";

function isLocalDevUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url.startsWith("http") ? url : `https://${url}`);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** SEO canonical origin — never localhost (use for metadata, OG tags, sitemap, JSON-LD). */
export function getCanonicalSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured && !isLocalDevUrl(configured)) {
    return configured.replace(/\/+$/, "");
  }
  return PRODUCTION_SITE_URL;
}

/** Runtime app origin (auth redirects, CSRF). Prefer {@link getCanonicalSiteUrl} for SEO output. */
export function getSiteUrl(): string {
  return getAppUrl();
}

/** @deprecated Use getSiteUrl() — kept for imports that expect a string constant at type level. */
export const PUBLIC_SITE_URL = PRODUCTION_SITE_URL;

export const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME || "BeyondBabyCo";
export const SITE_TAGLINE = "Every Baby Deserves The Safest Touch";
export const SITE_DESCRIPTION =
  "Safe, research-backed baby care products created with love and developed through years of research by BeyondBabyCo, a unit of Tusawda Global Private Limited.";

/** @deprecated Use getSiteUrl(). */
export const SITE_URL = PRODUCTION_SITE_URL;

export const SITE_LOCALE = "en_IN";
export const SITE_TWITTER = "@beyondbabyco";

function normalizePublicOrigin(url: string): string {
  try {
    const parsed = new URL(url);
    if (
      process.env.NODE_ENV === "production" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    ) {
      const canonical = new URL(getCanonicalSiteUrl());
      parsed.protocol = canonical.protocol;
      parsed.host = canonical.host;
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}

/** Absolute public URL for metadata, OG tags, JSON-LD, sitemap, and share links. */
export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return normalizePublicOrigin(path);
  }

  const base = getCanonicalSiteUrl().replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
