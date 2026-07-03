import { buildAnalyticsPageProps, getAnalyticsProductsPage } from "@/lib/admin/analytics-bi";
import AnalyticsDomainClient from "@/components/admin/analytics/AnalyticsDomainClient";

export default async function AnalyticsProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const props = await buildAnalyticsPageProps(sp, getAnalyticsProductsPage);
  return (
    <AnalyticsDomainClient
      {...props}
      basePath="/admin/analytics/products"
      reportType="products"
    />
  );
}
