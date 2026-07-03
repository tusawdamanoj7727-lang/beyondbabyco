import { describe, expect, it } from "vitest";

import {
  DEFAULT_CAMPAIGN_CONFIG,
  parseCampaignConfig,
  serializeCampaignConfig,
  slugifyCampaignName,
} from "@/lib/campaigns/config";
import { DEMO_CAMPAIGNS } from "@/lib/campaigns/demo-campaigns";
import {
  aggregatePerformance,
  buildCalendarEvents,
  deriveCampaignLifecycle,
  groupCampaignsByLifecycle,
  resolveActiveSlotCampaigns,
  sampleAnalytics,
} from "@/lib/campaigns/helpers";
import {
  AI_CREATIVE_FORMATS,
  HOMEPAGE_CAMPAIGN_SLOTS,
  MARKETING_CAMPAIGN_TYPES,
} from "@/lib/campaigns/types";

describe("campaign config", () => {
  it("round-trips config through buttons JSONB", () => {
    const config = {
      ...DEFAULT_CAMPAIGN_CONFIG(),
      slug: "test-campaign",
      headline: "Test headline",
      marketingType: "festival" as const,
    };
    const serialized = serializeCampaignConfig(config);
    const parsed = parseCampaignConfig(serialized);
    expect(parsed.slug).toBe("test-campaign");
    expect(parsed.headline).toBe("Test headline");
    expect(parsed.marketingType).toBe("festival");
  });

  it("slugifies campaign names", () => {
    expect(slugifyCampaignName("Monsoon Launch 2026!")).toBe("monsoon-launch-2026");
  });
});

describe("campaign helpers", () => {
  it("defines all marketing campaign types", () => {
    expect(MARKETING_CAMPAIGN_TYPES).toContain("product_launch");
    expect(MARKETING_CAMPAIGN_TYPES).toContain("influencer");
    expect(MARKETING_CAMPAIGN_TYPES.length).toBe(12);
  });

  it("defines homepage slots", () => {
    expect(HOMEPAGE_CAMPAIGN_SLOTS).toContain("homepage_hero");
    expect(HOMEPAGE_CAMPAIGN_SLOTS).toContain("announcement_bar");
  });

  it("derives lifecycle from dates and status", () => {
    const config = DEFAULT_CAMPAIGN_CONFIG();
    config.endDate = new Date(Date.now() - 86400000).toISOString();
    expect(deriveCampaignLifecycle("running", config)).toBe("expired");
  });

  it("groups campaigns by lifecycle", () => {
    const groups = groupCampaignsByLifecycle(DEMO_CAMPAIGNS);
    expect(groups.draft.length + groups.active.length).toBeGreaterThan(0);
  });

  it("resolves one campaign per homepage slot by priority", () => {
    const active = resolveActiveSlotCampaigns(DEMO_CAMPAIGNS.filter((c) => c.lifecycle === "active"));
    const slots = Object.keys(active);
    expect(slots.length).toBeLessThanOrEqual(HOMEPAGE_CAMPAIGN_SLOTS.length);
  });

  it("builds calendar events", () => {
    const events = buildCalendarEvents(DEMO_CAMPAIGNS);
    expect(events.length).toBeGreaterThan(0);
  });

  it("aggregates sample analytics", () => {
    const perf = aggregatePerformance(DEMO_CAMPAIGNS);
    expect(perf.impressions).toBeGreaterThan(0);
    expect(perf.ctr).toBeGreaterThanOrEqual(0);
  });

  it("generates deterministic sample analytics", () => {
    const a = sampleAnalytics("test-id");
    const b = sampleAnalytics("test-id");
    expect(a.impressions).toBe(b.impressions);
  });
});

describe("AI creative formats", () => {
  it("defines 9 creative formats", () => {
    expect(AI_CREATIVE_FORMATS.length).toBe(9);
    expect(AI_CREATIVE_FORMATS.some((f) => f.id === "instagram_post")).toBe(true);
    expect(AI_CREATIVE_FORMATS.some((f) => f.id === "campaign_hero")).toBe(true);
  });
});
