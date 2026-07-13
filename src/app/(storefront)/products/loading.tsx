export default function ProductsLoading() {
  return (
    <div>
      <section className="bg-brand-cream px-4 py-16">
        <div className="mx-auto max-w-6xl text-center">
          <div className="skeleton-shimmer mx-auto mb-3 h-4 w-32 rounded-full" />
          <div className="skeleton-shimmer mx-auto mb-4 h-12 w-72 max-w-full rounded-[var(--radius-card)]" />
          <div className="skeleton-shimmer mx-auto h-5 w-96 max-w-full rounded-full" />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="skeleton-shimmer mb-8 h-7 w-40 rounded-full" />
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer aspect-[3/4] rounded-[var(--radius-card)]"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
