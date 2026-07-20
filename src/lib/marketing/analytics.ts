import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { sampleAnalytics } from "@/lib/campaigns/helpers";
import type { CampaignAnalyticsPreview } from "@/lib/campaigns/types";

export type MarketingEventType = "view" | "unique_view" | "click" | "coupon_use" | "order" | "revenue";
export type MarketingSubjectType = "campaign" | "banner" | "announcement";

/** Fire-and-forget storefront tracking (anon insert policy). */
export async function trackMarketingEvent(input: {
  subjectType: MarketingSubjectType;
  subjectId: string;
  eventType: MarketingEventType;
  sessionId?: string | null;
  value?: number;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createSupabasePublicClient();
    await supabase.from("marketing_events" as never).insert({
      subject_type: input.subjectType,
      subject_id: input.subjectId,
      event_type: input.eventType,
      session_id: input.sessionId ?? null,
      value: input.value ?? 0,
      meta: input.meta ?? {},
    } as never);
  } catch {
    /* never block storefront */
  }
}

export async function getSubjectAnalytics(
  subjectType: MarketingSubjectType,
  subjectId: string,
): Promise<CampaignAnalyticsPreview> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("marketing_events" as never)
      .select("event_type, value, session_id")
      .eq("subject_type", subjectType)
      .eq("subject_id", subjectId);

    if (error || !data?.length) return sampleAnalytics(subjectId);

    const rows = data as { event_type: string; value: number; session_id: string | null }[];
    return aggregateEventRows(rows, subjectId);
  } catch {
    return sampleAnalytics(subjectId);
  }
}

function aggregateEventRows(
  rows: { event_type: string; value: number; session_id: string | null }[],
  fallbackSeed: string,
): CampaignAnalyticsPreview {
  if (!rows.length) return sampleAnalytics(fallbackSeed);

  const views = rows.filter((r) => r.event_type === "view").length;
  const unique = new Set(rows.filter((r) => r.event_type === "unique_view").map((r) => r.session_id)).size;
  const clicks = rows.filter((r) => r.event_type === "click").length;
  const couponUsage = rows.filter((r) => r.event_type === "coupon_use").length;
  const orders = rows.filter((r) => r.event_type === "order").length;
  const revenue = rows
    .filter((r) => r.event_type === "revenue" || r.event_type === "order")
    .reduce((sum, r) => sum + Number(r.value || 0), 0);
  const impressions = Math.max(views, unique, 1);

  return {
    impressions,
    clicks,
    ctr: impressions ? clicks / impressions : 0,
    conversions: orders,
    revenue,
    couponUsage,
    orders,
    traffic: unique || views,
    uniqueViews: unique || views,
    averageOrderValue: orders ? revenue / orders : 0,
    conversionRate: impressions ? orders / impressions : 0,
    returningCustomers: Math.round(orders * 0.2),
  };
}

/** Batch analytics for many campaigns in one query (avoids N+1). */
export async function getCampaignAnalyticsMap(
  campaignIds: string[],
): Promise<Map<string, CampaignAnalyticsPreview>> {
  const map = new Map<string, CampaignAnalyticsPreview>();
  if (!campaignIds.length) return map;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("marketing_events" as never)
      .select("subject_id, event_type, value, session_id")
      .eq("subject_type", "campaign")
      .in("subject_id", campaignIds);

    if (error || !data?.length) {
      for (const id of campaignIds) map.set(id, sampleAnalytics(id));
      return map;
    }

    const byId = new Map<string, { event_type: string; value: number; session_id: string | null }[]>();
    for (const row of data as { subject_id: string; event_type: string; value: number; session_id: string | null }[]) {
      const list = byId.get(row.subject_id) ?? [];
      list.push(row);
      byId.set(row.subject_id, list);
    }

    for (const id of campaignIds) {
      map.set(id, aggregateEventRows(byId.get(id) ?? [], id));
    }
  } catch {
    for (const id of campaignIds) map.set(id, sampleAnalytics(id));
  }

  return map;
}

export async function getMarketingOverviewAnalytics(): Promise<{
  bannerViews: number;
  announcementClicks: number;
  ctr: number;
  revenue: number;
  orders: number;
  couponsUsed: number;
  topCampaignId: string | null;
  bestBannerId: string | null;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("marketing_events" as never)
      .select("subject_type, subject_id, event_type, value")
      .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());

    const rows = (data ?? []) as {
      subject_type: string;
      subject_id: string;
      event_type: string;
      value: number;
    }[];

    if (!rows.length) {
      return {
        bannerViews: 0,
        announcementClicks: 0,
        ctr: 0,
        revenue: 0,
        orders: 0,
        couponsUsed: 0,
        topCampaignId: null,
        bestBannerId: null,
      };
    }

    const bannerViews = rows.filter((r) => r.subject_type === "banner" && r.event_type === "view").length;
    const announcementClicks = rows.filter(
      (r) => r.subject_type === "announcement" && r.event_type === "click",
    ).length;
    const clicks = rows.filter((r) => r.event_type === "click").length;
    const views = rows.filter((r) => r.event_type === "view" || r.event_type === "unique_view").length;
    const orders = rows.filter((r) => r.event_type === "order").length;
    const couponsUsed = rows.filter((r) => r.event_type === "coupon_use").length;
    const revenue = rows
      .filter((r) => r.event_type === "revenue" || r.event_type === "order")
      .reduce((s, r) => s + Number(r.value || 0), 0);

    const campaignClicks = new Map<string, number>();
    const bannerClicks = new Map<string, number>();
    for (const r of rows) {
      if (r.event_type !== "click") continue;
      if (r.subject_type === "campaign") {
        campaignClicks.set(r.subject_id, (campaignClicks.get(r.subject_id) ?? 0) + 1);
      }
      if (r.subject_type === "banner") {
        bannerClicks.set(r.subject_id, (bannerClicks.get(r.subject_id) ?? 0) + 1);
      }
    }

    const topCampaignId =
      [...campaignClicks.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const bestBannerId = [...bannerClicks.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      bannerViews,
      announcementClicks,
      ctr: views ? clicks / views : 0,
      revenue,
      orders,
      couponsUsed,
      topCampaignId,
      bestBannerId,
    };
  } catch {
    return {
      bannerViews: 0,
      announcementClicks: 0,
      ctr: 0,
      revenue: 0,
      orders: 0,
      couponsUsed: 0,
      topCampaignId: null,
      bestBannerId: null,
    };
  }
}
