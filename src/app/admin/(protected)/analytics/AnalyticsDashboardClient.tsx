"use client";

import MotionSection from "@/components/ui/MotionSection";
import AiInsightsPlaceholder from "@/components/admin/reports/AiInsightsPlaceholder";
import DashboardWidgetGrid from "@/components/admin/reports/DashboardWidgetGrid";
import ReportChart from "@/components/admin/reports/ReportChart";
import AnalyticsIntegrationsPanel from "@/components/admin/analytics/AnalyticsIntegrationsPanel";
import AnalyticsKpiGrid from "@/components/admin/analytics/AnalyticsKpiGrid";
import AnalyticsSavedViews from "@/components/admin/analytics/AnalyticsSavedViews";
import AnalyticsToolbar from "@/components/admin/analytics/AnalyticsToolbar";
import { CHART_LABELS, type ChartKey, type FilterOptions } from "@/lib/admin/report-types";
import type { AnalyticsExecutiveOverview } from "@/lib/analytics/types";

export default function AnalyticsDashboardClient({
  overview,
  options,
  canManage,
}: {
  overview: AnalyticsExecutiveOverview;
  options: FilterOptions;
  canManage: boolean;
}) {
  const highlightCharts: ChartKey[] = ["revenue_trend", "top_categories", "top_products", "orders_trend"];

  return (
    <div className="space-y-8">
      <AnalyticsToolbar filters={overview.filters} options={options} basePath="/admin/analytics" />
      <AnalyticsSavedViews path="/admin/analytics" filters={overview.filters} />

      <MotionSection as="div" variant="fadeUp" viewport={false}>
        <AnalyticsKpiGrid kpis={overview.kpis} />
      </MotionSection>

      <section aria-labelledby="revenue-trend-heading">
        <h2 id="revenue-trend-heading" className="font-heading text-lg font-bold text-green-900 dark:text-cream-50">
          Revenue trend
        </h2>
        <div className="mt-4 rounded-3xl border border-cream-200 bg-white p-4 dark:border-green-800 dark:bg-green-950/40">
          <ReportChart data={overview.dashboard.charts.revenue_trend} type="line" ariaLabel={CHART_LABELS.revenue_trend} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {highlightCharts.slice(1).map((key) => (
          <div key={key} className="rounded-3xl border border-cream-200 bg-white p-4 dark:border-green-800 dark:bg-green-950/40">
            <h3 className="font-heading text-sm font-bold text-green-900 dark:text-cream-50">{CHART_LABELS[key]}</h3>
            <div className="mt-3">
              <ReportChart
                data={overview.dashboard.charts[key]}
                type={key.includes("top") ? "bar" : "line"}
                ariaLabel={CHART_LABELS[key]}
              />
            </div>
          </div>
        ))}
      </div>

      <DashboardWidgetGrid dashboard={overview.dashboard} canManage={canManage} />
      <AiInsightsPlaceholder />
      <AnalyticsIntegrationsPanel />
    </div>
  );
}
