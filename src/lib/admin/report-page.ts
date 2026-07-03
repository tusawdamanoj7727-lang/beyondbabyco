import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { parseReportFilters } from "@/lib/admin/report-filters";
import {
  getReportFilterOptions,
  listSavedReports,
  listScheduledReports,
} from "@/lib/admin/reports";
import type { ReportSection } from "@/lib/admin/report-types";

export async function buildReportPageProps(
  sp: Record<string, string | undefined>,
  reportType: string,
  title: string,
  basePath: string,
  loadSections: (filters: ReturnType<typeof parseReportFilters>) => Promise<{ sections: ReportSection[] }>,
) {
  const filters = parseReportFilters(sp);
  const ctx = await getAuthContext();
  const canManage = ctx.role === "admin" || (await hasPermission(PERMISSIONS.ANALYTICS_MANAGE));

  const [data, options, saved, scheduled] = await Promise.all([
    loadSections(filters),
    getReportFilterOptions(),
    listSavedReports(ctx.user?.id),
    listScheduledReports(),
  ]);

  return {
    title,
    reportType,
    sections: data.sections,
    filters,
    options,
    basePath,
    savedReports: saved,
    scheduledReports: scheduled,
    canManage,
  };
}
