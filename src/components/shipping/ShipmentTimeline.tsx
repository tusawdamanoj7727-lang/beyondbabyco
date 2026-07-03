"use client";

import { cn } from "@/lib/utils";

export interface TimelineEvent {
  id: string;
  status: string;
  message: string | null;
  location: string | null;
  eventTime: string;
}

export default function ShipmentTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-green-700/60">No tracking updates yet.</p>;
  }

  return (
    <ol className="relative space-y-0" aria-label="Shipment tracking timeline">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        return (
          <li key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                className="absolute left-[11px] top-6 h-full w-0.5 bg-green-200"
                aria-hidden
              />
            )}
            <span
              className={cn(
                "relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full border-2",
                index === 0 ? "border-green-500 bg-green-500" : "border-green-300 bg-white",
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-green-900">{event.status}</p>
              {event.message && <p className="text-sm text-green-800/80">{event.message}</p>}
              <p className="mt-1 text-xs text-green-700/60">
                {[event.location, new Date(event.eventTime).toLocaleString("en-IN")].filter(Boolean).join(" · ")}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
