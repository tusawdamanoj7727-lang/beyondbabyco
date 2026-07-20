import "server-only";

import { cache } from "react";

import { parseCampaignConfig } from "@/lib/campaigns/config";
import { DEMO_CAMPAIGNS } from "@/lib/campaigns/demo-campaigns";
import {
  aggregatePerformance,
  buildCalendarEvents,
  deriveCampaignLifecycle,
  groupCampaignsByLifecycle,
  resolveActiveSlotCampaigns,
  sampleAnalytics,
} from "@/lib/campaigns/helpers";
import type {
  CampaignCenterItem,
  CampaignCenterOverview,
  CalendarEvent,
  HomepageCampaignSlot,
} from "@/lib/campaigns/types";
import { getCampaignAnalyticsMap } from "@/lib/marketing/analytics";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { CampaignStatus } from "./marketing-types";

async function fetchCampaignRows() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("marketing_campaigns")
    .select(
      "id, name, campaign_type, status, segment_id, scheduled_at, buttons, title, message, image_url, deep_link, created_at",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const segmentIds = [...new Set(rows.map((r) => r.segment_id).filter(Boolean))] as string[];
  const { data: segments } = segmentIds.length
    ? await supabase.from("marketing_segments").select("id, name").in("id", segmentIds)
    : { data: [] };
  const segMap = new Map((segments ?? []).map((s) => [s.id, s.name]));

  const analyticsMap = await getCampaignAnalyticsMap(rows.map((r) => r.id));

  return rows.map((r) => {
    const config = parseCampaignConfig(r.buttons);
    if (!config.headline && r.title) config.headline = r.title;
    if (!config.description && r.message) config.description = r.message;
    if (!config.targetUrl && r.deep_link) config.targetUrl = r.deep_link;
    if (!config.assets.hero && r.image_url) config.assets.hero = r.image_url;

    const item: CampaignCenterItem = {
      id: r.id,
      name: r.name,
      channelType: r.campaign_type,
      status: r.status as CampaignStatus,
      lifecycle: deriveCampaignLifecycle(r.status as CampaignStatus, config),
      config,
      scheduledAt: r.scheduled_at,
      segmentName: r.segment_id ? segMap.get(r.segment_id) ?? null : null,
      createdAt: r.created_at,
      analytics: analyticsMap.get(r.id) ?? sampleAnalytics(r.id),
    };
    return item;
  });
}

export async function getCampaignCenterItem(id: string): Promise<CampaignCenterItem | null> {
  const items = await fetchCampaignRows();
  return items.find((c) => c.id === id) ?? null;
}

export async function getCampaignCenterOverview(opts?: {
  /** When true, merge demo campaigns for empty admin UI only. Never for storefront. */
  includeDemos?: boolean;
}): Promise<CampaignCenterOverview> {
  let campaigns = await fetchCampaignRows();
  const includeDemos = opts?.includeDemos === true;
  const hasRichConfig = campaigns.some((c) => c.config.slug || c.config.headline);

  if (includeDemos && (!campaigns.length || !hasRichConfig)) {
    campaigns = [...campaigns, ...DEMO_CAMPAIGNS.filter((d) => !campaigns.some((c) => c.id === d.id))];
  }

  const groups = groupCampaignsByLifecycle(campaigns);

  return {
    total: campaigns.length,
    drafts: groups.draft.length,
    upcoming: groups.upcoming.length,
    scheduled: groups.scheduled.length,
    active: groups.active.length,
    expired: groups.expired.length,
    performance: aggregatePerformance(campaigns.filter((c) => !c.id.startsWith("demo-"))),
    campaigns,
  };
}

export async function getCampaignCalendarEvents(): Promise<CalendarEvent[]> {
  const overview = await getCampaignCenterOverview({ includeDemos: true });
  const events = buildCalendarEvents(overview.campaigns);

  events.push(
    {
      id: "fest-diwali",
      title: "Diwali Campaign Planning",
      date: "2026-10-15",
      type: "festival",
      category: "festival",
      status: "planned",
    },
    {
      id: "newsletter-weekly",
      title: "Weekly Newsletter",
      date: new Date().toISOString().slice(0, 10),
      type: "newsletter",
      category: "newsletter",
      status: "scheduled",
    },
  );

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export const getActiveHomepageCampaigns = cache(async () => {
  // Never inject DEMO_CAMPAIGNS into live storefront slots.
  const overview = await getCampaignCenterOverview({ includeDemos: false });
  return resolveActiveSlotCampaigns(
    overview.campaigns.filter((c) => !c.id.startsWith("demo-")),
  );
});

export type StorefrontCampaignSlot = {
  slot: HomepageCampaignSlot;
  headline: string;
  subheading: string;
  ctaLabel: string;
  ctaUrl: string;
  targetUrl: string;
  theme: { primary: string; background: string; accent?: string };
  bannerUrl?: string | null;
  heroUrl?: string | null;
};

export async function getStorefrontCampaignSlots(): Promise<Partial<Record<HomepageCampaignSlot, StorefrontCampaignSlot>>> {
  const active = await getActiveHomepageCampaigns();
  const result: Partial<Record<HomepageCampaignSlot, StorefrontCampaignSlot>> = {};

  for (const [slot, campaign] of Object.entries(active)) {
    if (!campaign?.config.homepageSlot) continue;
    result[slot as HomepageCampaignSlot] = {
      slot: slot as HomepageCampaignSlot,
      headline: campaign.config.headline,
      subheading: campaign.config.subheading,
      ctaLabel: campaign.config.cta.label,
      ctaUrl: campaign.config.cta.url,
      targetUrl: campaign.config.targetUrl,
      theme: campaign.config.theme,
      bannerUrl: campaign.config.assets.banner ?? campaign.config.assets.mobileBanner ?? null,
      heroUrl: campaign.config.assets.hero ?? null,
    };
  }

  return result;
}
