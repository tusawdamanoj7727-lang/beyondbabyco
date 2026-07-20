/**
 * Campaign publish validation — blocks incomplete campaigns.
 */

import type { CampaignCenterConfig } from "@/lib/campaigns/types";

export type CampaignValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export function validateCampaignForPublish(config: CampaignCenterConfig, opts?: {
  requireCoupon?: boolean;
  status?: string;
}): CampaignValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.headline?.trim()) errors.push("Headline is required before publish.");
  if (!config.cta?.label?.trim()) errors.push("CTA label is required.");
  if (!config.cta?.url?.trim() && !config.targetUrl?.trim()) {
    errors.push("CTA link or target URL is required.");
  }

  const link = (config.cta?.url || config.targetUrl || "").trim();
  if (link) {
    const ok = link.startsWith("/") || link.startsWith("http://") || link.startsWith("https://");
    if (!ok) errors.push("CTA link must be a relative path or absolute URL.");
  }

  if (config.homepageSlot === "homepage_hero" || config.homepageSlot === "homepage_banner") {
    if (!config.assets.hero && !config.assets.banner) {
      errors.push("Hero or banner image is required for this homepage slot.");
    }
    if (!config.assets.mobileBanner && !config.assets.banner && !config.assets.hero) {
      errors.push("Mobile banner image is required.");
    }
  }

  if (config.startDate && config.endDate) {
    const start = Date.parse(config.startDate);
    const end = Date.parse(config.endDate);
    if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
      errors.push("End date must be after start date.");
    }
  }

  if (config.endDate) {
    const end = Date.parse(config.endDate);
    if (!Number.isNaN(end) && end < Date.now() && opts?.status === "running") {
      errors.push("Cannot activate an expired campaign.");
    }
  }

  const priority = config.priority ?? 0;
  if (priority < 0 || priority > 100) errors.push("Priority must be between 0 and 100.");

  if (opts?.requireCoupon && !config.couponId) {
    errors.push("A coupon must be linked for this campaign type.");
  }

  if ((config.marketingType === "coupon" || config.marketingType === "discount") && !config.couponId) {
    warnings.push("Coupon campaigns usually link a coupon code.");
  }

  if (!config.homepageSlot) warnings.push("No homepage slot selected — campaign won’t appear on storefront surfaces.");

  return { ok: errors.length === 0, errors, warnings };
}
