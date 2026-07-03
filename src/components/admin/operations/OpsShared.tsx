import { cn } from "@/lib/utils";
import type { OpsStatus } from "@/lib/operations/types";

const STATUS_STYLES: Record<OpsStatus, string> = {
  ready: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  ok: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  degraded: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  missing: "bg-terra-50 text-terra-800 dark:bg-terra-900/30 dark:text-terra-200",
  error: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

const STATUS_LABELS: Record<OpsStatus, string> = {
  ready: "Ready",
  ok: "OK",
  warning: "Warning",
  degraded: "Degraded",
  missing: "Missing",
  error: "Error",
};

export function OpsStatusBadge({ status }: { status: OpsStatus }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function OpsCheckList({
  items,
  emptyMessage = "No checks available.",
}: {
  items: { id: string; label: string; status: OpsStatus; detail?: string; hint?: string }[];
  emptyMessage?: string;
}) {
  if (!items.length) {
    return <p className="text-sm text-green-700/60 dark:text-green-200/60">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-cream-200 dark:divide-green-800">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="font-medium text-green-900 dark:text-cream-50">{item.label}</p>
            {item.detail && (
              <p className="mt-0.5 text-sm text-green-700/70 dark:text-green-200/60">{item.detail}</p>
            )}
            {item.hint && <p className="mt-0.5 text-xs text-green-600/60 dark:text-green-300/50">{item.hint}</p>}
          </div>
          <OpsStatusBadge status={item.status} />
        </li>
      ))}
    </ul>
  );
}

export function OpsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-cream-200 bg-white p-6 dark:border-green-800 dark:bg-green-950/40">
      <h2 className="font-heading text-lg font-bold text-green-900 dark:text-cream-50">{title}</h2>
      {description && <p className="mt-1 text-sm text-green-700/70 dark:text-green-200/60">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
