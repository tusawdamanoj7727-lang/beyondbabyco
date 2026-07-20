import type { MarketingCampaignType } from "@/lib/campaigns/types";

/**
 * Campaign priority engine — type weight + numeric priority.
 * Higher score wins a marketing surface (unless rotation is enabled).
 */
export const CAMPAIGN_TYPE_PRIORITY_WEIGHT: Record<MarketingCampaignType, number> = {
  flash_sale: 600,
  festival: 500,
  product_launch: 400,
  discount: 350,
  coupon: 340,
  bundle: 330,
  seasonal: 320,
  newsletter: 200,
  educational: 150,
  research: 140,
  referral: 100,
  influencer: 90,
};

/** Surface-level emergency notices (announcement slot) get an extra bump. */
export const EMERGENCY_SLOT_BONUS = 1000;
export const FREE_SHIPPING_TYPE_HINT = /free.?shipping/i;

export function campaignPriorityScore(input: {
  marketingType: MarketingCampaignType;
  priority: number;
  homepageSlot?: string | null;
  name?: string;
  headline?: string;
}): number {
  const typeWeight = CAMPAIGN_TYPE_PRIORITY_WEIGHT[input.marketingType] ?? 100;
  const numeric = Math.min(100, Math.max(0, input.priority ?? 0));
  let score = typeWeight + numeric;

  if (input.homepageSlot === "announcement_bar" && /emergency|urgent|alert/i.test(`${input.name} ${input.headline}`)) {
    score += EMERGENCY_SLOT_BONUS;
  }
  if (FREE_SHIPPING_TYPE_HINT.test(`${input.name} ${input.headline}`)) {
    score += 280; // Free shipping band (between launch and festival)
  }

  return score;
}
