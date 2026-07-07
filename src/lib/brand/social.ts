/** Canonical BeyondBabyCo social profiles */
export const INSTAGRAM_URL = "https://www.instagram.com/beyoundbabyco";
export const INSTAGRAM_HANDLE = "@beyoundbabyco";
export const FOREST_GREEN = "#2d5a27";

export function isInstagramSocialLink(url: string, platform = ""): boolean {
  return /instagram/i.test(url) || /instagram/i.test(platform);
}

/** Never surface a raw URL in UI — return a friendly @handle when possible. */
export function formatSocialHandle(url: string, platform = ""): string {
  if (isInstagramSocialLink(url, platform)) return INSTAGRAM_HANDLE;

  const trimmedPlatform = platform.trim();
  if (trimmedPlatform.startsWith("@") && !trimmedPlatform.includes("://")) {
    return trimmedPlatform;
  }
  if (trimmedPlatform && !trimmedPlatform.includes("://") && !trimmedPlatform.includes(".")) {
    return trimmedPlatform.startsWith("@") ? trimmedPlatform : `@${trimmedPlatform}`;
  }

  const source = url.trim() || trimmedPlatform;
  if (source) {
    try {
      const normalized = source.startsWith("http") ? source : `https://${source}`;
      const parsed = new URL(normalized);
      const segment =
        parsed.pathname.split("/").filter(Boolean).pop() ??
        parsed.hostname.replace(/^www\./, "").split(".")[0];
      if (segment) return `@${segment.replace(/^@/, "")}`;
    } catch {
      /* ignore malformed URLs */
    }
  }

  if (trimmedPlatform && !trimmedPlatform.includes("://")) {
    const label = trimmedPlatform.replace(/^@/, "");
    return label ? `@${label}` : "Follow us";
  }

  return "Follow us";
}

/** True when a formatted label still looks like a URL (should never be shown). */
export function isRawUrlLabel(label: string): boolean {
  return /:\/\//.test(label) || /^https?/i.test(label.trim());
}

export const INSTAGRAM_ARIA_LABEL = "Follow BeyondBabyCo on Instagram";
