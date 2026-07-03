"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import { formatMoney, type GstReportRow, type GstSummary } from "@/lib/admin/finance-types";
import { exportGstReport } from "@/lib/admin/finance-actions";

export default function GstClient({ summary, reports }: { summary: GstSummary; reports: GstReportRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function exportGst(format: "csv" | "json", reportType: "monthly" | "quarterly" | "yearly") {
    startTransition(async () => {
      const res = await exportGstReport({
        report_type: reportType,
        period_start: summary.periodStart,
        period_end: summary.periodEnd,
        format,
      });
      notifyActionResult(toast, res);
      if (!res.ok) return;
      if (res.content && res.fileName) {
        const mime = format === "json" ? "application/json" : "text/csv";
        const blob = new Blob([res.content], { type: mime });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = res.fileName;
        a.click();
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-green-900">GST Dashboard</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => exportGst("csv", "monthly")}>Export CSV</Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => exportGst("json", "monthly")}>Export JSON</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Sales GST" value={formatMoney(summary.salesGst)} />
        <MetricCard label="Purchase GST" value={formatMoney(summary.purchaseGst)} />
        <MetricCard label="Input Credit" value={formatMoney(summary.inputCredit)} />
        <MetricCard label="Output Tax" value={formatMoney(summary.outputTax)} />
        <MetricCard label="GST Payable" value={formatMoney(summary.gstPayable)} />
        <MetricCard label="GST Collected" value={formatMoney(summary.gstCollected)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={pending} onClick={() => exportGst("csv", "monthly")}>Monthly Report</Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => exportGst("csv", "quarterly")}>Quarterly Report</Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => exportGst("csv", "yearly")}>Yearly Report</Button>
      </div>

      <Card padding="md" radius="3xl" variant="outline">
        <h3 className="font-heading text-sm font-bold text-green-900">GST Summary · {summary.periodStart} to {summary.periodEnd}</h3>
        <p className="mt-2 text-sm text-green-700/70">Output tax minus input credit equals net GST payable for the period.</p>
      </Card>

      <section aria-labelledby="gst-history-heading">
        <h3 id="gst-history-heading" className="font-heading text-sm font-bold text-green-900">Report history</h3>
        {reports.length === 0 ? (
          <p className="mt-2 text-sm text-green-700/60">No saved GST reports yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-200 text-left text-green-700/60">
                  <th className="pb-2 pr-4 font-medium">Period</th>
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 pr-4 font-medium">Taxable</th>
                  <th className="pb-2 pr-4 font-medium">GST</th>
                  <th className="pb-2 font-medium">Payable</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-cream-100">
                    <td className="py-2 pr-4">{r.periodStart} – {r.periodEnd}</td>
                    <td className="py-2 pr-4 capitalize">{r.reportType}</td>
                    <td className="py-2 pr-4">{formatMoney(r.totalTaxable)}</td>
                    <td className="py-2 pr-4">{formatMoney(r.totalGst)}</td>
                    <td className="py-2">{formatMoney(r.gstPayable)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="md" radius="3xl" variant="outline">
      <p className="text-xs text-green-700/60">{label}</p>
      <p className="font-heading text-xl font-bold text-green-900">{value}</p>
    </Card>
  );
}
