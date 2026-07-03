import type { CampaignStatus } from "@/lib/admin/marketing-types";

import type { CampaignCenterConfig, CampaignCenterItem } from "./types";
import { DEFAULT_CAMPAIGN_CONFIG } from "./config";
import { deriveCampaignLifecycle, sampleAnalytics } from "./helpers";

function demoConfig(partial: Partial<CampaignCenterConfig>): CampaignCenterConfig {
  return { ...DEFAULT_CAMPAIGN_CONFIG(), ...partial };
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Demo campaigns shown in overview when DB has no campaign center configs. */
export const DEMO_CAMPAIGNS: CampaignCenterItem[] = (
  [
  {
    id: "demo-monsoon-launch",
    name: "Monsoon Gentle Care Launch",
    channelType: "email",
    status: "scheduled" as CampaignStatus,
    lifecycle: "upcoming",
    config: demoConfig({
      slug: "monsoon-gentle-care",
      marketingType: "product_launch",
      headline: "Monsoon-ready gentle care",
      subheading: "Dermatologist-tested formulas for humid weather",
      description: "Launch our new monsoon collection with research-backed hydration and barrier support.",
      cta: { label: "Explore the collection", url: "/products" },
      targetUrl: "/products?sort=newest",
      startDate: daysFromNow(7),
      endDate: daysFromNow(45),
      priority: 90,
      homepageSlot: "homepage_hero",
      theme: { primary: "#1a4d2e", background: "#e8f4ec", accent: "#c45c3e" },
      assets: {
        hero: "/images/generated/homepage/phase-8-2/lifestyle/lifestyle-01.png",
        banner: "/images/generated/homepage/phase-8-2/lifestyle/lifestyle-04.png",
      },
      landingSlug: "monsoon-gentle-care",
      communicationsTemplateId: "launch-campaign",
    }),
    scheduledAt: daysFromNow(5),
    segmentName: "Newsletter Subscribers",
    createdAt: daysFromNow(-14),
    analytics: sampleAnalytics("monsoon"),
  },
  {
    id: "demo-rakhi-festival",
    name: "Rakhi Festival Gifting",
    channelType: "email",
    status: "running" as CampaignStatus,
    lifecycle: "active",
    config: demoConfig({
      slug: "rakhi-gifting",
      marketingType: "festival",
      headline: "Gift gentle care this Rakhi",
      subheading: "Curated bundles for siblings & new parents",
      description: "Celebrate Rakhi with premium baby care gift sets and free personalised note cards.",
      cta: { label: "Shop gift bundles", url: "/products" },
      targetUrl: "/products?sort=best_selling",
      startDate: daysFromNow(-3),
      endDate: daysFromNow(12),
      priority: 85,
      homepageSlot: "announcement_bar",
      theme: { primary: "#7c2d12", background: "#fff7ed", accent: "#ea580c" },
      assets: {
        banner: "/images/generated/homepage/phase-8-2/lifestyle/lifestyle-10.png",
      },
      communicationsTemplateId: "festival-campaign",
    }),
    scheduledAt: daysFromNow(-5),
    segmentName: "Returning Customers",
    createdAt: daysFromNow(-21),
    analytics: sampleAnalytics("rakhi"),
  },
  {
    id: "demo-flash-sale",
    name: "Weekend Flash Sale",
    channelType: "push",
    status: "draft" as CampaignStatus,
    lifecycle: "draft",
    config: demoConfig({
      slug: "weekend-flash",
      marketingType: "flash_sale",
      headline: "48-hour flash savings",
      subheading: "Up to 20% off bestsellers",
      description: "Limited-time flash sale on top-rated baby care essentials.",
      cta: { label: "Grab the deal", url: "/products" },
      targetUrl: "/products?sort=best_selling",
      startDate: daysFromNow(2),
      endDate: daysFromNow(4),
      priority: 95,
      homepageSlot: "popup_banner",
      theme: { primary: "#1a4d2e", background: "#faf7f2", accent: "#dc2626" },
    }),
    scheduledAt: null,
    segmentName: null,
    createdAt: daysFromNow(-2),
    analytics: sampleAnalytics("flash"),
  },
  ] as CampaignCenterItem[]
).map((c) => ({ ...c, lifecycle: deriveCampaignLifecycle(c.status, c.config) }));
