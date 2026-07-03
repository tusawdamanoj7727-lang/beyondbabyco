"use client";

import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import type { ReportSection as ReportSectionType } from "@/lib/admin/report-types";
import ReportChart from "./ReportChart";

export default function ReportSectionCard({ section, index = 0 }: { section: ReportSectionType; index?: number }) {
  return (
    <Reveal delay={index * 0.05}>
      <Card padding="md" radius="3xl" variant="outline" aria-labelledby={`section-${section.id}`}>
        <h2 id={`section-${section.id}`} className="font-heading text-sm font-bold text-green-900">{section.title}</h2>
        {section.description && <p className="mt-1 text-sm text-green-700/60">{section.description}</p>}

        {section.metrics && section.metrics.length > 0 && (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {section.metrics.map((m) => (
              <div key={m.label} className="rounded-2xl bg-cream-50 p-3">
                <dt className="text-xs text-green-700/60">{m.label}</dt>
                <dd className="font-heading text-lg font-bold text-green-900">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {section.chart && section.chart.length > 0 && (
          <div className="mt-4">
            <ReportChart data={section.chart} type={section.chartType ?? "bar"} ariaLabel={`${section.title} chart`} />
          </div>
        )}

        {section.rows && section.columns && section.rows.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-200 text-left text-green-700/60">
                  {section.columns.map((c) => (
                    <th key={c.key} className="pb-2 pr-4 font-medium">{c.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, i) => (
                  <tr key={i} className="border-b border-cream-100">
                    {section.columns!.map((c) => (
                      <td key={c.key} className="py-2 pr-4">{row[c.key] ?? "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Reveal>
  );
}
