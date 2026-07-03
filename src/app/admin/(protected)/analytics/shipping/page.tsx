import { buildAnalyticsPageProps, getAnalyticsShippingPage } from "@/lib/admin/analytics-bi";
import AnalyticsDomainClient from "@/components/admin/analytics/AnalyticsDomainClient";

export default async function AnalyticsShippingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const props = await buildAnalyticsPageProps(sp, getAnalyticsShippingPage);
  return (
    <AnalyticsDomainClient
      {...props}
      basePath="/admin/analytics/shipping"
      reportType="shipping"
    />
  );
}
