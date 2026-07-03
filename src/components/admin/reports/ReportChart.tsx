"use client";

import { cn } from "@/lib/utils";
import type { ChartPoint } from "@/lib/admin/report-types";

export default function ReportChart({
  data,
  type = "bar",
  className,
  ariaLabel,
}: {
  data: ChartPoint[];
  type?: "bar" | "line" | "donut";
  className?: string;
  ariaLabel?: string;
}) {
  if (!data.length) {
    return <p className="text-sm text-green-700/60">No chart data for selected filters.</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  if (type === "donut") {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let offset = 0;
    const colors = ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2", "#b7e4c7"];
    const segments = data.map((d, i) => {
      const pct = (d.value / total) * 100;
      const seg = `${colors[i % colors.length]} ${offset}% ${offset + pct}%`;
      offset += pct;
      return seg;
    });
    return (
      <div className={cn("flex flex-col items-center gap-4 sm:flex-row", className)} role="img" aria-label={ariaLabel ?? "Donut chart"}>
        <div
          className="h-36 w-36 shrink-0 rounded-full"
          style={{ background: `conic-gradient(${segments.join(", ")})` }}
        />
        <ul className="space-y-1 text-xs">
          {data.map((d, i) => (
            <li key={d.label} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: colors[i % colors.length] }} aria-hidden />
              <span>{d.label}: {d.value.toLocaleString("en-IN")}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (type === "line") {
    const w = 320;
    const h = 120;
    const points = data.map((d, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * w;
      const y = h - (d.value / max) * h;
      return `${x},${y}`;
    }).join(" ");
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-32 w-full max-w-lg", className)} role="img" aria-label={ariaLabel ?? "Line chart"}>
        <polyline fill="none" stroke="#2d6a4f" strokeWidth="2.5" points={points} />
        {data.map((d, i) => {
          const x = (i / Math.max(data.length - 1, 1)) * w;
          const y = h - (d.value / max) * h;
          return <circle key={d.label} cx={x} cy={y} r="3" fill="#40916c" />;
        })}
      </svg>
    );
  }

  return (
    <div className={cn("space-y-2", className)} role="img" aria-label={ariaLabel ?? "Bar chart"}>
      {data.map((d) => (
        <div key={d.label} className="grid grid-cols-[minmax(80px,120px)_1fr_auto] items-center gap-2 text-xs">
          <span className="truncate text-green-700/70">{d.label}</span>
          <div className="h-3 overflow-hidden rounded-full bg-cream-200">
            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="font-medium tabular-nums text-green-900">{d.value.toLocaleString("en-IN")}</span>
        </div>
      ))}
    </div>
  );
}
