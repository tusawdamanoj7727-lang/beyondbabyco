"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import DataTable, { type Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import { CampaignStatusBadge } from "@/components/admin/marketing/MarketingStatusBadge";
import Button from "@/components/ui/Button";
import CampaignAnalyticsPreviewCards from "@/components/campaigns/CampaignAnalyticsPreview";
import CampaignOverviewDashboard from "@/components/campaigns/CampaignOverviewDashboard";
import CampaignTypeBadge from "@/components/campaigns/CampaignTypeBadge";
import { formatCampaignDate } from "@/lib/campaigns/helpers";
import type { CampaignCenterItem, CampaignCenterOverview } from "@/lib/campaigns/types";
import { cn } from "@/lib/utils";

type View = "overview" | "all";

export default function CampaignCenterClient({
  overview,
  view,
}: {
  overview: CampaignCenterOverview;
  view: View;
}) {
  const router = useRouter();

  const columns: Column<CampaignCenterItem>[] = [
    {
      key: "name",
      header: "Campaign",
      render: (r) => (
        <div>
          <p className="font-semibold text-green-900">{r.name}</p>
          {r.config.headline ? <p className="text-xs text-green-700/60">{r.config.headline}</p> : null}
        </div>
      ),
    },
    { key: "type", header: "Type", render: (r) => <CampaignTypeBadge type={r.config.marketingType} /> },
    { key: "status", header: "Status", render: (r) => <CampaignStatusBadge status={r.status} /> },
    { key: "lifecycle", header: "Lifecycle", render: (r) => <LifecyclePill lifecycle={r.lifecycle} /> },
    {
      key: "dates",
      header: "Dates",
      render: (r) => (
        <span className="text-xs text-green-700/70">
          {formatCampaignDate(r.config.startDate)} → {formatCampaignDate(r.config.endDate)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Link
          href={r.id.startsWith("demo-") ? "/admin/marketing/campaigns/new" : `/admin/marketing/campaigns/${r.id}`}
          className="text-sm font-medium text-terra-600 hover:underline"
        >
          Edit
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full border border-cream-200 p-0.5" role="tablist" aria-label="Campaign views">
          {(
            [
              ["overview", "Overview"],
              ["all", "All campaigns"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              onClick={() => router.push(`/admin/marketing/campaigns?view=${id}`)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400",
                view === id ? "bg-green-900 text-white" : "text-green-800 hover:bg-cream-50",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/marketing/campaigns/calendar">Calendar</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/marketing/campaigns/creative">AI Creative</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/marketing/campaigns/new">New campaign</Link>
          </Button>
        </div>
      </div>

      {view === "overview" ? (
        <>
          <CampaignOverviewDashboard overview={overview} />
          <section aria-labelledby="performance-heading">
            <h3 id="performance-heading" className="font-heading text-lg font-bold text-green-900">
              Performance summary
            </h3>
            <div className="mt-4">
              <CampaignAnalyticsPreviewCards analytics={overview.performance} />
            </div>
          </section>
        </>
      ) : (
        <>
          <DataTable columns={columns} rows={overview.campaigns} getRowId={(r) => r.id} empty="No campaigns yet." />
          <Pagination page={1} pageCount={1} total={overview.total} perPage={overview.total} onPageChange={() => {}} />
        </>
      )}
    </div>
  );
}

function LifecyclePill({ lifecycle }: { lifecycle: CampaignCenterItem["lifecycle"] }) {
  const colors: Record<CampaignCenterItem["lifecycle"], string> = {
    draft: "bg-cream-100 text-green-800",
    upcoming: "bg-blue-50 text-blue-800",
    scheduled: "bg-amber-50 text-amber-800",
    active: "bg-green-100 text-green-800",
    expired: "bg-green-700/10 text-green-700/60",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold capitalize", colors[lifecycle])}>
      {lifecycle}
    </span>
  );
}
