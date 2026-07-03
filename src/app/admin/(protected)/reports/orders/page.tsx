import { getOrdersReport } from "@/lib/admin/reports";
import { buildReportPageProps } from "@/lib/admin/report-page";
import ReportCategoryClient from "@/components/admin/reports/ReportCategoryClient";

export default async function OrdersReportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const props = await buildReportPageProps(sp, "orders", "Orders Reports", "/admin/reports/orders", getOrdersReport);
  return <ReportCategoryClient {...props} />;
}
