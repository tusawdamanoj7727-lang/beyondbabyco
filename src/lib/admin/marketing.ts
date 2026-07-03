import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AutomationListItem,
  CampaignAnalytics,
  CampaignListItem,
  CampaignStatus,
  CampaignType,
  LoyaltyDashboard,
  MarketingDashboard,
  MarketingListResult,
  QueueItem,
  SegmentListItem,
  TemplateChannel,
  TemplateListItem,
} from "./marketing-types";

const PER_PAGE = 20;

function calcRate(num: number, denom: number): number {
  if (denom <= 0) return 0;
  return num / denom;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getMarketingDashboard(): Promise<MarketingDashboard> {
  const supabase = await createSupabaseServerClient();

  const [campaigns, subscribers, automation] = await Promise.all([
    supabase.from("marketing_campaigns").select("status, sent_count, opened_count, clicked_count, conversion_count, revenue").is("deleted_at", null),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("marketing_automation").select("run_count").eq("is_enabled", true),
  ]);

  const rows = campaigns.data ?? [];
  const totalSent = rows.reduce((s, r) => s + (r.sent_count ?? 0), 0);
  const totalOpened = rows.reduce((s, r) => s + (r.opened_count ?? 0), 0);
  const totalClicked = rows.reduce((s, r) => s + (r.clicked_count ?? 0), 0);
  const totalConverted = rows.reduce((s, r) => s + (r.conversion_count ?? 0), 0);
  const revenue = rows.reduce((s, r) => s + Number(r.revenue ?? 0), 0);

  return {
    totalCampaigns: rows.length,
    scheduledCampaigns: rows.filter((r) => r.status === "scheduled").length,
    runningCampaigns: rows.filter((r) => r.status === "running").length,
    completedCampaigns: rows.filter((r) => r.status === "completed").length,
    openRate: calcRate(totalOpened, totalSent),
    clickRate: calcRate(totalClicked, totalSent),
    conversionRate: calcRate(totalConverted, totalSent),
    revenueGenerated: revenue,
    subscribers: subscribers.count ?? 0,
    automationRuns: (automation.data ?? []).reduce((s, r) => s + (r.run_count ?? 0), 0),
  };
}

export async function getCampaignAnalytics(campaignType?: CampaignType): Promise<CampaignAnalytics> {
  const supabase = await createSupabaseServerClient();
  let q = supabase.from("marketing_campaigns").select("sent_count, delivered_count, opened_count, clicked_count, bounced_count, conversion_count, revenue").is("deleted_at", null);
  if (campaignType) q = q.eq("campaign_type", campaignType);

  const { data } = await q;
  const rows = data ?? [];
  const sent = rows.reduce((s, r) => s + (r.sent_count ?? 0), 0);
  const delivered = rows.reduce((s, r) => s + (r.delivered_count ?? 0), 0);
  const opened = rows.reduce((s, r) => s + (r.opened_count ?? 0), 0);
  const clicked = rows.reduce((s, r) => s + (r.clicked_count ?? 0), 0);
  const bounced = rows.reduce((s, r) => s + (r.bounced_count ?? 0), 0);
  const converted = rows.reduce((s, r) => s + (r.conversion_count ?? 0), 0);
  const revenue = rows.reduce((s, r) => s + Number(r.revenue ?? 0), 0);

  return {
    openRate: calcRate(opened, sent),
    clickRate: calcRate(clicked, sent),
    bounceRate: calcRate(bounced, sent),
    deliveryRate: calcRate(delivered, sent),
    conversionRate: calcRate(converted, sent),
    revenue,
  };
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export async function listCampaigns(opts: {
  search?: string;
  campaignType?: CampaignType | "all";
  status?: CampaignStatus | "all";
  page?: number;
}): Promise<MarketingListResult<CampaignListItem>> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let q = supabase
    .from("marketing_campaigns")
    .select("id, name, campaign_type, status, segment_id, template_id, scheduled_at, sent_count, opened_count, clicked_count, revenue, created_at", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts.campaignType && opts.campaignType !== "all") q = q.eq("campaign_type", opts.campaignType);
  if (opts.status && opts.status !== "all") q = q.eq("status", opts.status);
  if (opts.search) q = q.ilike("name", `%${opts.search}%`);

  const { data, count, error } = await q;
  if (error) return { rows: [], total: 0, page, perPage: PER_PAGE, pageCount: 0 };

  const segmentIds = [...new Set((data ?? []).map((r) => r.segment_id).filter(Boolean))] as string[];
  const templateIds = [...new Set((data ?? []).map((r) => r.template_id).filter(Boolean))] as string[];

  const [segRes, tplRes] = await Promise.all([
    segmentIds.length ? supabase.from("marketing_segments").select("id, name").in("id", segmentIds) : Promise.resolve({ data: [] }),
    templateIds.length ? supabase.from("marketing_templates").select("id, name").in("id", templateIds) : Promise.resolve({ data: [] }),
  ]);

  const segMap = new Map((segRes.data ?? []).map((s) => [s.id, s.name]));
  const tplMap = new Map((tplRes.data ?? []).map((t) => [t.id, t.name]));

  const rows: CampaignListItem[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    campaignType: r.campaign_type as CampaignType,
    status: r.status as CampaignStatus,
    segmentName: r.segment_id ? segMap.get(r.segment_id) ?? null : null,
    templateName: r.template_id ? tplMap.get(r.template_id) ?? null : null,
    scheduledAt: r.scheduled_at,
    sentCount: r.sent_count ?? 0,
    openedCount: r.opened_count ?? 0,
    clickedCount: r.clicked_count ?? 0,
    revenue: Number(r.revenue ?? 0),
    createdAt: r.created_at,
  }));

  const total = count ?? 0;
  return { rows, total, page, perPage: PER_PAGE, pageCount: Math.ceil(total / PER_PAGE) };
}

