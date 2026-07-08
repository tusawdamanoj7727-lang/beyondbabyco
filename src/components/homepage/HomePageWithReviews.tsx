import HomePageContent from "@/components/homepage/HomePageContent";
import { computeReviewSummary } from "@/lib/reviews/helpers";
import { getFeaturedReviews } from "@/lib/reviews/queries";
import { mergeTestimonials } from "@/lib/trust";
import { reviewJsonLd } from "@/lib/seo/json-ld";
import JsonLd from "@/components/seo/JsonLd";
import type { StorefrontHomepage } from "@/lib/homepage/storefront";

/** Fetches reviews off the hero critical path so initial HTML can stream sooner. */
export default async function HomePageWithReviews({ data }: { data: StorefrontHomepage }) {
  const featuredDb = await getFeaturedReviews(10);
  const communityReviews =
    featuredDb.length > 0 ? featuredDb.map((r) => ({ ...r, hasVideo: false })) : [];

  const testimonials = mergeTestimonials(data.testimonials, communityReviews);
  const featuredReview = communityReviews.find((r) => r.isFeatured) ?? communityReviews[0] ?? null;
  const summary = computeReviewSummary(communityReviews);

  const reviewSchema = reviewJsonLd(
    communityReviews.slice(0, 5).map((r) => ({
      author: r.customerName,
      rating: r.rating,
      body: r.body ?? "",
      date: r.createdAt,
    })),
  );

  const testimonialSchema =
    testimonials.length > 0
      ? reviewJsonLd(
          testimonials.slice(0, 5).map((t) => ({
            author: t.name,
            rating: t.rating,
            body: t.text,
            date: t.date ?? "2026-01-01",
          })),
        )
      : null;

  return (
    <>
      <JsonLd
        data={[
          ...(reviewSchema ?? []),
          ...(testimonialSchema ?? []),
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "BeyondBabyCo Home",
            aggregateRating:
              summary.reviewCount > 0
                ? {
                    "@type": "AggregateRating",
                    ratingValue: summary.averageRating,
                    reviewCount: summary.reviewCount,
                  }
                : undefined,
          },
        ].filter(Boolean)}
      />
      <HomePageContent
        data={data}
        featuredReview={featuredReview}
        communityReviews={communityReviews}
      />
    </>
  );
}
