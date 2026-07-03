import { getMarketingReport } from "@/lib/admin/reports";
import { buildReportPageProps } from "@/lib/admin/report-page";
import ReportCategoryClient from "@/components/admin/reports/ReportCategoryClient";

export default async function MarketingReportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const props = await buildReportPageProps(sp, "marketing", "Marketing Reports", "/admin/reports/marketing", getMarketingReport);
  return <ReportCategoryClient {...props} />;
}
