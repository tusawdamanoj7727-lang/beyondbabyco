/** Canonical BeyondBabyCo social profiles */
export const INSTAGRAM_URL = "https://instagram.com/beyondbabyco";
export const INSTAGRAM_HANDLE = "@beyondbabyco";
export const FOREST_GREEN = "#2d5a27";

export function isInstagramSocialLink(url: string, platform = ""): boolean {
  return /instagram/i.test(url) || /instagram/i.test(platform);
}

/** Never surface a raw URL in UI — return a friendly @handle when possible. */
export function formatSocialHandle(url: string, platform = ""): string {
  if (isInstagramSocialLink(url, platform)) return INSTAGRAM_HANDLE;

  const trimmed = platform.trim();
  if (trimmed.startsWith("@")) return trimmed;
  if (trimmed && !trimmed.includes("://") && !trimmed.includes(".")) {
    return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
  }

  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const pathname = new URL(normalized).pathname;
    const segment = pathname.split("/").filter(Boolean)[0];
    if (segment) return `@${segment.replace(/^@/, "")}`;
  } catch {
    /* ignore malformed URLs */
  }

  return INSTAGRAM_HANDLE;
}

export const INSTAGRAM_ARIA_LABEL = "Follow BeyondBabyCo on Instagram";
