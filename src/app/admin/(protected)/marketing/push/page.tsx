import { listCampaigns, listPushQueue, getMarketingFilterOptions, getCampaignAnalytics } from "@/lib/admin/marketing";
import CampaignsClient from "../campaigns/CampaignsClient";
import QueuePanel from "../QueuePanel";

export default async function PushPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [campaigns, queue, options, analytics] = await Promise.all([
    listCampaigns({ search: sp.search, campaignType: "push", status: "all", page }),
    listPushQueue({ status: sp.queueStatus ?? "all", page: Number(sp.qpage) || 1 }),
    getMarketingFilterOptions(),
    getCampaignAnalytics("push"),
  ]);

  return (
    <div className="space-y-10">
      <CampaignsClient
        rows={campaigns.rows}
        total={campaigns.total}
        page={campaigns.page}
        perPage={campaigns.perPage}
        pageCount={campaigns.pageCount}
        segments={options.segments}
        templates={options.templates}
        filters={{ search: sp.search ?? "", type: "push", status: "all" }}
        basePath="/admin/marketing/push"
        title="Push Notifications"
        fixedType="push"
      />
      <section aria-labelledby="push-analytics-heading">
        <h2 id="push-analytics-heading" className="font-heading text-lg font-bold text-green-900">Push Analytics</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
          <Stat label="Open Rate" value={`${(analytics.openRate * 100).toFixed(1)}%`} />
          <Stat label="Click Rate" value={`${(analytics.clickRate * 100).toFixed(1)}%`} />
          <Stat label="Conversion" value={`${(analytics.conversionRate * 100).toFixed(1)}%`} />
        </div>
      </section>
      <QueuePanel title="Push Queue" channel="push" rows={queue.rows} total={queue.total} page={queue.page} pageCount={queue.pageCount} perPage={queue.perPage} />
      <p className="text-xs text-green-700/70">Firebase Cloud Messaging and OneSignal — configure in Operations when ready.</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-cream-200 bg-white px-4 py-3">
      <p className="text-green-700/60">{label}</p>
      <p className="font-semibold text-green-900">{value}</p>
    </div>
  );
}
