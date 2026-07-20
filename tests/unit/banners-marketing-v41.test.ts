import { describe, expect, it } from "vitest";

import { validateBannerForPublish } from "@/lib/admin/banner-validation";
import type { BannerInput } from "@/lib/admin/banner-types";
import { campaignPriorityScore } from "@/lib/campaigns/priority";
import { resolveActiveSlotCampaigns, resolveRotatingSlotCampaigns } from "@/lib/campaigns/helpers";
import { DEFAULT_CAMPAIGN_CONFIG } from "@/lib/campaigns/config";
import type { CampaignCenterItem } from "@/lib/campaigns/types";
import { validateCampaignForPublish } from "@/lib/campaigns/validation";

function banner(partial: Partial<BannerInput> = {}): BannerInput {
  return {
    title: "Summer Sale",
    subtitle: "",
    imageUrl: "https://cdn.example.com/desk.jpg",
    mobileImageUrl: "https://cdn.example.com/mob.jpg",
    tabletImageUrl: "",
    videoUrl: "",
    mediaType: "image",
    linkUrl: "/products",
    ctaLabel: "Shop now",
    placement: "homepage_mid",
    position: 0,
    priority: 50,
    status: "published",
    isActive: true,
    startsAt: null,
    endsAt: null,
    altText: "Sale",
    ariaLabel: "",
    campaignId: null,
    ...partial,
  };
}

function campaignItem(
  overrides: Partial<CampaignCenterItem> & { name: string; marketingType: CampaignCenterItem["config"]["marketingType"]; priority: number },
): CampaignCenterItem {
  const config = {
    ...DEFAULT_CAMPAIGN_CONFIG(),
    homepageSlot: "homepage_hero" as const,
    marketingType: overrides.marketingType,
    priority: overrides.priority,
    headline: overrides.name,
  };
  return {
    id: overrides.id ?? overrides.name,
    name: overrides.name,
    channelType: "email",
    status: "running",
    lifecycle: "active",
    config,
    scheduledAt: null,
    segmentName: null,
    createdAt: new Date().toISOString(),
    analytics: {
      impressions: 1,
      clicks: 0,
      ctr: 0,
      conversions: 0,
      revenue: 0,
      couponUsage: 0,
      orders: 0,
      traffic: 1,
    },
  };
}

describe("banner validation", () => {
  it("blocks publish without mobile banner or CTA", () => {
    const result = validateBannerForPublish(
      banner({ mobileImageUrl: "", ctaLabel: "", linkUrl: "" }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /Mobile/i.test(e))).toBe(true);
    expect(result.errors.some((e) => /CTA/i.test(e))).toBe(true);
  });

  it("rejects broken links and invalid date ranges", () => {
    const result = validateBannerForPublish(
      banner({
        linkUrl: "not-a-url",
        startsAt: "2026-08-01T00:00:00.000Z",
        endsAt: "2026-07-01T00:00:00.000Z",
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /Link/i.test(e))).toBe(true);
    expect(result.errors.some((e) => /End date/i.test(e))).toBe(true);
  });

  it("allows a complete banner", () => {
    expect(validateBannerForPublish(banner()).ok).toBe(true);
  });
});

describe("campaign priority engine", () => {
  it("ranks flash above festival above launch", () => {
    const flash = campaignPriorityScore({ marketingType: "flash_sale", priority: 10 });
    const festival = campaignPriorityScore({ marketingType: "festival", priority: 90 });
    const launch = campaignPriorityScore({ marketingType: "product_launch", priority: 100 });
    expect(flash).toBeGreaterThan(festival);
    expect(festival).toBeGreaterThan(launch);
  });

  it("boosts emergency announcement and free shipping", () => {
    const emergency = campaignPriorityScore({
      marketingType: "newsletter",
      priority: 10,
      homepageSlot: "announcement_bar",
      name: "Emergency notice",
      headline: "Urgent stock alert",
    });
    const freeShip = campaignPriorityScore({
      marketingType: "discount",
      priority: 10,
      name: "Free Shipping Weekend",
    });
    const plain = campaignPriorityScore({ marketingType: "newsletter", priority: 10 });
    expect(emergency).toBeGreaterThan(freeShip);
    expect(freeShip).toBeGreaterThan(plain);
  });

  it("picks a single winner per slot", () => {
    const items = [
      campaignItem({ name: "Festival", marketingType: "festival", priority: 40 }),
      campaignItem({ name: "Flash", marketingType: "flash_sale", priority: 20 }),
    ];
    const winners = resolveActiveSlotCampaigns(items);
    expect(winners.homepage_hero?.name).toBe("Flash");
  });

  it("rotates announcements by priority", () => {
    const items = [
      campaignItem({
        name: "A",
        marketingType: "newsletter",
        priority: 10,
        id: "a",
      }),
      campaignItem({
        name: "B",
        marketingType: "flash_sale",
        priority: 10,
        id: "b",
      }),
    ].map((c) => ({
      ...c,
      config: { ...c.config, homepageSlot: "announcement_bar" as const },
    }));
    const rotated = resolveRotatingSlotCampaigns(items, "announcement_bar", 2);
    expect(rotated[0].name).toBe("B");
    expect(rotated.length).toBe(2);
  });
});

describe("campaign publish validation", () => {
  it("requires CTA and valid dates", () => {
    const config = DEFAULT_CAMPAIGN_CONFIG();
    config.headline = "Hi";
    config.cta = { label: "", url: "" };
    config.targetUrl = "";
    config.startDate = "2026-08-01T00:00:00.000Z";
    config.endDate = "2026-07-01T00:00:00.000Z";
    const result = validateCampaignForPublish(config);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
