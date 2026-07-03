import { getReturnsReportData } from "@/lib/admin/reports";
import { buildReportPageProps } from "@/lib/admin/report-page";
import ReportCategoryClient from "@/components/admin/reports/ReportCategoryClient";

export default async function ReturnsReportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const props = await buildReportPageProps(sp, "returns", "Returns Reports", "/admin/reports/returns", getReturnsReportData);
  return <ReportCategoryClient {...props} />;
}