// ---------------------------------------------------------------------------
// Segments
// ---------------------------------------------------------------------------

export async function listSegments(opts: { search?: string; page?: number } = {}): Promise<MarketingListResult<SegmentListItem>> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let q = supabase
    .from("marketing_segments")
    .select("id, name, slug, segment_type, customer_count, is_active, criteria, updated_at", { count: "exact" })
    .is("deleted_at", null)
    .order("name")
    .range(from, to);

  if (opts.search) q = q.or(`name.ilike.%${opts.search}%,slug.ilike.%${opts.search}%`);

  const { data, count } = await q;
  const rows: SegmentListItem[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    segmentType: r.segment_type,
    customerCount: r.customer_count ?? 0,
    isActive: r.is_active,
    criteria: (r.criteria ?? {}) as Record<string, unknown>,
    updatedAt: r.updated_at,
  }));

  const total = count ?? 0;
  return { rows, total, page, perPage: PER_PAGE, pageCount: Math.ceil(total / PER_PAGE) };
}

/** Estimate segment size from preset criteria (read-only from customers/orders). */
export async function estimateSegmentCount(criteria: Record<string, unknown>): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const preset = criteria.preset as string | undefined;

  if (preset === "newsletter_subscribers") {
    const { count } = await supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("is_active", true);
    return count ?? 0;
  }

  if (preset === "first_time_buyers") {
    const { data } = await supabase.from("orders").select("customer_id").not("customer_id", "is", null).in("status", ["delivered", "completed"]);
    const counts = new Map<string, number>();
    for (const o of data ?? []) {
      if (o.customer_id) counts.set(o.customer_id, (counts.get(o.customer_id) ?? 0) + 1);
    }
    return [...counts.values()].filter((c) => c === 1).length;
  }

  if (preset === "returning_customers") {
    const { data } = await supabase.from("orders").select("customer_id").not("customer_id", "is", null).in("status", ["delivered", "completed"]);
    const counts = new Map<string, number>();
    for (const o of data ?? []) {
      if (o.customer_id) counts.set(o.customer_id, (counts.get(o.customer_id) ?? 0) + 1);
    }
    return [...counts.values()].filter((c) => c >= 2).length;
  }

  if (preset === "high_ltv") {
    const minSpend = Number(criteria.min_spend ?? 10000);
    const { data } = await supabase.from("orders").select("customer_id, grand_total").not("customer_id", "is", null).in("status", ["delivered", "completed"]);
    const totals = new Map<string, number>();
    for (const o of data ?? []) {
      if (o.customer_id) totals.set(o.customer_id, (totals.get(o.customer_id) ?? 0) + Number(o.grand_total ?? 0));
    }
    return [...totals.values()].filter((v) => v >= minSpend).length;
  }

  if (preset === "vip_customers") {
    const { count } = await supabase.from("customers").select("id", { count: "exact", head: true }).eq("is_vip", true).is("deleted_at", null);
    return count ?? 0;
  }

  if (preset === "inactive") {
    const days = Number(criteria.days ?? 90);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const { data: orders } = await supabase.from("orders").select("customer_id, created_at").not("customer_id", "is", null).in("status", ["delivered", "completed"]);
    const lastOrder = new Map<string, string>();
    for (const o of orders ?? []) {
      if (o.customer_id) {
        const prev = lastOrder.get(o.customer_id);
        if (!prev || o.created_at > prev) lastOrder.set(o.customer_id, o.created_at);
      }
    }
    const { count: totalCustomers } = await supabase.from("customers").select("id", { count: "exact", head: true }).is("deleted_at", null);
    const activeRecently = [...lastOrder.values()].filter((d) => d >= cutoff.toISOString()).length;
    return Math.max(0, (totalCustomers ?? 0) - activeRecently);
  }

  const { count } = await supabase.from("customers").select("id", { count: "exact", head: true });
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function listTemplates(opts: { channel?: TemplateChannel | "all"; status?: "active" | "archived" | "all"; page?: number } = {}): Promise<MarketingListResult<TemplateListItem>> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let q = supabase
    .from("marketing_templates")
    .select("id, name, channel, status, subject, title, variables, updated_at", { count: "exact" })
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (opts.channel && opts.channel !== "all") q = q.eq("channel", opts.channel);
  if (opts.status && opts.status !== "all") q = q.eq("status", opts.status);

  const { data, count } = await q;
  const rows: TemplateListItem[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    channel: r.channel as TemplateChannel,
    status: r.status as "active" | "archived",
    subject: r.subject,
    title: r.title,
    variables: Array.isArray(r.variables) ? (r.variables as string[]) : [],
    updatedAt: r.updated_at,
  }));

  const total = count ?? 0;
  return { rows, total, page, perPage: PER_PAGE, pageCount: Math.ceil(total / PER_PAGE) };
}

