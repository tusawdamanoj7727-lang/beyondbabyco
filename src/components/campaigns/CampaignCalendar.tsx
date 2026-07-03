"use client";

import { useMemo, useState } from "react";

import { formatCampaignDate } from "@/lib/campaigns/helpers";
import {
  MARKETING_CAMPAIGN_TYPE_LABELS,
  type CalendarEvent,
  type MarketingCampaignType,
} from "@/lib/campaigns/types";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week";

export default function CampaignCalendar({
  events,
  className,
}: {
  events: CalendarEvent[];
  className?: string;
}) {
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(() => new Date());

  const monthLabel = cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const monthEvents = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    return events.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }, [events, cursor]);

  const weekEvents = useMemo(() => {
    const start = new Date(cursor);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return events.filter((e) => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });
  }, [events, cursor]);

  const displayed = view === "month" ? monthEvents : weekEvents;

  function shift(dir: -1 | 1) {
    const d = new Date(cursor);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + dir * 7);
    setCursor(d);
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-bold text-green-900">{monthLabel}</h3>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full border border-cream-200 p-0.5" role="tablist" aria-label="Calendar view">
            {(["month", "week"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-semibold capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400",
                  view === v ? "bg-green-900 text-white" : "text-green-800 hover:bg-cream-50",
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => shift(-1)} className="icon-btn" aria-label="Previous">
            ←
          </button>
          <button type="button" onClick={() => shift(1)} className="icon-btn" aria-label="Next">
            →
          </button>
        </div>
      </div>

      <ul className="space-y-2" aria-label="Calendar events">
        {displayed.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-cream-300 px-4 py-8 text-center text-sm text-green-700/60">
            No events in this {view}.
          </li>
        ) : (
          displayed.map((e) => <CalendarEventRow key={e.id} event={e} />)
        )}
      </ul>
    </div>
  );
}

function CalendarEventRow({ event }: { event: CalendarEvent }) {
  const typeLabel =
    event.type in MARKETING_CAMPAIGN_TYPE_LABELS
      ? MARKETING_CAMPAIGN_TYPE_LABELS[event.type as MarketingCampaignType]
      : event.type;

  const categoryColors: Record<CalendarEvent["category"], string> = {
    campaign: "border-l-green-500",
    launch: "border-l-terra-500",
    festival: "border-l-amber-500",
    newsletter: "border-l-blue-400",
    reminder: "border-l-cream-400",
  };

  return (
    <li
      className={cn(
        "rounded-xl border border-cream-200 border-l-4 bg-white px-4 py-3",
        categoryColors[event.category],
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-green-900">{event.title}</p>
        <span className="text-xs font-medium text-green-700/60">{formatCampaignDate(event.date)}</span>
      </div>
      <p className="mt-1 text-xs text-green-700/60">
        {typeLabel} · {event.category}
      </p>
    </li>
  );
}
