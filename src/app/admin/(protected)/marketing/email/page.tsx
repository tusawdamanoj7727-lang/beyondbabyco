import { listCampaigns, listEmailQueue, listTemplates, getMarketingFilterOptions, getCampaignAnalytics } from "@/lib/admin/marketing";
import CampaignsClient from "../campaigns/CampaignsClient";
import QueuePanel from "../QueuePanel";

export default async function EmailPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [campaigns, queue, templates, options, analytics] = await Promise.all([
    listCampaigns({ search: sp.search, campaignType: "email", status: "all", page }),
    listEmailQueue({ status: sp.queueStatus ?? "all", page: Number(sp.qpage) || 1 }),
    listTemplates({ channel: "email", status: "active" }),
    getMarketingFilterOptions(),
    getCampaignAnalytics("email"),
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
        filters={{ search: sp.search ?? "", type: "email", status: "all" }}
        basePath="/admin/marketing/email"
        title="Email Campaigns"
        fixedType="email"
      />
      <section aria-labelledby="email-templates-heading">
        <h2 id="email-templates-heading" className="font-heading text-lg font-bold text-green-900">Email Templates</h2>
        <p className="mt-1 text-sm text-green-700/60">{templates.total} active template{templates.total !== 1 ? "s" : ""}. Manage in Segments page or create via campaign form.</p>
        <ul className="mt-3 space-y-2">
          {templates.rows.slice(0, 5).map((t) => (
            <li key={t.id} className="rounded-2xl border border-cream-200 px-4 py-2 text-sm text-green-800">{t.name} — {t.subject ?? "No subject"}</li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="email-analytics-heading">
        <h2 id="email-analytics-heading" className="font-heading text-lg font-bold text-green-900">Email Analytics</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
          <Stat label="Open Rate" value={`${(analytics.openRate * 100).toFixed(1)}%`} />
          <Stat label="Click Rate" value={`${(analytics.clickRate * 100).toFixed(1)}%`} />
          <Stat label="Bounce Rate" value={`${(analytics.bounceRate * 100).toFixed(1)}%`} />
        </div>
      </section>
      <QueuePanel title="Email Queue" channel="email" rows={queue.rows} total={queue.total} page={queue.page} pageCount={queue.pageCount} perPage={queue.perPage} />
      <p className="text-xs text-green-700/70">Connect Brevo, Mailchimp, or SendGrid from Operations → Integrations when ready.</p>
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
