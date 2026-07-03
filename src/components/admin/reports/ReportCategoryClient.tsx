"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import FormField, { Input, Select } from "@/components/admin/FormField";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { ReportFilters, ReportSection, ScheduledReportRow, SavedReportRow } from "@/lib/admin/report-types";
import { REPORT_FREQUENCIES } from "@/lib/admin/report-types";
import { createScheduledReport, saveReport, toggleScheduledReport } from "@/lib/admin/report-actions";
import ReportFiltersBar from "./ReportFilters";
import ReportSectionCard from "./ReportSection";
import ExportMenu from "./ExportMenu";
import type { FilterOptions } from "@/lib/admin/report-types";

export default function ReportCategoryClient({
  title,
  reportType,
  sections,
  filters,
  options,
  basePath,
  savedReports,
  scheduledReports,
  canManage,
}: {
  title: string;
  reportType: string;
  sections: ReportSection[];
  filters: ReportFilters;
  options: FilterOptions;
  basePath: string;
  savedReports: SavedReportRow[];
  scheduledReports: ScheduledReportRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [saveName, setSaveName] = useState("");
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleEmail, setScheduleEmail] = useState("");
  const [scheduleFreq, setScheduleFreq] = useState<string>("weekly");

  const exportRows = sections.flatMap((s) => s.rows ?? []);
  const exportCols = sections.find((s) => s.columns)?.columns ?? [{ key: "metric", header: "Metric" }, { key: "value", header: "Value" }];
  const flatExportRows = exportRows.length
    ? exportRows
    : sections.flatMap((s) => (s.metrics ?? []).map((m) => ({ metric: m.label, value: m.value })));

  function run(action: () => Promise<{ ok: boolean; error: string | null }>) {
    startTransition(async () => {
      const res = await action();
      notifyActionResult(toast, res);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-green-900">{title}</h2>
        <ExportMenu reportType={reportType} rows={flatExportRows} columns={exportCols} filters={filters as Record<string, string | undefined>} />
      </div>

      <ReportFiltersBar filters={filters} options={options} basePath={basePath} />

      <div className="grid gap-6">
        {sections.map((section, i) => (
          <ReportSectionCard key={section.id} section={section} index={i} />
        ))}
      </div>

      {canManage && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card padding="md" radius="3xl" variant="outline">
            <h3 className="font-heading text-sm font-bold text-green-900">Save report</h3>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => saveReport({ name: saveName, report_type: reportType, filters }));
              }}
            >
              <FormField label="Name" className="flex-1">
                <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} required aria-label="Report name" placeholder="My sales report" />
              </FormField>
              <Button type="submit" size="sm" disabled={pending} className="self-end">Save</Button>
            </form>
            {savedReports.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {savedReports.filter((r) => r.reportType === reportType).map((r) => (
                  <li key={r.id} className="text-green-700/70">{r.name}</li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md" radius="3xl" variant="outline">
            <h3 className="font-heading text-sm font-bold text-green-900">Schedule report</h3>
            <form
              className="mt-3 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => createScheduledReport({ name: scheduleName, report_type: reportType, frequency: scheduleFreq, email: scheduleEmail, format: "csv", filters }));
              }}
            >
              <FormField label="Name"><Input value={scheduleName} onChange={(e) => setScheduleName(e.target.value)} required aria-label="Schedule name" /></FormField>
              <FormField label="Email"><Input type="email" value={scheduleEmail} onChange={(e) => setScheduleEmail(e.target.value)} required aria-label="Email destination" /></FormField>
              <FormField label="Frequency">
                <Select value={scheduleFreq} onChange={(e) => setScheduleFreq(e.target.value)} aria-label="Frequency">
                  {REPORT_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </FormField>
              <Button type="submit" size="sm" disabled={pending}>Schedule</Button>
            </form>
            {scheduledReports.length > 0 && (
              <ul className="mt-3 space-y-2 text-sm">
                {scheduledReports.filter((s) => s.reportType === reportType).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2">
                    <span>{s.name} · {s.frequency}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.isEnabled ? "success" : "default"} size="sm">{s.isEnabled ? "On" : "Off"}</Badge>
                      <button type="button" disabled={pending} onClick={() => run(() => toggleScheduledReport(s.id, !s.isEnabled))} className="text-xs text-green-700 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50 rounded px-1">
                        {s.isEnabled ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
