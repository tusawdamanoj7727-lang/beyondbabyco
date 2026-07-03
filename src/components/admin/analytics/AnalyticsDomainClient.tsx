"use client";

import ReportChart from "@/components/admin/reports/ReportChart";
import ReportSectionCard from "@/components/admin/reports/ReportSection";
import ExportMenu from "@/components/admin/reports/ExportMenu";
import AnalyticsKpiGrid from "@/components/admin/analytics/AnalyticsKpiGrid";
import AnalyticsSavedViews from "@/components/admin/analytics/AnalyticsSavedViews";
import AnalyticsToolbar from "@/components/admin/analytics/AnalyticsToolbar";
import type { AnalyticsDomainPage } from "@/lib/analytics/types";
import type { FilterOptions, ReportFilters, SavedReportRow, ScheduledReportRow } from "@/lib/admin/report-types";

export default function AnalyticsDomainClient({
  page,
  filters,
  options,
  basePath,
  reportType,
  saved,
  scheduled,
  canManage,
}: {
  page: AnalyticsDomainPage;
  filters: ReportFilters;
  options: FilterOptions;
  basePath: string;
  reportType: string;
  saved: SavedReportRow[];
  scheduled: ScheduledReportRow[];
  canManage: boolean;
}) {
  const exportRows = page.sections.flatMap((s) => s.rows ?? []);
  const exportCols = page.sections.find((s) => s.columns)?.columns ?? [
    { key: "metric", header: "Metric" },
    { key: "value", header: "Value" },
  ];
  const flatExportRows = exportRows.length
    ? exportRows
    : page.sections.flatMap((s) => (s.metrics ?? []).map((m) => ({ metric: m.label, value: m.value })));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-green-900 dark:text-cream-50">{page.title}</h2>
          <p className="mt-1 text-sm text-green-700/70 dark:text-green-200/70">{page.description}</p>
        </div>
        <ExportMenu
          reportType={reportType}
          rows={flatExportRows}
          columns={exportCols}
          filters={filters as Record<string, string | undefined>}
        />
      </div>

      <AnalyticsToolbar filters={filters} options={options} basePath={basePath} />
      <AnalyticsSavedViews path={basePath} filters={filters} />
      <AnalyticsKpiGrid kpis={page.kpis} />

      {page.charts.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {page.charts.map((chart) => (
            <div key={chart.id} className="rounded-3xl border border-cream-200 bg-white p-4 dark:border-green-800 dark:bg-green-950/40">
              <h3 className="font-heading text-sm font-bold text-green-900 dark:text-cream-50">{chart.label}</h3>
              <div className="mt-3">
                <ReportChart data={chart.data} type={chart.type ?? "bar"} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6">
        {page.sections.map((section, i) => (
          <ReportSectionCard key={section.id} section={section} index={i} />
        ))}
      </div>

      {canManage && saved.length > 0 ? (
        <p className="text-xs text-green-700/50">{saved.length} saved report(s) available in Reports hub.</p>
      ) : null}
      {canManage && scheduled.length > 0 ? (
        <p className="text-xs text-green-700/50">{scheduled.length} scheduled export(s) configured.</p>
      ) : null}
    </div>
  );
}
