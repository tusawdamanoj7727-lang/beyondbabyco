import { buildAnalyticsPageProps, getAnalyticsPaymentsPage } from "@/lib/admin/analytics-bi";
import AnalyticsDomainClient from "@/components/admin/analytics/AnalyticsDomainClient";

export default async function AnalyticsPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const props = await buildAnalyticsPageProps(sp, getAnalyticsPaymentsPage);
  return (
    <AnalyticsDomainClient
      {...props}
      basePath="/admin/analytics/payments"
      reportType="payments"
    />
  );
}
