import dynamic from "next/dynamic";

import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getAnalyticsExecutiveOverview } from "@/lib/admin/analytics-bi";
import { getReportFilterOptions } from "@/lib/admin/reports";
import { parseReportFilters } from "@/lib/admin/report-filters";
import ModuleLoading from "@/components/ui/ModuleLoading";

const AnalyticsDashboardClient = dynamic(() => import("./AnalyticsDashboardClient"), {
  loading: () => <ModuleLoading label="Loading analytics…" />,
});

export default async function AnalyticsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseReportFilters(sp);
  const ctx = await getAuthContext();
  const canManage = ctx.role === "admin" || (await hasPermission(PERMISSIONS.ANALYTICS_MANAGE));

  const [overview, options] = await Promise.all([
    getAnalyticsExecutiveOverview(filters, ctx.user?.id),
    getReportFilterOptions(),
  ]);

  return <AnalyticsDashboardClient overview={overview} options={options} canManage={canManage} />;
}
