import Link from "next/link";
import Image from "next/image";

import ProductCard from "@/components/catalog/ProductCard";
import CommunityHighlight from "@/components/reviews/CommunityHighlight";
import ReviewCard from "@/components/reviews/ReviewCard";
import RatingStars from "@/components/reviews/RatingStars";
import {
  CARE_TIPS,
  COMMUNITY_HIGHLIGHTS,
  PARENT_STORIES,
} from "@/lib/reviews/demo-data";
import type { EnrichedPublicReview } from "@/lib/reviews/types";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

export default function CommunitySection({
  featuredReviews,
  popularProducts,
  topRatedProducts,
  className,
}: {
  featuredReviews: EnrichedPublicReview[];
  popularProducts: StorefrontProduct[];
  topRatedProducts: StorefrontProduct[];
  className?: string;
}) {
  const hasRealRatings = topRatedProducts.some((p) => p.ratingCount > 0);
  const avgRating = hasRealRatings
    ? topRatedProducts.reduce((s, p) => s + p.ratingAvg, 0) / topRatedProducts.length
    : 0;
  const totalReviews = topRatedProducts.reduce((s, p) => s + p.ratingCount, 0);
  const featuredAreSample = featuredReviews.some((r) => r.isSample);

  return (
    <div className={cn("space-y-16", className)}>
      <header className="text-center">
        <p className="text-caption font-semibold uppercase tracking-wider text-terra-600">Community</p>
        <h2 id="parents-love-heading" className="text-h2 mt-2">
          Stories from our community
        </h2>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {hasRealRatings ? (
            <RatingStars rating={avgRating} count={totalReviews || undefined} size="md" showValue detailed />
          ) : (
            <p className="text-sm font-medium text-green-700">Verified reviews will appear as families share their experience.</p>
          )}
        </div>
        <p className="text-body prose-width mx-auto mt-3">
          Honest routines, thoughtful reviews, and gentle care tips from families who value research as much as we do.
        </p>
      </header>

      <section aria-labelledby="community-highlights-heading">
        <h3 id="community-highlights-heading" className="sr-only">
          Community highlights
        </h3>
        <ul className="grid gap-4 sm:grid-cols-3">
          {COMMUNITY_HIGHLIGHTS.map((item) => (
            <li key={item.id}>
              <CommunityHighlight item={item} />
            </li>
          ))}
        </ul>
      </section>

      {popularProducts.length > 0 ? (
        <section aria-labelledby="popular-products-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 id="popular-products-heading" className="font-heading text-2xl font-bold text-green-900">
              Popular with parents
            </h3>
            <Link href="/products?sort=best_selling" className="text-sm font-semibold text-terra-600 hover:underline">
              Explore the collection →
            </Link>
          </div>
          <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popularProducts.slice(0, 4).map((p) => (
              <li key={p.id}>
                <ProductCard product={p} hideHoverActions />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {topRatedProducts.length > 0 ? (
        <section aria-labelledby="top-rated-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 id="top-rated-heading" className="font-heading text-2xl font-bold text-green-900">
              Top-rated products
            </h3>
            <Link href="/products?sort=rating" className="text-sm font-semibold text-terra-600 hover:underline">
              See all top rated →
            </Link>
          </div>
          <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {topRatedProducts.slice(0, 4).map((p) => (
              <li key={p.id}>
                <ProductCard product={p} hideHoverActions />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section id="stories" aria-labelledby="parent-stories-heading">
        <h3 id="parent-stories-heading" className="font-heading text-2xl font-bold text-green-900">
          Parent stories
        </h3>
        <p className="mt-2 text-sm text-green-700">Illustrative stories from our community — real submissions welcome after launch.</p>
        <ul className="mt-6 grid gap-6 md:grid-cols-3">
          {PARENT_STORIES.map((story) => (
            <li key={story.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-card">
                {story.imageUrl ? (
                  <div className="relative aspect-[16/10] bg-cream-50">
                    <Image src={story.imageUrl} alt={story.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col p-5">
                  <h4 className="font-heading text-lg font-bold text-green-900">{story.title}</h4>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-green-800">{story.excerpt}</p>
                  <p className="mt-3 text-xs font-semibold text-green-700">{story.author}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="care-tips-heading">
        <h3 id="care-tips-heading" className="font-heading text-2xl font-bold text-green-900">
          Care tips from our team
        </h3>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARE_TIPS.map((tip) => (
            <li key={tip.id} className="rounded-2xl border border-cream-200 bg-cream-50/50 p-4">
              {tip.icon ? (
                <span className="text-xl" aria-hidden="true">
                  {tip.icon}
                </span>
              ) : null}
              <h4 className="mt-2 font-heading text-base font-bold text-green-900">{tip.title}</h4>
              <p className="mt-1 text-sm text-green-800">{tip.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {featuredReviews.length > 0 ? (
        <section aria-labelledby="featured-reviews-heading">
          <h3 id="featured-reviews-heading" className="font-heading text-2xl font-bold text-green-900">
            Featured reviews
          </h3>
          {featuredAreSample ? (
            <p className="mt-2 text-sm text-green-700">Sample reviews shown until verified customer reviews are published.</p>
          ) : null}
          <ul className="mt-6 grid gap-4 lg:grid-cols-2">
            {featuredReviews.slice(0, 4).map((r) => (
              <li key={r.id}>
                <ReviewCard review={r} compact />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
