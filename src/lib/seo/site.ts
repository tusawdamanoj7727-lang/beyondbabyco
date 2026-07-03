export const SITE_NAME = "BeyondBabyCo";
export const SITE_TAGLINE = "Every Baby Deserves The Safest Touch";
export const SITE_DESCRIPTION =
  "Safe, research-backed baby care products created with love and developed through years of research by BeyondBabyCo, a unit of Tusawda Global Private Limited.";
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beyondbabyco.com";
export const SITE_LOCALE = "en_IN";
export const SITE_TWITTER = "@beyondbabyco";

export function absoluteUrl(path: string): string {
  const base = SITE_URL.replace(/\/$/, "");
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
