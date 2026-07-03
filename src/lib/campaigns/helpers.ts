import type { CampaignStatus } from "@/lib/admin/marketing-types";

import type {
  CalendarEvent,
  CampaignAnalyticsPreview,
  CampaignCenterConfig,
  CampaignCenterItem,
  CampaignLifecycle,
} from "./types";

export function deriveCampaignLifecycle(
  status: CampaignStatus,
  config: CampaignCenterConfig,
  now = new Date(),
): CampaignLifecycle {
  if (status === "draft") return "draft";
  if (status === "scheduled") return "scheduled";

  const start = config.startDate ? new Date(config.startDate) : null;
  const end = config.endDate ? new Date(config.endDate) : null;

  if (start && start > now) return "upcoming";
  if (end && end < now) return "expired";
  if (status === "running" || status === "paused") return "active";
  if (status === "completed" || status === "cancelled") return "expired";

  return "draft";
}

export function sampleAnalytics(seed: string): CampaignAnalyticsPreview {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const impressions = 5000 + (h % 45000);
  const clicks = Math.round(impressions * (0.02 + (h % 50) / 1000));
  const conversions = Math.round(clicks * (0.03 + (h % 30) / 1000));
  const orders = Math.round(conversions * 0.85);
  return {
    impressions,
    clicks,
    ctr: impressions ? clicks / impressions : 0,
    conversions,
    revenue: conversions * (800 + (h % 1200)),
    couponUsage: Math.round(conversions * 0.4),
    orders,
    traffic: Math.round(impressions * 0.7),
  };
}

export function aggregatePerformance(items: CampaignCenterItem[]): CampaignAnalyticsPreview {
  const totals = items.reduce(
    (acc, c) => ({
      impressions: acc.impressions + c.analytics.impressions,
      clicks: acc.clicks + c.analytics.clicks,
      conversions: acc.conversions + c.analytics.conversions,
      revenue: acc.revenue + c.analytics.revenue,
      couponUsage: acc.couponUsage + c.analytics.couponUsage,
      orders: acc.orders + c.analytics.orders,
      traffic: acc.traffic + c.analytics.traffic,
    }),
    { impressions: 0, clicks: 0, conversions: 0, revenue: 0, couponUsage: 0, orders: 0, traffic: 0 },
  );
  return {
    ...totals,
    ctr: totals.impressions ? totals.clicks / totals.impressions : 0,
  };
}

export function groupCampaignsByLifecycle(campaigns: CampaignCenterItem[]) {
  return {
    draft: campaigns.filter((c) => c.lifecycle === "draft"),
    upcoming: campaigns.filter((c) => c.lifecycle === "upcoming"),
    scheduled: campaigns.filter((c) => c.lifecycle === "scheduled"),
    active: campaigns.filter((c) => c.lifecycle === "active"),
    expired: campaigns.filter((c) => c.lifecycle === "expired"),
  };
}

export function buildCalendarEvents(campaigns: CampaignCenterItem[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const c of campaigns) {
    if (c.config.startDate) {
      events.push({
        id: `${c.id}-start`,
        title: `${c.name} starts`,
        date: c.config.startDate.slice(0, 10),
        endDate: c.config.endDate?.slice(0, 10) ?? null,
        type: c.config.marketingType,
        category: c.config.marketingType === "festival" ? "festival" : "campaign",
        status: c.status,
        campaignId: c.id,
      });
    }
    if (c.scheduledAt) {
      events.push({
        id: `${c.id}-send`,
        title: `Send: ${c.name}`,
        date: c.scheduledAt.slice(0, 10),
        type: c.config.marketingType,
        category: "campaign",
        status: c.status,
        campaignId: c.id,
      });
    }
    if (c.config.endDate) {
      events.push({
        id: `${c.id}-end`,
        title: `${c.name} ends`,
        date: c.config.endDate.slice(0, 10),
        type: c.config.marketingType,
        category: "reminder",
        status: c.status,
        campaignId: c.id,
      });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function resolveActiveSlotCampaigns(
  campaigns: CampaignCenterItem[],
): Partial<Record<CampaignCenterItem["config"]["homepageSlot"] & string, CampaignCenterItem>> {
  const active = campaigns.filter((c) => c.lifecycle === "active" && c.config.homepageSlot);
  const bySlot: Partial<Record<string, CampaignCenterItem>> = {};

  for (const c of active.sort((a, b) => b.config.priority - a.config.priority)) {
    const slot = c.config.homepageSlot;
    if (slot && !bySlot[slot]) bySlot[slot] = c;
  }

  return bySlot;
}

export function formatCampaignDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
