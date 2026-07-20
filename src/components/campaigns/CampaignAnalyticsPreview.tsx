import StatsCard from "@/components/admin/StatsCard";
import { formatMoney, formatPercent } from "@/lib/admin/marketing-types";
import type { CampaignAnalyticsPreview } from "@/lib/campaigns/types";

export default function CampaignAnalyticsPreviewCards({
  analytics,
  compact = false,
  live = false,
}: {
  analytics: CampaignAnalyticsPreview;
  compact?: boolean;
  /** True when metrics come from marketing_events (not sample seed). */
  live?: boolean;
}) {
  const cards = [
    { label: "Views", value: analytics.impressions.toLocaleString("en-IN"), icon: "activity" as const },
    {
      label: "Unique Views",
      value: (analytics.uniqueViews ?? analytics.traffic).toLocaleString("en-IN"),
      icon: "activity" as const,
    },
    { label: "Clicks", value: analytics.clicks.toLocaleString("en-IN"), icon: "newsletter" as const },
    { label: "CTR", value: formatPercent(analytics.ctr), icon: "sparkles" as const },
    { label: "Coupon Usage", value: String(analytics.couponUsage), icon: "coupons" as const },
    { label: "Orders", value: String(analytics.orders), icon: "orders" as const },
    { label: "Revenue", value: formatMoney(analytics.revenue), icon: "payments" as const },
    {
      label: "AOV",
      value: formatMoney(analytics.averageOrderValue ?? (analytics.orders ? analytics.revenue / analytics.orders : 0)),
      icon: "revenue" as const,
    },
    {
      label: "Conversion",
      value: formatPercent(analytics.conversionRate ?? (analytics.impressions ? analytics.conversions / analytics.impressions : 0)),
      icon: "sparkles" as const,
    },
    {
      label: "Returning Customers",
      value: String(analytics.returningCustomers ?? 0),
      icon: "customers" as const,
    },
  ];

  return (
    <div
      className={compact ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4" : "grid gap-4 sm:grid-cols-2 xl:grid-cols-5"}
      role="group"
      aria-label="Campaign analytics"
    >
      {cards.map((c) => (
        <StatsCard key={c.label} label={c.label} value={c.value} icon={c.icon} />
      ))}
      <p className="col-span-full text-xs text-green-700/50">
        {live
          ? "Live metrics from marketing_events (last attributed activity)."
          : "Preview metrics — live counts appear after storefront tracking events are recorded."}
      </p>
    </div>
  );
}
