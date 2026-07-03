import "server-only";

import { getCampaignCenterOverview } from "@/lib/admin/campaign-center";
import {
  formatReportMoney,
  formatReportNumber,
  formatReportPercent,
  type ReportFilters,
  type ReportSection,
} from "@/lib/admin/report-types";
import {
  getCustomerReport,
  getExecutiveDashboard,
  getInventoryReport,
  getMarketingReport,
  getOrdersReport,
  getPaymentReport,
  getProductsReport,
  getSalesReport,
  getShippingReport,
} from "@/lib/admin/reports";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { AnalyticsDomainPage, AnalyticsExecutiveOverview, AnalyticsKpi } from "@/lib/analytics/types";

function weekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function readOrderKpis(filters: ReportFilters) {
  const supabase = await createSupabaseServerClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, grand_total, customer_id, created_at")
    .is("deleted_at", null);

  const cancelled = new Set(["cancelled", "refunded"]);
  let filtered = orders ?? [];
  if (filters.dateFrom) filtered = filtered.filter((o) => o.created_at >= `${filters.dateFrom}T00:00:00`);
  if (filters.dateTo) filtered = filtered.filter((o) => o.created_at <= `${filters.dateTo}T23:59:59`);

  const weekly = filtered.filter((o) => o.created_at >= weekStart() && !cancelled.has(o.status));
  const weeklyRevenue = weekly.reduce((s, o) => s + Number(o.grand_total), 0);
  const cancelledCount = filtered.filter((o) => o.status === "cancelled").length;
  const orderCount = filtered.filter((o) => !cancelled.has(o.status)).length;

  return { weeklyRevenue, cancelledCount, orderCount };
}

async function readCustomerCount() {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase.from("customers").select("id", { count: "exact", head: true }).is("deleted_at", null);
  return count ?? 0;
}

export async function getAnalyticsExecutiveOverview(
  filters: ReportFilters,
  userId?: string,
): Promise<AnalyticsExecutiveOverview> {
  const [dashboard, orderKpis, customerCount] = await Promise.all([
    getExecutiveDashboard(filters, userId),
    readOrderKpis(filters),
    readCustomerCount(),
  ]);

  const conversionPlaceholder = 2.4;

  const kpis: AnalyticsKpi[] = [
    { id: "todays_revenue", label: "Today's Revenue", value: dashboard.widgets.todays_revenue, icon: "payments" },
    { id: "weekly_revenue", label: "Weekly Revenue", value: formatReportMoney(orderKpis.weeklyRevenue), icon: "payments" },
    { id: "monthly_revenue", label: "Monthly Revenue", value: dashboard.widgets.monthly_revenue, icon: "payments" },
    { id: "orders", label: "Orders", value: formatReportNumber(orderKpis.orderCount), icon: "orders" },
    { id: "customers", label: "Customers", value: formatReportNumber(customerCount), icon: "customers" },
    { id: "aov", label: "Average Order Value", value: dashboard.widgets.average_order_value, icon: "payments" },
    {
      id: "conversion",
      label: "Conversion Rate",
      value: formatReportPercent(conversionPlaceholder),
      icon: "activity",
      placeholder: true,
      hint: "Connect GA4 for live conversion data",
    },
    { id: "pending_orders", label: "Pending Orders", value: dashboard.widgets.pending_orders, icon: "orders" },
    { id: "cancelled_orders", label: "Cancelled Orders", value: formatReportNumber(orderKpis.cancelledCount), icon: "orders" },
    { id: "returns", label: "Returns", value: dashboard.widgets.returns, icon: "activity" },
    { id: "refunds", label: "Refunds", value: dashboard.widgets.refunds, icon: "activity" },
  ];

  return { kpis, dashboard, filters };
}

function sectionsToKpis(sections: ReportSection[]): AnalyticsKpi[] {
  return sections.flatMap((s) =>
    (s.metrics ?? []).slice(0, 8).map((m, i) => ({
      id: `${s.id}-${i}`,
      label: m.label,
      value: m.value,
      icon: "reports" as const,
    })),
  );
}

function sectionsToCharts(sections: ReportSection[]) {
  return sections
    .filter((s) => s.chart?.length)
    .map((s) => ({
      id: s.id,
      label: s.title,
      data: s.chart!,
      type: s.chartType,
    }));
}

export async function getAnalyticsSalesPage(filters: ReportFilters): Promise<AnalyticsDomainPage> {
  const { sections } = await getSalesReport(filters);
  const orders = await getOrdersReport(filters);
  const merged = [...sections, ...orders.sections.filter((s) => !sections.some((x) => x.id === s.id))];
  return {
    title: "Sales Analytics",
    description: "Revenue, orders, refunds, coupons, and payment mix.",
    kpis: sectionsToKpis(merged).slice(0, 10),
    sections: merged,
    charts: sectionsToCharts(merged),
  };
}

