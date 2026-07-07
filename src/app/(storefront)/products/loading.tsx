export default function ProductsLoading() {
  return (
    <main>
      <section className="bg-[#faf5f0] px-4 py-14">
        <div className="mx-auto max-w-6xl text-center">
          <div className="skeleton-shimmer mx-auto mb-3 h-4 w-32 animate-pulse rounded-full bg-gray-200/80" />
          <div className="skeleton-shimmer mx-auto mb-4 h-12 w-72 max-w-full animate-pulse rounded-2xl bg-gray-200/80" />
          <div className="skeleton-shimmer mx-auto h-5 w-96 max-w-full animate-pulse rounded-full bg-gray-200/70" />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="skeleton-shimmer mb-8 h-7 w-40 animate-pulse rounded-full bg-gray-200/80" />
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer aspect-[3/4] animate-pulse rounded-2xl bg-gray-200/70"
            />
          ))}
        </div>
      </section>
    </main>
  );
}
