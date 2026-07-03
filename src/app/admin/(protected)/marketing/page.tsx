import dynamic from "next/dynamic";

import { getMarketingDashboard, getCampaignAnalytics } from "@/lib/admin/marketing";
import ModuleLoading from "@/components/ui/ModuleLoading";

const MarketingDashboardClient = dynamic(() => import("./MarketingDashboardClient"), {
  loading: () => <ModuleLoading label="Loading marketing dashboard…" />,
});

export default async function MarketingPage() {
  const [dashboard, analytics] = await Promise.all([getMarketingDashboard(), getCampaignAnalytics()]);
  return <MarketingDashboardClient dashboard={dashboard} analytics={analytics} />;
}
