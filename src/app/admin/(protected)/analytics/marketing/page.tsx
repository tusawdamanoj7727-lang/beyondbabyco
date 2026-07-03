import { buildAnalyticsPageProps, getAnalyticsMarketingPage } from "@/lib/admin/analytics-bi";
import AnalyticsDomainClient from "@/components/admin/analytics/AnalyticsDomainClient";

export default async function AnalyticsMarketingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const props = await buildAnalyticsPageProps(sp, getAnalyticsMarketingPage);
  return (
    <AnalyticsDomainClient
      {...props}
      basePath="/admin/analytics/marketing"
      reportType="marketing"
    />
  );
}
