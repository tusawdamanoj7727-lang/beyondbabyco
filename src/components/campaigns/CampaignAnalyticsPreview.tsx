import StatsCard from "@/components/admin/StatsCard";
import { formatMoney, formatPercent } from "@/lib/admin/marketing-types";
import type { CampaignAnalyticsPreview } from "@/lib/campaigns/types";

export default function CampaignAnalyticsPreviewCards({
  analytics,
  compact = false,
}: {
  analytics: CampaignAnalyticsPreview;
  compact?: boolean;
}) {
  const cards = [
    { label: "Impressions", value: analytics.impressions.toLocaleString("en-IN"), icon: "activity" as const },
    { label: "Clicks", value: analytics.clicks.toLocaleString("en-IN"), icon: "newsletter" as const },
    { label: "CTR", value: formatPercent(analytics.ctr), icon: "sparkles" as const },
    { label: "Conversions", value: String(analytics.conversions), icon: "coupons" as const },
    { label: "Revenue", value: formatMoney(analytics.revenue), icon: "payments" as const },
    { label: "Coupon Usage", value: String(analytics.couponUsage), icon: "coupons" as const },
    { label: "Orders", value: String(analytics.orders), icon: "orders" as const },
    { label: "Traffic", value: analytics.traffic.toLocaleString("en-IN"), icon: "activity" as const },
  ];

  return (
    <div
      className={compact ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4" : "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"}
      role="group"
      aria-label="Campaign analytics preview"
    >
      {cards.map((c) => (
        <StatsCard key={c.label} label={c.label} value={c.value} icon={c.icon} />
      ))}
      <p className="col-span-full text-xs text-green-700/50">
        Sample metrics — connect analytics providers for live data.
      </p>
    </div>
  );
}
