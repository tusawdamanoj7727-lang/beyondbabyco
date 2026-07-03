"use client";

import DataTable, { type Column } from "@/components/admin/DataTable";
import { QueueStatusBadge } from "@/components/admin/marketing/MarketingStatusBadge";
import { formatDateTime, type QueueItem } from "@/lib/admin/marketing-types";

export default function QueuePanel(props: {
  title: string;
  channel: string;
  rows: QueueItem[];
  total: number;
  page: number;
  pageCount: number;
  perPage: number;
}) {
  const columns: Column<QueueItem>[] = [
    { key: "campaign", header: "Campaign", render: (r) => r.campaignName ?? "—" },
    { key: "status", header: "Status", render: (r) => <QueueStatusBadge status={r.status} /> },
    { key: "scheduled", header: "Scheduled", render: (r) => formatDateTime(r.scheduledAt) },
    { key: "sent", header: "Sent", render: (r) => formatDateTime(r.sentAt) },
    { key: "error", header: "Error", render: (r) => r.error ?? "—" },
  ];

  return (
    <section aria-labelledby={`${props.channel}-queue-heading`}>
      <h2 id={`${props.channel}-queue-heading`} className="font-heading text-lg font-bold text-green-900">{props.title}</h2>
      <p className="mt-1 text-sm text-green-700/60">{props.total} item{props.total !== 1 ? "s" : ""} in queue</p>
      <div className="mt-4">
        <DataTable columns={columns} rows={props.rows} getRowId={(r) => r.id} empty="Queue is empty." />
      </div>
    </section>
  );
}
