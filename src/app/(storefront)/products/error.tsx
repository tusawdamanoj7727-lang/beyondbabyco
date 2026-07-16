"use client";

import Button from "@/components/ui/Button";
import { ctaHeight } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

export default function ProductsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container py-16">
      <div className="mx-auto flex max-w-md flex-col items-center rounded-[var(--radius-card)] border border-cream-200 bg-white px-8 py-12 text-center shadow-[var(--shadow-soft)]">
        <p className="text-sm font-semibold uppercase tracking-wider text-terra-600">Products unavailable</p>
        <h2 className="mt-3 font-heading text-2xl font-bold text-green-900">
          Couldn&apos;t load products. Please refresh.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-green-700">
          Something went wrong while fetching the catalog. Try again in a moment.
        </p>
        <Button
          type="button"
          variant="primary"
          className={cn(ctaHeight, "mt-8 font-semibold")}
          onClick={() => reset()}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
