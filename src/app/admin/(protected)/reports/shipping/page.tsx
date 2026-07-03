import { getShippingReport } from "@/lib/admin/reports";
import { buildReportPageProps } from "@/lib/admin/report-page";
import ReportCategoryClient from "@/components/admin/reports/ReportCategoryClient";

export default async function ShippingReportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const props = await buildReportPageProps(sp, "shipping", "Shipping Reports", "/admin/reports/shipping", getShippingReport);
  return <ReportCategoryClient {...props} />;
}
