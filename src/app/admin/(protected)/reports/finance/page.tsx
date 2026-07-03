import { getFinanceReport } from "@/lib/admin/reports";
import { buildReportPageProps } from "@/lib/admin/report-page";
import ReportCategoryClient from "@/components/admin/reports/ReportCategoryClient";

export default async function FinanceReportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const props = await buildReportPageProps(sp, "finance", "Finance Reports", "/admin/reports/finance", getFinanceReport);
  return <ReportCategoryClient {...props} />;
}
