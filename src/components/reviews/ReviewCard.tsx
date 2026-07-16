import Image from "next/image";
import { Camera, Play } from "lucide-react";

import RatingStars from "@/components/reviews/RatingStars";
import VerifiedPurchaseBadge from "@/components/reviews/VerifiedPurchaseBadge";
import { formatReviewDate } from "@/lib/reviews/helpers";
import type { EnrichedPublicReview } from "@/lib/reviews/types";
import { cn } from "@/lib/utils";

export default function ReviewCard({
  review,
  compact = false,
  className,
}: {
  review: EnrichedPublicReview;
  compact?: boolean;
  className?: string;
}) {
  const hasMedia = review.imageUrls.length > 0 || review.hasVideo;

  return (
    <article
      className={cn(
        "pdp-review-card motion-safe:transition-shadow",
        compact && "p-4",
        className,
      )}
      aria-labelledby={`review-${review.id}-author`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p id={`review-${review.id}-author`} className="font-semibold text-green-900">
              {review.customerName}
            </p>
            {review.verifiedPurchase && !review.isSample ? <VerifiedPurchaseBadge /> : null}
            {review.isSample ? (
              <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                Sample
              </span>
            ) : null}
            {review.isFeatured ? (
              <span className="rounded-full bg-terra-50 px-2 py-0.5 text-xs font-semibold text-terra-700">
                Featured
              </span>
            ) : null}
          </div>
          <time className="mt-0.5 block text-xs text-green-700" dateTime={review.createdAt}>
            {formatReviewDate(review.createdAt)}
          </time>
        </div>
        <RatingStars rating={review.rating} size="sm" detailed />
      </header>

      {review.title ? (
        <h4 className="mt-3 font-heading text-base font-bold text-green-900">{review.title}</h4>
      ) : null}

      {review.body ? (
        <p className={cn("mt-2 text-sm leading-relaxed text-green-800", compact && "line-clamp-4")}>
          {review.body}
        </p>
      ) : null}

      {!compact && (review.pros || review.cons) ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {review.pros ? (
            <div className="rounded-xl bg-green-50/80 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-800">Pros</p>
              <p className="mt-1 text-sm text-green-800">{review.pros}</p>
            </div>
          ) : null}
          {review.cons ? (
            <div className="rounded-xl bg-cream-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-800">Cons</p>
              <p className="mt-1 text-sm text-green-800">{review.cons}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {hasMedia ? (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Review media">
          {review.imageUrls.slice(0, 3).map((url, i) => (
            <div
              key={`${review.id}-img-${i}`}
              className="relative h-16 w-16 overflow-hidden rounded-xl border border-cream-200 bg-cream-50"
            >
              <Image src={url} alt={`Photo from ${review.customerName}'s review`} fill className="object-cover" sizes="64px" />
              <span className="absolute bottom-0.5 right-0.5 rounded bg-black/50 p-0.5 text-white">
                <Camera className="h-3 w-3" aria-hidden="true" />
              </span>
            </div>
          ))}
          {review.hasVideo ? (
            <div
              className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border border-dashed border-terra-300 bg-terra-50/50 text-terra-700"
              title={review.videoPlaceholderLabel ?? "Video review placeholder"}
            >
              <Play className="h-5 w-5" aria-hidden="true" />
              <span className="mt-0.5 text-[10px] font-semibold">Video</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
