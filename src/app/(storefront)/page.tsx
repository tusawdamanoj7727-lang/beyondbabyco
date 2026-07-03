import type { Metadata } from "next";

import HomePageContent from "@/components/homepage/HomePageContent";
import JsonLd from "@/components/seo/JsonLd";
import { getStorefrontHomepage } from "@/lib/homepage/storefront";
import { computeReviewSummary } from "@/lib/reviews/helpers";
import { getFeaturedReviews } from "@/lib/reviews/queries";
import { mergeTestimonials } from "@/lib/trust";
import { reviewJsonLd } from "@/lib/seo/json-ld";
import { buildHomepageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getStorefrontHomepage();
  const title =
    data.published && data.seo.title.trim()
      ? data.seo.title
      : "BeyondBabyCo — Every Baby Deserves The Safest Touch";
  const description =
    data.published && data.seo.description.trim()
      ? data.seo.description
      : "Safe, research-backed baby care products created with love and developed through years of research by BeyondBabyCo.";

  return buildHomepageMetadata({ title, description, path: "/" });
}

export default async function Home() {
  const data = await getStorefrontHomepage();
  const testimonials = mergeTestimonials(data.testimonials);
  const featuredDb = await getFeaturedReviews(10);
  const heroLcpImage = data.hero.imageUrl.trim() || null;

  const communityReviews =
    featuredDb.length > 0
      ? featuredDb.map((r) => ({ ...r, hasVideo: false }))
      : [];

  const featuredReview =
    communityReviews.find((r) => r.isFeatured) ?? communityReviews[0] ?? null;
  const summary = computeReviewSummary(communityReviews);

  const reviewSchema = reviewJsonLd(
    communityReviews.slice(0, 5).map((r) => ({
      author: r.customerName,
      rating: r.rating,
      body: r.body ?? "",
      date: r.createdAt,
    })),
  );

  const testimonialSchema = reviewJsonLd(
    testimonials.slice(0, 5).map((t) => ({
      author: t.name,
      rating: t.rating,
      body: t.text,
      date: t.date ?? "2026-01-01",
    })),
  );

  return (
    <>
      {heroLcpImage ? (
        <link rel="preload" as="image" href={heroLcpImage} fetchPriority="high" />
      ) : null}
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
      <div className="homepage-main">
        <HomePageContent
          data={data}
          featuredReview={featuredReview}
          communityReviews={communityReviews}
        />
      </div>
    </>
  );
}
