import StatsCard from "@/components/admin/StatsCard";
import type { AnalyticsKpi } from "@/lib/analytics/types";

export default function AnalyticsKpiGrid({ kpis }: { kpis: AnalyticsKpi[] }) {
  if (!kpis.length) {
    return (
      <div className="rounded-3xl border border-dashed border-cream-300 px-6 py-12 text-center text-sm text-green-700/60 dark:border-green-700 dark:text-green-200/60">
        No metrics for the selected filters.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" role="group" aria-label="Key metrics">
      {kpis.map((kpi) => (
        <div key={kpi.id} className="relative">
          <StatsCard label={kpi.label} value={kpi.value} icon={kpi.icon ?? "reports"} />
          {kpi.placeholder ? (
            <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
              Sample
            </span>
          ) : null}
          {kpi.hint ? <p className="mt-1 px-1 text-xs text-green-700/50 dark:text-green-200/50">{kpi.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
