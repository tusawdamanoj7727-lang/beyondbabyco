import type { Metadata } from "next";
import Link from "next/link";

import StatsCard from "@/components/admin/StatsCard";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getOpsQueueSnapshot } from "@/lib/admin/ops-queues";
import { OpsSection } from "@/components/admin/operations/OpsShared";

export const metadata: Metadata = { title: "Queues & Crons" };

export default async function OperationsQueuesPage() {
  await requirePermission(PERMISSIONS.SETTINGS_MANAGE);
  const data = await getOpsQueueSnapshot();

  return (
    <div className="space-y-6">
      <p className="text-sm text-green-700/80">
        Live operational queues for email, payment webhooks, and shipment AWBs. Cron jobs run via
        Vercel schedule and optional GitHub Actions on Hobby.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Email queued" value={String(data.email.queued)} icon="newsletter" hint="Awaiting send" />
        <StatsCard label="Email failed" value={String(data.email.failed)} icon="audit" hint="Needs retry cron" />
        <StatsCard label="Emails sent today" value={String(data.email.sentToday)} icon="sparkles" />
        <StatsCard
          label="Webhooks unprocessed"
          value={String(data.paymentWebhooks.unprocessed)}
          icon="payments"
          hint={`${data.paymentWebhooks.failed} with errors · ${data.paymentWebhooks.recent} today`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Pending shipments" value={String(data.shipping.pendingShipments)} icon="orders" />
        <StatsCard label="Missing AWB" value={String(data.shipping.missingAwb)} icon="activity" hint="Open shipments without tracking" />
        <StatsCard label="Failed shipments" value={String(data.shipping.failedShipments)} icon="close" />
        <StatsCard label="Delivered" value={String(data.shipping.delivered)} icon="orders" />
      </div>

      <OpsSection title="Cron catalog" description="Protected by CRON_SECRET. Paths relative to production SITE_URL.">
        <ul className="divide-y divide-cream-200 rounded-2xl border border-cream-200 bg-white/90">
          {data.crons.map((cron) => (
            <li key={cron.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-green-900">{cron.label}</p>
                <p className="text-sm text-green-700">{cron.purpose}</p>
                <p className="mt-1 font-mono text-xs text-green-600">{cron.path}</p>
              </div>
              <p className="shrink-0 text-xs font-medium text-green-600">{cron.cadence}</p>
            </li>
          ))}
        </ul>
      </OpsSection>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/shipping" className="text-sm font-semibold text-terra-600 hover:underline">
          Open shipping ops →
        </Link>
        <Link href="/admin/operations" className="text-sm font-semibold text-terra-600 hover:underline">
          Health probes →
        </Link>
        <Link href="/admin/audit-logs" className="text-sm font-semibold text-terra-600 hover:underline">
          Audit logs →
        </Link>
      </div>
    </div>
  );
}
