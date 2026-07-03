import { cn } from "@/lib/utils";

export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size }}
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-green-300 border-t-green-600",
        className,
      )}
    />
  );
}

export default function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 py-12 text-center", className)}
      aria-live="polite"
    >
      <Spinner size={28} />
      <p className="text-sm font-medium text-green-700/70">{label}</p>
    </div>
  );
}

/** Skeleton rows for table loading placeholders. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border border-cream-200 p-3">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-cream-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-cream-200" />
            <div className="h-3 w-1/5 animate-pulse rounded bg-cream-100" />
          </div>
          <div className="h-6 w-16 animate-pulse rounded-full bg-cream-200" />
        </div>
      ))}
    </div>
  );
}
