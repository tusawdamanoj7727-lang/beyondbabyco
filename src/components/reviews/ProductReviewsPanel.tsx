"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import EmptyState from "@/components/reviews/EmptyState";
import ReviewCard from "@/components/reviews/ReviewCard";
import ReviewGallery from "@/components/reviews/ReviewGallery";
import ReviewSummary from "@/components/reviews/ReviewSummary";
import type { ProductReviewSummary } from "@/lib/admin/review-types";
import {
  computeReviewSummary,
  filterReviews,
  paginateReviews,
  sortReviews,
} from "@/lib/reviews/helpers";
import type { EnrichedPublicReview, GalleryMediaItem, ReviewSortOption } from "@/lib/reviews/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 4;
const SORT_OPTIONS: { value: ReviewSortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
  { value: "helpful", label: "Most helpful" },
];

export default function ProductReviewsPanel({
  reviews,
  summary: initialSummary,
  productName,
  productSlug,
  className,
}: {
  reviews: EnrichedPublicReview[];
  summary?: ProductReviewSummary;
  productName: string;
  productSlug: string;
  className?: string;
}) {
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [withPhotos, setWithPhotos] = useState(false);
  const [sort, setSort] = useState<ReviewSortOption>("newest");
  const [page, setPage] = useState(1);

  const summary = initialSummary ?? computeReviewSummary(reviews);

  const filtered = useMemo(() => {
    const f = filterReviews(reviews, { search, rating: ratingFilter, verifiedOnly, withPhotos });
    return sortReviews(f, sort);
  }, [reviews, search, ratingFilter, verifiedOnly, withPhotos, sort]);

  const paginated = useMemo(() => paginateReviews(filtered, page, PAGE_SIZE), [filtered, page]);

  const galleryItems = useMemo((): GalleryMediaItem[] => {
    const items: GalleryMediaItem[] = [];
    for (const r of reviews) {
      for (const url of r.imageUrls) {
        items.push({
          id: `${r.id}-${url}`,
          type: "photo",
          url,
          caption: r.title ?? undefined,
          productName,
          productSlug,
          reviewId: r.id,
          customerName: r.customerName,
        });
      }
      if (r.hasVideo) {
        items.push({
          id: `${r.id}-video`,
          type: "video",
          url: "/videos/demo-review-placeholder.mp4",
          thumbnailUrl: r.imageUrls[0] ?? "/images/generated/homepage/phase-8-2/lifestyle/lifestyle-01.png",
          caption: r.videoPlaceholderLabel ?? "Video review",
          productName,
          productSlug,
          reviewId: r.id,
          customerName: r.customerName,
        });
      }
    }
    return items;
  }, [reviews, productName, productSlug]);

  if (!reviews.length) {
    return (
      <EmptyState
        title="Reviews coming soon"
        description="Product reviews will appear after verified customer purchases."
        mascot="poppy-panda"
      />
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      <ReviewSummary summary={summary} reviews={reviews} />

      {galleryItems.length > 0 ? (
        <section aria-labelledby="review-photos-heading">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h3 id="review-photos-heading" className="font-heading text-lg font-bold text-green-900">
              Customer photos & videos
            </h3>
            <Link href={`/reviews/gallery?product=${productSlug}`} className="text-sm font-semibold text-terra-600 hover:underline">
              View full gallery →
            </Link>
          </div>
          <ReviewGallery items={galleryItems.slice(0, 6)} layout="carousel" />
        </section>
      ) : null}

      <section aria-labelledby="review-list-heading">
        <h3 id="review-list-heading" className="font-heading text-lg font-bold text-green-900">
          All reviews
        </h3>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <label className="flex-1 min-w-[200px]">
            <span className="sr-only">Search reviews</span>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search reviews…"
              className="w-full rounded-2xl border border-cream-200 bg-white px-4 py-2.5 text-sm text-green-900 placeholder:text-green-700/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400"
            />
          </label>
          <label>
            <span className="sr-only">Filter by rating</span>
            <select
              value={ratingFilter === "all" ? "all" : String(ratingFilter)}
              onChange={(e) => {
                setRatingFilter(e.target.value === "all" ? "all" : Number(e.target.value));
                setPage(1);
              }}
              className="rounded-2xl border border-cream-200 bg-white px-3 py-2.5 text-sm text-green-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400"
            >
              <option value="all">All ratings</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Sort reviews</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as ReviewSortOption);
                setPage(1);
              }}
              className="rounded-2xl border border-cream-200 bg-white px-3 py-2.5 text-sm text-green-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2 text-green-800">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => {
                setVerifiedOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded border-cream-300 text-terra-500 focus:ring-terra-400"
            />
            Verified purchase only
          </label>
          <label className="inline-flex items-center gap-2 text-green-800">
            <input
              type="checkbox"
              checked={withPhotos}
              onChange={(e) => {
                setWithPhotos(e.target.checked);
                setPage(1);
              }}
              className="rounded border-cream-300 text-terra-500 focus:ring-terra-400"
            />
            With photos or video
          </label>
        </div>

        {paginated.items.length === 0 ? (
          <p className="mt-6 text-sm text-green-700/70" role="status">
            No reviews match your filters. Try clearing search or filters.
          </p>
        ) : (
          <ul className="pdp-review-grid mt-8" aria-live="polite">
            {paginated.items.map((r) => (
              <li key={r.id}>
                <ReviewCard review={r} />
              </li>
            ))}
          </ul>
        )}

        {paginated.pageCount > 1 ? (
          <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Review pagination">
            <button
              type="button"
              disabled={paginated.page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-2xl border border-cream-200 px-4 py-2 text-sm font-semibold text-green-800 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400"
            >
              Previous
            </button>
            <span className="text-sm text-green-700/70">
              Page {paginated.page} of {paginated.pageCount}
            </span>
            <button
              type="button"
              disabled={paginated.page >= paginated.pageCount}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-2xl border border-cream-200 px-4 py-2 text-sm font-semibold text-green-800 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-terra-400"
            >
              Next
            </button>
          </nav>
        ) : null}
      </section>
    </div>
  );
}
