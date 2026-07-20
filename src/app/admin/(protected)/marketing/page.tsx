import dynamic from "next/dynamic";

import { getMarketingDashboard, getCampaignAnalytics } from "@/lib/admin/marketing";
import { getCampaignCenterOverview } from "@/lib/admin/campaign-center";
import { getMarketingOverviewAnalytics } from "@/lib/marketing/analytics";
import { listBanners } from "@/lib/admin/banners";
import ModuleLoading from "@/components/ui/ModuleLoading";

const MarketingDashboardClient = dynamic(() => import("./MarketingDashboardClient"), {
  loading: () => <ModuleLoading label="Loading marketing dashboard…" />,
});

export default async function MarketingPage() {
  const [dashboard, analytics, center, overviewEvents, banners] = await Promise.all([
    getMarketingDashboard(),
    getCampaignAnalytics(),
    getCampaignCenterOverview({ includeDemos: true }),
    getMarketingOverviewAnalytics(),
    listBanners().catch(() => ({ rows: [], dashboard: { total: 0, published: 0, draft: 0, archived: 0, scheduled: 0 } })),
  ]);

  const topCampaignName =
    center.campaigns.find((c) => c.id === overviewEvents.topCampaignId)?.name ??
    center.campaigns.find((c) => c.lifecycle === "active")?.name ??
    null;
  const bestBannerTitle =
    banners.rows.find((b) => b.id === overviewEvents.bestBannerId)?.title ??
    banners.rows.find((b) => b.status === "published")?.title ??
    null;

  return (
    <MarketingDashboardClient
      dashboard={dashboard}
      analytics={analytics}
      center={center}
      extras={{
        bannerViews: overviewEvents.bannerViews,
        announcementClicks: overviewEvents.announcementClicks,
        ctr: overviewEvents.ctr || dashboard.clickRate,
        revenue: overviewEvents.revenue || dashboard.revenueGenerated,
        orders: overviewEvents.orders,
        couponsUsed: overviewEvents.couponsUsed,
        topCampaignName,
        bestBannerTitle,
        drafts: center.drafts,
        expired: center.expired,
        active: center.active,
        scheduled: center.scheduled,
      }}
    />
  );
}
