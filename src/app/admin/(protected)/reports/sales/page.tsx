import { getSalesReport } from "@/lib/admin/reports";
import { buildReportPageProps } from "@/lib/admin/report-page";
import ReportCategoryClient from "@/components/admin/reports/ReportCategoryClient";

export default async function SalesReportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const props = await buildReportPageProps(sp, "sales", "Sales Reports", "/admin/reports/sales", getSalesReport);
  return <ReportCategoryClient {...props} />;
}
