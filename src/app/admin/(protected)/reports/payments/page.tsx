import { getPaymentReport } from "@/lib/admin/reports";
import { buildReportPageProps } from "@/lib/admin/report-page";
import ReportCategoryClient from "@/components/admin/reports/ReportCategoryClient";

export default async function PaymentsReportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const props = await buildReportPageProps(sp, "payments", "Payments Reports", "/admin/reports/payments", getPaymentReport);
  return <ReportCategoryClient {...props} />;
}
