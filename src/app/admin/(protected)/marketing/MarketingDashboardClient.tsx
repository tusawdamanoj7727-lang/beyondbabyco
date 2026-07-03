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

export default function MarketingDashboardClient({
  dashboard,
  analytics,
}: {
  dashboard: MarketingDashboard;
  analytics: CampaignAnalytics;
}) {
  return (
    <div className="space-y-8">
      <MotionSection as="div" variant="fadeUp" viewport={false}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <StatsCard label="Campaigns" value={String(dashboard.totalCampaigns)} icon="coupons" />
          <StatsCard label="Scheduled" value={String(dashboard.scheduledCampaigns)} icon="activity" />
          <StatsCard label="Running" value={String(dashboard.runningCampaigns)} icon="sparkles" />
          <StatsCard label="Completed" value={String(dashboard.completedCampaigns)} icon="revenue" />
          <StatsCard label="Open Rate" value={formatPercent(dashboard.openRate)} icon="newsletter" />
          <StatsCard label="Click Rate" value={formatPercent(dashboard.clickRate)} icon="activity" />
          <StatsCard label="Conversion Rate" value={formatPercent(dashboard.conversionRate)} icon="coupons" />
          <StatsCard label="Revenue Generated" value={formatMoney(dashboard.revenueGenerated)} icon="payments" />
          <StatsCard label="Subscribers" value={String(dashboard.subscribers)} icon="newsletter" />
          <StatsCard label="Automation Runs" value={String(dashboard.automationRuns)} icon="sparkles" />
        </div>
      </MotionSection>

      <div className="flex flex-wrap gap-2">
        <QuickLink href="/admin/marketing/campaigns" label="All Campaigns" />
        <QuickLink href="/admin/marketing/segments" label="Segments" />
        <QuickLink href="/admin/marketing/automation" label="Automation" />
        <QuickLink href="/admin/marketing/loyalty" label="Loyalty" />
      </div>

      <section aria-labelledby="analytics-heading">
        <h2 id="analytics-heading" className="font-heading text-lg font-bold text-green-900">Campaign Analytics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Open Rate" value={formatPercent(analytics.openRate)} />
          <MetricCard label="Click Rate" value={formatPercent(analytics.clickRate)} />
          <MetricCard label="Bounce Rate" value={formatPercent(analytics.bounceRate)} />
          <MetricCard label="Delivery Rate" value={formatPercent(analytics.deliveryRate)} />
          <MetricCard label="Conversion" value={formatPercent(analytics.conversionRate)} />
          <MetricCard label="Revenue" value={formatMoney(analytics.revenue)} />
        </div>
      </section>

      <Card padding="md" radius="3xl" variant="outline" className="border-dashed">
        <h3 className="font-heading text-sm font-bold text-green-900">Future integrations</h3>
        <p className="mt-1 text-sm text-green-700/60">Architecture is ready for external providers — no API connected yet.</p>
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
    <Link href={href} className="inline-flex h-10 items-center rounded-3xl border border-green-200 px-4 text-sm font-medium text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50">
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
