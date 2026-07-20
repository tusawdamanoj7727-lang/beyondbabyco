"use client";

import Link from "next/link";
import MotionSection from "@/components/ui/MotionSection";
import Card from "@/components/ui/Card";
import StatsCard from "@/components/admin/StatsCard";
import {
  formatMoney,
  formatPercent,
  MARKETING_INTEGRATIONS,
  type CampaignAnalytics,
  type MarketingDashboard,
} from "@/lib/admin/marketing-types";
import type { CampaignCenterOverview } from "@/lib/campaigns/types";

export type MarketingDashboardExtras = {
  bannerViews: number;
  announcementClicks: number;
  ctr: number;
  revenue: number;
  orders: number;
  couponsUsed: number;
  topCampaignName: string | null;
  bestBannerTitle: string | null;
  drafts: number;
  expired: number;
  active: number;
  scheduled: number;
};

export default function MarketingDashboardClient({
  dashboard,
  analytics,
  center,
  extras,
}: {
  dashboard: MarketingDashboard;
  analytics: CampaignAnalytics;
  center: CampaignCenterOverview;
  extras: MarketingDashboardExtras;
}) {
  return (
    <div className="space-y-8">
      <MotionSection as="div" variant="fadeUp" viewport={false}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <StatsCard label="Active Campaigns" value={String(extras.active || dashboard.runningCampaigns)} icon="sparkles" />
          <StatsCard label="Scheduled" value={String(extras.scheduled || dashboard.scheduledCampaigns)} icon="activity" />
          <StatsCard label="Drafts" value={String(extras.drafts || center.drafts)} icon="coupons" />
          <StatsCard label="Expired" value={String(extras.expired || center.expired)} icon="audit" />
          <StatsCard label="Banner Views" value={String(extras.bannerViews)} icon="banners" />
          <StatsCard label="Announcement Clicks" value={String(extras.announcementClicks)} icon="bell" />
          <StatsCard label="CTR" value={formatPercent(extras.ctr || dashboard.clickRate)} icon="activity" />
          <StatsCard label="Revenue" value={formatMoney(extras.revenue || dashboard.revenueGenerated)} icon="payments" />
          <StatsCard label="Orders" value={String(extras.orders)} icon="orders" />
          <StatsCard label="Coupons Used" value={String(extras.couponsUsed)} icon="coupons" />
        </div>
      </MotionSection>

      <div className="grid gap-4 md:grid-cols-2">
        <Card padding="md" radius="3xl" variant="outline">
          <p className="text-sm text-green-700/60">Top campaign</p>
          <p className="mt-1 font-heading text-lg font-bold text-green-900">
            {extras.topCampaignName ?? center.campaigns.find((c) => c.lifecycle === "active")?.name ?? "—"}
          </p>
        </Card>
        <Card padding="md" radius="3xl" variant="outline">
          <p className="text-sm text-green-700/60">Best performing banner</p>
          <p className="mt-1 font-heading text-lg font-bold text-green-900">
            {extras.bestBannerTitle ?? "—"}
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <QuickLink href="/admin/marketing/campaigns" label="Campaign Center" />
        <QuickLink href="/admin/banners" label="Banner Manager" />
        <QuickLink href="/admin/marketing/campaigns/calendar" label="Scheduler" />
        <QuickLink href="/admin/homepage" label="Homepage CMS" />
        <QuickLink href="/admin/coupons" label="Coupons" />
        <QuickLink href="/admin/media" label="Media Library" />
      </div>

      <section aria-labelledby="analytics-heading">
        <h2 id="analytics-heading" className="font-heading text-lg font-bold text-green-900">
          Channel Analytics
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Open Rate" value={formatPercent(analytics.openRate)} />
          <MetricCard label="Click Rate" value={formatPercent(analytics.clickRate)} />
          <MetricCard label="Bounce Rate" value={formatPercent(analytics.bounceRate)} />
          <MetricCard label="Delivery Rate" value={formatPercent(analytics.deliveryRate)} />
          <MetricCard label="Conversion" value={formatPercent(analytics.conversionRate)} />
          <MetricCard label="Revenue" value={formatMoney(analytics.revenue)} />
        </div>
      </section>

      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="font-heading text-lg font-bold text-green-900">
          Recent campaigns
        </h2>
        <ul className="mt-3 divide-y divide-cream-200 rounded-3xl border border-cream-200 bg-white">
          {center.campaigns.slice(0, 8).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <Link href={`/admin/marketing/campaigns/${c.id}`} className="font-semibold text-green-900 hover:underline">
                  {c.name}
                </Link>
                <p className="text-xs text-green-700/60">
                  {c.lifecycle} · CTR {formatPercent(c.analytics.ctr)}
                </p>
              </div>
              <span className="text-xs font-medium text-green-800">{formatMoney(c.analytics.revenue)}</span>
            </li>
          ))}
        </ul>
      </section>

      <Card padding="md" radius="3xl" variant="outline" className="border-dashed">
        <h3 className="font-heading text-sm font-bold text-green-900">Integrations ready</h3>
        <p className="mt-1 text-sm text-green-700/60">
          Architecture supports external ESP providers — connect when ready.
        </p>
        <ul className="mt-2 list-inside list-disc text-xs text-green-700/70">
          {MARKETING_INTEGRATIONS.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center rounded-3xl border border-green-200 px-4 text-sm font-medium text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
    >
      {label}
    </Link>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="md" radius="3xl" variant="outline">
      <p className="text-sm text-green-700/60">{label}</p>
      <p className="mt-1 font-heading text-xl font-bold text-green-900">{value}</p>
    </Card>
  );
}
