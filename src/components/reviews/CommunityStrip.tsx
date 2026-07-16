import Link from "next/link";

import CommunityHighlight from "@/components/reviews/CommunityHighlight";
import ReviewCard from "@/components/reviews/ReviewCard";
import RatingStars from "@/components/reviews/RatingStars";
import { computeReviewSummary } from "@/lib/reviews/helpers";
import type { EnrichedPublicReview } from "@/lib/reviews/types";
import { cn } from "@/lib/utils";

export default function CommunityStrip({
  featuredReview,
  allReviews,
  className,
}: {
  featuredReview: EnrichedPublicReview | null;
  allReviews: EnrichedPublicReview[];
  className?: string;
}) {
  if (!featuredReview && allReviews.length === 0) return null;

  const summary = computeReviewSummary(allReviews.length ? allReviews : featuredReview ? [featuredReview] : []);

  const liveHighlights =
    summary.reviewCount > 0
      ? [
          {
            id: "live-reviews",
            title: `${summary.reviewCount} parent review${summary.reviewCount === 1 ? "" : "s"}`,
            description: "Verified ratings from parents who shop with BeyondBabyCo.",
            stat: String(summary.reviewCount),
            href: "/reviews/gallery",
            icon: "⭐",
          },
          {
            id: "live-rating",
            title: `${summary.averageRating.toFixed(1)} average rating`,
            description: "Based on published customer reviews.",
            stat: `${summary.averageRating.toFixed(1)}★`,
            href: "/community",
            icon: "💚",
          },
        ]
      : [];

  return (
    <section
      aria-labelledby="community-strip-heading"
      className={cn("border-y border-cream-200 bg-gradient-to-b from-cream-50/80 to-white py-12 md:py-16", className)}
    >
      <div className="container">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <p className="text-caption font-semibold uppercase tracking-wider text-terra-600">Trusted by parents</p>
            <h2 id="community-strip-heading" className="mt-2 font-heading text-2xl font-extrabold text-green-900 md:text-3xl">
              Real reviews. Real routines.
            </h2>
            {summary.reviewCount > 0 ? (
              <div className="mt-4">
                <RatingStars
                  rating={summary.averageRating}
                  count={summary.reviewCount}
                  size="md"
                  showValue
                  detailed
                />
              </div>
            ) : null}
            <p className="mt-3 text-sm leading-relaxed text-green-700">
              Every rating reflects verified experiences from parents who choose gentle, research-backed care.
              Explore our community gallery and parent stories.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/community"
                className="inline-flex min-h-[44px] items-center rounded-full bg-green-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400"
              >
                Parents Love BeyondBabyCo
              </Link>
              <Link
                href="/reviews/gallery"
                className="inline-flex min-h-[44px] items-center rounded-full border border-cream-300 bg-white px-5 py-2.5 text-sm font-semibold text-green-900 hover:bg-cream-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400"
              >
                Review gallery
              </Link>
            </div>
          </div>

          {liveHighlights.length > 0 ? (
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
              {liveHighlights.map((item) => (
                <CommunityHighlight key={item.id} item={item} className="p-4" />
              ))}
            </div>
          ) : null}
        </div>

        {featuredReview ? (
          <div className="mt-10">
            <h3 className="font-heading text-lg font-bold text-green-900">Featured review</h3>
            <div className="mt-4 max-w-3xl">
              <ReviewCard review={featuredReview} compact />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
