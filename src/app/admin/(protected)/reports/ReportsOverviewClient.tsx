"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { ReportExportRow, SavedReportRow, ScheduledReportRow } from "@/lib/admin/report-types";

export default function ReportsOverviewClient({
  saved,
  scheduled,
  exports,
  canManage,
}: {
  saved: SavedReportRow[];
  scheduled: ScheduledReportRow[];
  exports: ReportExportRow[];
  canManage: boolean;
}) {
  if (!canManage && saved.length === 0 && scheduled.length === 0 && exports.length === 0) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card padding="md" radius="3xl" variant="outline">
        <h3 className="font-heading text-sm font-bold text-green-900">Saved Reports</h3>
        {saved.length === 0 ? (
          <p className="mt-2 text-sm text-green-700/60">No saved reports yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {saved.map((r) => (
              <li key={r.id} className="flex justify-between gap-2">
                <span>{r.name}</span>
                <Badge variant="info" size="sm">{r.reportType}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card padding="md" radius="3xl" variant="outline">
        <h3 className="font-heading text-sm font-bold text-green-900">Scheduled Reports</h3>
        {scheduled.length === 0 ? (
          <p className="mt-2 text-sm text-green-700/60">No schedules configured.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {scheduled.map((s) => (
              <li key={s.id} className="flex justify-between gap-2">
                <span>{s.name}</span>
                <Badge variant={s.isEnabled ? "success" : "default"} size="sm">{s.frequency}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card padding="md" radius="3xl" variant="outline">
        <h3 className="font-heading text-sm font-bold text-green-900">Recent Exports</h3>
        {exports.length === 0 ? (
          <p className="mt-2 text-sm text-green-700/60">No exports yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {exports.map((e) => (
              <li key={e.id} className="flex justify-between gap-2">
                <span>{e.reportType}</span>
                <Badge variant="default" size="sm">{e.format}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