// ---------------------------------------------------------------------------
// Automation
// ---------------------------------------------------------------------------

export async function listAutomation(opts: { page?: number } = {}): Promise<MarketingListResult<AutomationListItem>> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const { data, count } = await supabase
    .from("marketing_automation")
    .select("id, name, slug, workflow_type, trigger_event, delay_minutes, action_type, is_enabled, run_count, last_run_at, segment_id, template_id", { count: "exact" })
    .order("name")
    .range(from, to);

  const segmentIds = [...new Set((data ?? []).map((r) => r.segment_id).filter(Boolean))] as string[];
  const templateIds = [...new Set((data ?? []).map((r) => r.template_id).filter(Boolean))] as string[];

  const [segRes, tplRes] = await Promise.all([
    segmentIds.length ? supabase.from("marketing_segments").select("id, name").in("id", segmentIds) : Promise.resolve({ data: [] }),
    templateIds.length ? supabase.from("marketing_templates").select("id, name").in("id", templateIds) : Promise.resolve({ data: [] }),
  ]);

  const segMap = new Map((segRes.data ?? []).map((s) => [s.id, s.name]));
  const tplMap = new Map((tplRes.data ?? []).map((t) => [t.id, t.name]));

  const rows: AutomationListItem[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    workflowType: r.workflow_type,
    triggerEvent: r.trigger_event,
    delayMinutes: r.delay_minutes ?? 0,
    actionType: r.action_type as CampaignType,
    isEnabled: r.is_enabled,
    runCount: r.run_count ?? 0,
    lastRunAt: r.last_run_at,
    segmentName: r.segment_id ? segMap.get(r.segment_id) ?? null : null,
    templateName: r.template_id ? tplMap.get(r.template_id) ?? null : null,
  }));

  const total = count ?? 0;
  return { rows, total, page, perPage: PER_PAGE, pageCount: Math.ceil(total / PER_PAGE) };
}

// ---------------------------------------------------------------------------
// Queues
// ---------------------------------------------------------------------------

