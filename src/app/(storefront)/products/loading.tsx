import { ProductGridSkeleton } from "@/components/catalog/ProductCardSkeleton";

export default function ProductsLoading() {
  return (
    <div className="container pb-24 lg:pb-20">
      <div className="py-8 lg:py-10">
        <div className="skeleton-shimmer mb-6 h-12 w-full max-w-xl animate-pulse rounded-full bg-gray-200/80" />
      </div>
      <div className="flex gap-12 xl:gap-16">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="skeleton-shimmer h-[28rem] animate-pulse rounded-[var(--radius-card)] bg-gray-200/70" />
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="skeleton-shimmer h-5 w-28 animate-pulse rounded-full bg-gray-200/80" />
            <div className="skeleton-shimmer h-[3.25rem] w-44 animate-pulse rounded-full bg-gray-200/80" />
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}