export async function getAnalyticsCustomersPage(filters: ReportFilters): Promise<AnalyticsDomainPage> {
  const { sections } = await getCustomerReport(filters);
  const kpis = sectionsToKpis(sections);
  kpis.push({
    id: "clv",
    label: "Customer LTV",
    value: "—",
    icon: "customers",
    placeholder: true,
    hint: "Placeholder until cohort LTV model is connected",
  });
  return {
    title: "Customer Analytics",
    description: "Growth, retention, locations, and repeat purchase behaviour.",
    kpis,
    sections,
    charts: sectionsToCharts(sections),
  };
}

export async function getAnalyticsProductsPage(filters: ReportFilters): Promise<AnalyticsDomainPage> {
  const [products, inventory] = await Promise.all([getProductsReport(filters), getInventoryReport(filters)]);
  const sections = [...products.sections, ...inventory.sections];
  return {
    title: "Product & Inventory Insights",
    description: "Best sellers, slow movers, stock levels, and restock suggestions.",
    kpis: sectionsToKpis(sections).slice(0, 12),
    sections,
    charts: sectionsToCharts(sections),
  };
}

export async function getAnalyticsMarketingPage(filters: ReportFilters): Promise<AnalyticsDomainPage> {
  const [report, campaigns] = await Promise.all([getMarketingReport(filters), getCampaignCenterOverview()]);
  const perf = campaigns.performance;
  const campaignKpis: AnalyticsKpi[] = [
    { id: "campaigns", label: "Campaigns", value: formatReportNumber(campaigns.total), icon: "coupons" },
    { id: "active", label: "Active", value: formatReportNumber(campaigns.active), icon: "activity" },
    { id: "clicks", label: "Clicks", value: formatReportNumber(perf.clicks), icon: "activity", placeholder: true },
    { id: "ctr", label: "CTR", value: formatReportPercent(perf.ctr), icon: "reports", placeholder: true },
    { id: "conversions", label: "Conversions", value: formatReportNumber(perf.conversions), icon: "orders", placeholder: true },
    { id: "campaign_revenue", label: "Revenue", value: formatReportMoney(perf.revenue), icon: "payments", placeholder: true },
    { id: "traffic", label: "Traffic", value: formatReportNumber(perf.traffic), icon: "activity", placeholder: true },
    {
      id: "top_campaign",
      label: "Top Campaign",
      value: campaigns.campaigns.find((c) => c.lifecycle === "active")?.name ?? "—",
      icon: "coupons",
    },
    {
      id: "pending_campaign",
      label: "Pending",
      value: formatReportNumber(campaigns.scheduled + campaigns.upcoming),
      icon: "coupons",
    },
  ];

  return {
    title: "Marketing Analytics",
    description: "Campaign performance, coupon usage, and traffic (sample until integrations connect).",
    kpis: [...campaignKpis, ...sectionsToKpis(report.sections).slice(0, 4)],
    sections: report.sections,
    charts: sectionsToCharts(report.sections),
  };
}

export async function getAnalyticsShippingPage(filters: ReportFilters): Promise<AnalyticsDomainPage> {
  const { sections } = await getShippingReport(filters);
  const kpis = sectionsToKpis(sections);
  kpis.push({
    id: "rto",
    label: "RTO Count",
    value: "—",
    icon: "orders",
    placeholder: true,
    hint: "Connect carrier webhooks for live RTO data",
  });
  return {
    title: "Shipping Analytics",
    description: "Dispatch, delivery times, courier performance, and success rates.",
    kpis,
    sections,
    charts: sectionsToCharts(sections),
  };
}

export async function getAnalyticsPaymentsPage(filters: ReportFilters): Promise<AnalyticsDomainPage> {
  const { sections } = await getPaymentReport(filters);
  return {
    title: "Payment Analytics",
    description: "Razorpay, COD, success rates, refunds, and payment trends.",
    kpis: sectionsToKpis(sections),
    sections,
    charts: sectionsToCharts(sections),
  };
}

export async function buildAnalyticsPageProps(
  sp: Record<string, string | undefined>,
  loader: (filters: ReportFilters) => Promise<AnalyticsDomainPage>,
) {
  const { parseReportFilters } = await import("@/lib/admin/report-filters");
  const { getReportFilterOptions, listSavedReports, listScheduledReports } = await import("@/lib/admin/reports");
  const { getAuthContext } = await import("@/lib/auth/session");
  const { hasPermission } = await import("@/lib/auth/guards");
  const { PERMISSIONS } = await import("@/lib/auth/permissions");

  const filters = parseReportFilters(sp);
  const ctx = await getAuthContext();
  const canManage = ctx.role === "admin" || (await hasPermission(PERMISSIONS.ANALYTICS_MANAGE));

  const [page, options, saved, scheduled] = await Promise.all([
    loader(filters),
    getReportFilterOptions(),
    listSavedReports(ctx.user?.id),
    listScheduledReports(),
  ]);

  return { page, filters, options, saved, scheduled, canManage };
}
