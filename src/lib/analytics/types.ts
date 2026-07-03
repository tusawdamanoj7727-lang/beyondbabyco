import type { ChartPoint, ExecutiveDashboard, ReportFilters, ReportSection } from "@/lib/admin/report-types";

export const ANALYTICS_NAV = [
  { href: "/admin/analytics", label: "Dashboard" },
  { href: "/admin/analytics/sales", label: "Sales" },
  { href: "/admin/analytics/customers", label: "Customers" },
  { href: "/admin/analytics/products", label: "Products" },
  { href: "/admin/analytics/marketing", label: "Marketing" },
  { href: "/admin/analytics/shipping", label: "Shipping" },
  { href: "/admin/analytics/payments", label: "Payments" },
  { href: "/admin/analytics/reports", label: "Reports" },
] as const;

export const QUICK_DATE_RANGES = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "month", label: "This month" },
  { id: "custom", label: "Custom" },
] as const;

export type QuickDateRangeId = (typeof QUICK_DATE_RANGES)[number]["id"];

export interface AnalyticsKpi {
  id: string;
  label: string;
  value: string;
  hint?: string;
  icon?: "payments" | "orders" | "customers" | "inventory" | "reports" | "activity" | "coupons" | "reviews" | "accounting";
  placeholder?: boolean;
}

export interface AnalyticsExecutiveOverview {
  kpis: AnalyticsKpi[];
  dashboard: ExecutiveDashboard;
  filters: ReportFilters;
}

export interface AnalyticsDomainPage {
  title: string;
  description: string;
  kpis: AnalyticsKpi[];
  sections: ReportSection[];
  charts: { id: string; label: string; data: ChartPoint[]; type?: "bar" | "line" | "donut" }[];
}

export interface SavedAnalyticsView {
  id: string;
  name: string;
  path: string;
  filters: ReportFilters;
  createdAt: string;
}

export type ExternalAnalyticsProvider = "google_analytics_4" | "meta_pixel" | "microsoft_clarity" | "google_search_console";

export interface AnalyticsIntegrationStatus {
  provider: ExternalAnalyticsProvider;
  label: string;
  description: string;
  connected: boolean;
  configured: boolean;
}
