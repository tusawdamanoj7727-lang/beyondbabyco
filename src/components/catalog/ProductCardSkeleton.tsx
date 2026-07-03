export default function ProductCardSkeleton() {
  return (
    <div className="collection-card-skeleton flex h-full flex-col">
      <div className="skeleton-shimmer aspect-[4/5] w-full bg-cream-100" />
      <div className="flex flex-1 flex-col gap-3 p-5 lg:p-6">
        <div className="skeleton-shimmer h-3 w-20 rounded-full" />
        <div className="skeleton-shimmer h-6 w-3/4 rounded-lg" />
        <div className="skeleton-shimmer h-4 w-full rounded" />
        <div className="skeleton-shimmer h-4 w-5/6 rounded" />
        <div className="mt-auto flex items-center justify-between border-t border-green-50 pt-4">
          <div className="skeleton-shimmer h-7 w-24 rounded-lg" />
          <div className="skeleton-shimmer h-11 w-11 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="collection-product-grid">
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
        <div className="skeleton-shimmer h-5 w-28 rounded-full" />
        <div className="skeleton-shimmer h-[3.25rem] w-44 rounded-full" />
      </div>
      <ProductGridSkeleton count={6} />
    </div>
  );
}
