export default function AnalyticsSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading analytics">
      <div className="h-24 rounded-3xl bg-cream-100 dark:bg-green-900" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-cream-100 dark:bg-green-900" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-3xl bg-cream-100 dark:bg-green-900" />
        <div className="h-64 rounded-3xl bg-cream-100 dark:bg-green-900" />
      </div>
    </div>
  );
}
