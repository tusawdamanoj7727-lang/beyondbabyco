import type { ProductReviewSummary } from "@/lib/admin/review-types";
import { aggregateProsCons } from "@/lib/reviews/helpers";
import type { EnrichedPublicReview } from "@/lib/reviews/types";
import { cn } from "@/lib/utils";

import RatingStars from "./RatingStars";

export default function ReviewSummary({
  summary,
  reviews,
  className,
}: {
  summary: ProductReviewSummary;
  reviews: EnrichedPublicReview[];
  className?: string;
}) {
  const { pros, cons } = aggregateProsCons(reviews);
  const maxCount = Math.max(...Object.values(summary.ratingDistribution), 1);

  return (
    <section aria-labelledby="review-summary-heading" className={cn("space-y-6", className)}>
      <h3 id="review-summary-heading" className="sr-only">
        Review summary
      </h3>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,220px)_1fr]">
        <div className="rounded-2xl bg-cream-50/80 p-5 text-center lg:text-left">
          <p className="font-heading text-4xl font-extrabold text-green-900">
            {summary.reviewCount > 0 ? summary.averageRating.toFixed(1) : "—"}
          </p>
          <RatingStars
            rating={summary.averageRating}
            count={summary.reviewCount}
            size="md"
            detailed
            className="mt-2 justify-center lg:justify-start"
          />
          <p className="mt-2 text-sm text-green-700/70">
            Based on {summary.reviewCount.toLocaleString("en-IN")} review{summary.reviewCount === 1 ? "" : "s"}
          </p>
        </div>

        <div role="group" aria-label="Rating distribution">
          <ol className="space-y-2" reversed>
            {([5, 4, 3, 2, 1] as const).map((stars) => {
              const count = summary.ratingDistribution[stars];
              const pct = summary.reviewCount ? Math.round((count / summary.reviewCount) * 100) : 0;
              return (
                <li key={stars} className="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-2 text-sm">
                  <span className="font-medium text-green-800">{stars}★</span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-cream-200">
                    <div
                      className="h-full rounded-full bg-terra-400 motion-safe:transition-[width] motion-safe:duration-500"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${stars} star reviews: ${pct}%`}
                    />
                  </div>
                  <span className="text-right text-green-700/70">{count}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {(pros.length > 0 || cons.length > 0) && summary.reviewCount > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {pros.length > 0 ? (
            <div className="rounded-2xl border border-green-100 bg-green-50/50 p-4">
              <h4 className="font-heading text-sm font-bold text-green-900">What parents love</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-green-700/90">
                {pros.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span aria-hidden="true" className="text-green-600">
                      +
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {cons.length > 0 ? (
            <div className="rounded-2xl border border-cream-200 bg-cream-50/50 p-4">
              <h4 className="font-heading text-sm font-bold text-green-900">Room to improve</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-green-700/90">
                {cons.map((c) => (
                  <li key={c} className="flex gap-2">
                    <span aria-hidden="true" className="text-terra-500">
                      −
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