export async function listEmailQueue(opts: { status?: string; page?: number } = {}): Promise<MarketingListResult<QueueItem>> {
  return listQueue("email_queue", opts);
}

export async function listWhatsappQueue(opts: { status?: string; page?: number } = {}): Promise<MarketingListResult<QueueItem>> {
  return listQueue("whatsapp_queue", opts);
}

export async function listPushQueue(opts: { status?: string; page?: number } = {}): Promise<MarketingListResult<QueueItem>> {
  return listQueue("push_queue", opts);
}

async function listQueue(table: "email_queue" | "whatsapp_queue" | "push_queue", opts: { status?: string; page?: number }): Promise<MarketingListResult<QueueItem>> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let q = supabase
    .from(table)
    .select("id, campaign_id, status, scheduled_at, sent_at, error, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts.status && opts.status !== "all") q = q.eq("status", opts.status);

  const { data, count } = await q;
  const campaignIds = [...new Set((data ?? []).map((r) => r.campaign_id).filter(Boolean))] as string[];
  const campRes = campaignIds.length
    ? await supabase.from("marketing_campaigns").select("id, name").in("id", campaignIds)
    : { data: [] as { id: string; name: string }[] };
  const campMap = new Map((campRes.data ?? []).map((c) => [c.id, c.name]));

  const rows: QueueItem[] = (data ?? []).map((r) => ({
    id: r.id,
    campaignId: r.campaign_id,
    campaignName: r.campaign_id ? campMap.get(r.campaign_id) ?? null : null,
    status: r.status as QueueItem["status"],
    scheduledAt: r.scheduled_at,
    sentAt: r.sent_at,
    error: r.error,
    createdAt: r.created_at,
  }));

  const total = count ?? 0;
  return { rows, total, page, perPage: PER_PAGE, pageCount: Math.ceil(total / PER_PAGE) };
}

// ---------------------------------------------------------------------------
// Loyalty (read-only from existing tables)
// ---------------------------------------------------------------------------

export async function getLoyaltyDashboard(): Promise<LoyaltyDashboard> {
  const supabase = await createSupabaseServerClient();

  const [points, referrals, recent] = await Promise.all([
    supabase.from("loyalty_points").select("customer_id, points"),
    supabase.from("referrals").select("status, reward_points").eq("status", "completed"),
    supabase
      .from("loyalty_points")
      .select("id, points, reason, created_at, customer_id")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const pointRows = points.data ?? [];
  const totalPoints = pointRows.reduce((s, r) => s + (r.points ?? 0), 0);
  const memberIds = new Set(pointRows.map((r) => r.customer_id).filter(Boolean));
  const refRows = referrals.data ?? [];

  const tierBreakdown = [
    { tier: "Bronze", count: memberIds.size },
    { tier: "Silver", count: Math.floor(memberIds.size * 0.2) },
    { tier: "Gold", count: Math.floor(memberIds.size * 0.05) },
  ];

  const customerIds = [...new Set((recent.data ?? []).map((r) => r.customer_id).filter(Boolean))] as string[];
  const custRes = customerIds.length
    ? await supabase.from("customers").select("id, full_name").in("id", customerIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const custMap = new Map((custRes.data ?? []).map((c) => [c.id, c.full_name]));

  const recentTransactions = (recent.data ?? []).map((r) => ({
    id: r.id,
    customerName: r.customer_id ? custMap.get(r.customer_id) ?? "Customer" : "Customer",
    points: r.points ?? 0,
    reason: r.reason ?? "—",
    createdAt: r.created_at,
  }));

  return {
    totalPoints,
    activeMembers: memberIds.size,
    referralsCompleted: refRows.length,
    referralRewards: refRows.reduce((s, r) => s + (r.reward_points ?? 0), 0),
    tierBreakdown,
    recentTransactions,
  };
}

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

export async function getMarketingFilterOptions() {
  const supabase = await createSupabaseServerClient();
  const [segments, templates] = await Promise.all([
    supabase.from("marketing_segments").select("id, name").is("deleted_at", null).eq("is_active", true).order("name"),
    supabase.from("marketing_templates").select("id, name, channel").is("deleted_at", null).eq("status", "active").order("name"),
  ]);
  return {
    segments: segments.data ?? [],
    templates: templates.data ?? [],
  };
}
