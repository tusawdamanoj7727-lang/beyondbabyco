import type { BannerInput } from "./banner-types";

export type BannerValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

/** Publish-time validation for Banner Manager. */
export function validateBannerForPublish(input: BannerInput): BannerValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input.title?.trim()) errors.push("Title is required.");
  if (!input.imageUrl?.trim() && !input.videoUrl?.trim()) {
    errors.push("Desktop image or video is required.");
  }
  if (!input.mobileImageUrl?.trim() && !input.videoUrl?.trim()) {
    errors.push("Mobile banner image is required for publish.");
  }
  if (!input.ctaLabel?.trim()) errors.push("CTA button label is required.");
  if (!input.linkUrl?.trim()) errors.push("CTA / destination link is required.");

  if (input.linkUrl?.trim()) {
    const link = input.linkUrl.trim();
    const ok =
      link.startsWith("/") ||
      link.startsWith("https://") ||
      link.startsWith("http://");
    if (!ok) errors.push("Link must be a relative path or absolute URL.");
  }

  if (input.startsAt && input.endsAt) {
    const start = Date.parse(input.startsAt);
    const end = Date.parse(input.endsAt);
    if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
      errors.push("End date must be after start date.");
    }
  }

  if (input.endsAt) {
    const end = Date.parse(input.endsAt);
    if (!Number.isNaN(end) && end < Date.now()) {
      errors.push("Cannot publish an already expired banner.");
    }
  }

  const priority = input.priority ?? 50;
  if (priority < 0 || priority > 100) errors.push("Priority must be between 0 and 100.");

  if (!input.altText?.trim()) warnings.push("Alt text is recommended for accessibility.");
  if (!input.tabletImageUrl?.trim()) warnings.push("Tablet image is recommended.");

  return { ok: errors.length === 0, errors, warnings };
}
