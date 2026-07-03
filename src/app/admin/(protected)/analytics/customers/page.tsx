import { buildAnalyticsPageProps, getAnalyticsCustomersPage } from "@/lib/admin/analytics-bi";
import AnalyticsDomainClient from "@/components/admin/analytics/AnalyticsDomainClient";

export default async function AnalyticsCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const props = await buildAnalyticsPageProps(sp, getAnalyticsCustomersPage);
  return (
    <AnalyticsDomainClient
      {...props}
      basePath="/admin/analytics/customers"
      reportType="customers"
    />
  );
}
