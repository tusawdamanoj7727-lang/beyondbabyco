import { buildAnalyticsPageProps, getAnalyticsSalesPage } from "@/lib/admin/analytics-bi";
import AnalyticsDomainClient from "@/components/admin/analytics/AnalyticsDomainClient";

export default async function AnalyticsSalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const props = await buildAnalyticsPageProps(sp, getAnalyticsSalesPage);
  return (
    <AnalyticsDomainClient
      {...props}
      basePath="/admin/analytics/sales"
      reportType="sales"
    />
  );
}
