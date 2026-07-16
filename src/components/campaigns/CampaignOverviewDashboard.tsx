"use client";

import Link from "next/link";

import { CampaignStatusBadge } from "@/components/admin/marketing/MarketingStatusBadge";
import CampaignTypeBadge from "@/components/campaigns/CampaignTypeBadge";
import { formatCampaignDate } from "@/lib/campaigns/helpers";
import type { CampaignCenterItem, CampaignCenterOverview } from "@/lib/campaigns/types";

export default function CampaignOverviewDashboard({
  overview,
}: {
  overview: CampaignCenterOverview;
}) {
  const sections = [
    { key: "active", title: "Active Campaigns", items: overview.campaigns.filter((c) => c.lifecycle === "active") },
    { key: "upcoming", title: "Upcoming", items: overview.campaigns.filter((c) => c.lifecycle === "upcoming") },
    { key: "scheduled", title: "Scheduled", items: overview.campaigns.filter((c) => c.lifecycle === "scheduled") },
    { key: "draft", title: "Drafts", items: overview.campaigns.filter((c) => c.lifecycle === "draft") },
    { key: "expired", title: "Expired", items: overview.campaigns.filter((c) => c.lifecycle === "expired") },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <OverviewStat label="Total" value={overview.total} />
        <OverviewStat label="Active" value={overview.active} highlight />
        <OverviewStat label="Upcoming" value={overview.upcoming} />
        <OverviewStat label="Scheduled" value={overview.scheduled} />
        <OverviewStat label="Drafts" value={overview.drafts} />
        <OverviewStat label="Expired" value={overview.expired} />
      </div>

      {sections.map((section) =>
        section.items.length > 0 ? (
          <section key={section.key} aria-labelledby={`${section.key}-heading`}>
            <h3 id={`${section.key}-heading`} className="font-heading text-base font-bold text-green-900">
              {section.title}
            </h3>
            <ul className="mt-3 grid gap-3 lg:grid-cols-2">
              {section.items.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <CampaignMiniCard campaign={c} />
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}
    </div>
  );
}

function OverviewStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${highlight ? "border-green-300 bg-green-50/60" : "border-cream-200 bg-white"}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{label}</p>
      <p className="mt-1 font-heading text-2xl font-extrabold text-green-900">{value}</p>
    </div>
  );
}

function CampaignMiniCard({ campaign }: { campaign: CampaignCenterItem }) {
  const href = campaign.id.startsWith("demo-")
    ? "/admin/marketing/campaigns/new"
    : `/admin/marketing/campaigns/${campaign.id}`;

  return (
    <Link
      href={href}
      className="flex flex-col rounded-2xl border border-cream-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400"
    >
      <div className="flex flex-wrap items-center gap-2">
        <CampaignTypeBadge type={campaign.config.marketingType} />
        <CampaignStatusBadge status={campaign.status} />
      </div>
      <p className="mt-2 font-heading font-bold text-green-900">{campaign.name}</p>
      {campaign.config.headline ? (
        <p className="mt-1 line-clamp-1 text-sm text-green-700">{campaign.config.headline}</p>
      ) : null}
      <p className="mt-2 text-xs text-green-700/50">
        {formatCampaignDate(campaign.config.startDate)} → {formatCampaignDate(campaign.config.endDate)}
      </p>
    </Link>
  );
}
