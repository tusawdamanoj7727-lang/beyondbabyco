import Link from "next/link";
import { BookOpen, Leaf, ShieldCheck } from "lucide-react";

import ProductCard from "@/components/catalog/ProductCard";
import ReviewCard from "@/components/reviews/ReviewCard";
import RatingStars from "@/components/reviews/RatingStars";
import type { EnrichedPublicReview } from "@/lib/reviews/types";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

const COMMUNITY_PILLARS = [
  {
    id: "research",
    title: "Research-led care",
    body: "Formulations refined through years of ingredient study and safety validation in Udaipur.",
    icon: BookOpen,
  },
  {
    id: "gentle",
    title: "Gentle by design",
    body: "Mindfully selected ingredients chosen for everyday baby skin — without unnecessary additives.",
    icon: Leaf,
  },
  {
    id: "trust",
    title: "Dermatologically tested",
    body: "Every product is tested for safety so parents can shop with confidence.",
    icon: ShieldCheck,
  },
] as const;

const CARE_TIPS = [
  {
    id: "patch",
    title: "Patch test first",
    body: "Apply a small amount on the inner arm and wait 24 hours before first full use.",
  },
  {
    id: "routine",
    title: "Keep routines simple",
    body: "One gentle cleanser and one moisturizer cover most everyday baby care needs.",
  },
  {
    id: "storage",
    title: "Store cool & dry",
    body: "Keep products away from direct sunlight so textures and actives stay stable.",
  },
  {
    id: "support",
    title: "We’re here to help",
    body: "Questions about an ingredient or routine? Reach us at info@beyondbabyco.com.",
  },
] as const;

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
  const realReviews = featuredReviews.filter((r) => !r.isSample);
  const hasRealRatings = topRatedProducts.some((p) => p.ratingCount > 0);
  const avgRating = hasRealRatings
    ? topRatedProducts.reduce((s, p) => s + p.ratingAvg, 0) / topRatedProducts.length
    : 0;
  const totalReviews = topRatedProducts.reduce((s, p) => s + p.ratingCount, 0);

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
            <p className="text-sm font-medium text-green-700">
              Verified reviews will appear as families share their experience.
            </p>
          )}
        </div>
        <p className="text-body prose-width mx-auto mt-3">
          Honest routines, thoughtful reviews, and gentle care tips from families who value research as
          much as we do.
        </p>
      </header>

      <section aria-labelledby="community-pillars-heading">
        <h3 id="community-pillars-heading" className="sr-only">
          What parents can expect
        </h3>
        <ul className="grid gap-4 sm:grid-cols-3">
          {COMMUNITY_PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.id}
                className="rounded-2xl border border-cream-200 bg-white p-5 shadow-card"
              >
                <Icon className="h-5 w-5 text-green-700" strokeWidth={1.75} aria-hidden="true" />
                <h4 className="mt-3 font-heading text-lg font-bold text-green-900">{item.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-green-800">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {popularProducts.length > 0 ? (
        <section aria-labelledby="popular-products-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 id="popular-products-heading" className="font-heading text-2xl font-bold text-green-900">
              Popular with parents
            </h3>
            <Link
              href="/products?sort=best_selling"
              className="text-sm font-semibold text-terra-600 hover:underline"
            >
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
            <Link
              href="/products?sort=rating"
              className="text-sm font-semibold text-terra-600 hover:underline"
            >
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

      <section aria-labelledby="care-tips-heading">
        <h3 id="care-tips-heading" className="font-heading text-2xl font-bold text-green-900">
          Care tips from our team
        </h3>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARE_TIPS.map((tip) => (
            <li key={tip.id} className="rounded-2xl border border-cream-200 bg-cream-50/50 p-4">
              <h4 className="font-heading text-base font-bold text-green-900">{tip.title}</h4>
              <p className="mt-1 text-sm text-green-800">{tip.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {realReviews.length > 0 ? (
        <section aria-labelledby="featured-reviews-heading">
          <h3 id="featured-reviews-heading" className="font-heading text-2xl font-bold text-green-900">
            Featured reviews
          </h3>
          <ul className="mt-6 grid gap-4 lg:grid-cols-2">
            {realReviews.slice(0, 4).map((r) => (
              <li key={r.id}>
                <ReviewCard review={r} compact />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section
          aria-labelledby="reviews-invite-heading"
          className="rounded-3xl border border-dashed border-green-200 bg-cream-50/60 px-6 py-10 text-center"
        >
          <h3 id="reviews-invite-heading" className="font-heading text-xl font-bold text-green-900">
            Be among the first to review
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-green-700">
            Customer photos and verified reviews will appear here as orders ship. Explore the collection
            and share your experience after purchase.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-green-700 px-6 text-sm font-semibold text-cream-50 hover:bg-green-800"
          >
            Shop the collection
          </Link>
        </section>
      )}
    </div>
  );
}
