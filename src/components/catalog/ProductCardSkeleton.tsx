export default function ProductCardSkeleton() {
  return (
    <div
      className="collection-card-skeleton flex h-full animate-pulse flex-col"
      aria-hidden="true"
    >
      <div className="aspect-[4/5] w-full bg-gray-200/80" />
      <div className="flex flex-1 flex-col gap-3 p-5 lg:p-6">
        <div className="h-3 w-20 rounded-full bg-gray-200/90" />
        <div className="h-6 w-3/4 rounded-lg bg-gray-200/90" />
        <div className="h-4 w-full rounded bg-gray-200/80" />
        <div className="h-4 w-5/6 rounded bg-gray-200/80" />
        <div className="mt-auto space-y-3 border-t border-green-50 pt-4">
          <div className="h-7 w-24 rounded-lg bg-gray-200/90" />
          <div className="h-11 w-full rounded-full bg-gray-200/90" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="collection-product-grid" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CatalogPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="skeleton-shimmer h-5 w-28 animate-pulse rounded-full bg-gray-200/80" />
        <div className="skeleton-shimmer h-[3.25rem] w-44 animate-pulse rounded-full bg-gray-200/80" />
      </div>
      <ProductGridSkeleton count={8} />
    </div>
  );
}
