import type { Metadata } from "next";
import { getImageProps } from "next/image";

import HomePageContent from "@/components/homepage/HomePageContent";
import JsonLd from "@/components/seo/JsonLd";
import { resolveVisualUrl } from "@/lib/brand/generated-assets";
import { getStorefrontHomepage } from "@/lib/homepage/storefront";
import { HERO_DEFAULT_BLUR } from "@/lib/homepage/visual-assets";
import { IMAGE_QUALITY, IMAGE_SIZES } from "@/lib/media/image-delivery";
import { IMAGES } from "@/lib/images";
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
  const featuredDb = await getFeaturedReviews(10);
  const heroLcpImage = (() => {
    const resolved = resolveVisualUrl(data.hero.imageUrl, {
      category: "hero",
      slug: "gentle-care-hero",
    });
    return resolved.url || IMAGES.hero.mother_baby;
  })();

  const heroPreload = getImageProps({
    src: heroLcpImage,
    alt: data.hero.imageAlt,
    fill: true,
    priority: true,
    sizes: IMAGE_SIZES.hero,
    quality: IMAGE_QUALITY.hero,
    placeholder: "blur",
    blurDataURL: data.hero.imageUrl?.trim() ? resolveVisualUrl(data.hero.imageUrl, { category: "hero", slug: "gentle-care-hero" }).blur : HERO_DEFAULT_BLUR,
  });

  const communityReviews =
    featuredDb.length > 0
      ? featuredDb.map((r) => ({ ...r, hasVideo: false }))
      : [];

  const testimonials = mergeTestimonials(data.testimonials, communityReviews);

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
      <link
        rel="preload"
        as="image"
        href={heroPreload.props.src}
        imageSrcSet={heroPreload.props.srcSet}
        imageSizes={heroPreload.props.sizes}
        fetchPriority="high"
      />
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
