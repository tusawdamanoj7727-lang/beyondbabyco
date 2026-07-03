"use client";

import { useState, useTransition } from "react";

import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { notifyActionResult } from "@/lib/admin/notify-action";
import type { ExportFormat } from "@/lib/admin/report-types";
import { exportReport } from "@/lib/admin/report-actions";

export default function ExportMenu({
  reportType,
  rows,
  columns,
  filters,
}: {
  reportType: string;
  rows: Record<string, string | number | null>[];
  columns: { key: string; header: string }[];
  filters?: Record<string, string | undefined>;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function run(format: ExportFormat) {
    startTransition(async () => {
      const res = await exportReport({ report_type: reportType, format, rows, columns, filters });
      notifyActionResult(toast, res);
      if (!res.ok) return;
      if (format === "print") {
        const w = window.open("", "_blank");
        if (w && res.content) {
          w.document.write(res.content);
          w.document.close();
          w.print();
        }
        return;
      }
      if (res.content && res.fileName) {
        const mime = format === "csv" ? "text/csv" : format === "excel" ? "application/vnd.ms-excel" : "text/html";
        const blob = new Blob([res.content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
      setOpen(false);
    });
  }

  return (
    <div className="relative">
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
        Export
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 min-w-[140px] rounded-2xl border border-cream-200 bg-white py-1 shadow-clay" role="menu">
          {(["csv", "excel", "pdf", "print"] as ExportFormat[]).map((f) => (
            <button
              key={f}
              type="button"
              role="menuitem"
              disabled={pending}
              onClick={() => run(f)}
              className="block w-full px-4 py-2 text-left text-sm text-green-900 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
