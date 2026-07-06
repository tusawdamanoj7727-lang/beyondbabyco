import dynamic from "next/dynamic";

import HeroSection from "@/components/sections/HeroSection";
import StatsBar from "@/components/sections/StatsBar";
import BrandPromise from "@/components/sections/BrandPromise";
import ScienceSection from "@/components/sections/ScienceSection";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import BeyondCareLinesSection from "@/components/sections/BeyondCareLinesSection";
import LifestyleSection from "@/components/sections/LifestyleSection";
import ResearchTimeline from "@/components/sections/ResearchTimeline";
import TrustWidgets from "@/components/trust/TrustWidgets";
import QualityStandardsGrid from "@/components/trust/QualityStandardsGrid";
import type { EnrichedPublicReview } from "@/lib/reviews/types";
import type { StorefrontHomepage } from "@/lib/homepage/storefront";
import { mergeTestimonials } from "@/lib/trust";

/** Below-fold client sections — code-split to reduce main-thread work on LCP path. */
const CommunityStrip = dynamic(() => import("@/components/reviews/CommunityStrip"));
const MeetOurFriends = dynamic(() => import("@/components/sections/MeetOurFriends"));
const DoctorAdvisorySection = dynamic(() => import("@/components/trust/DoctorAdvisorySection"));
const EarlyAccessSection = dynamic(() => import("@/components/sections/EarlyAccessSection"));
const TestimonialShowcase = dynamic(() => import("@/components/trust/TestimonialShowcase"));
const NewsletterCTA = dynamic(() => import("@/components/sections/NewsletterCTA"));

export default function HomePageContent({
  data,
  featuredReview,
  communityReviews,
}: {
  data: StorefrontHomepage;
  featuredReview: EnrichedPublicReview | null;
  communityReviews: EnrichedPublicReview[];
}) {
  const cmsTestimonials = mergeTestimonials(data.testimonials, communityReviews);
  const hasPublishedReviews = communityReviews.length > 0;
  const hasTestimonials = cmsTestimonials.length > 0;

  return (
    <>
      {data.sections.hero.enabled ? <HeroSection hero={data.hero} /> : null}
      <TrustWidgets />
      <CommunityStrip featuredReview={featuredReview} allReviews={communityReviews} />
      <StatsBar />
      {data.sections.brand_promise.enabled ? (
        <BrandPromise config={data.brandPromise} />
      ) : null}
      {data.sections.science.enabled ? <ScienceSection config={data.science} /> : null}
      <QualityStandardsGrid compact />
      {data.sections.featured_products.enabled ? (
        <FeaturedProducts
          heading={data.featuredProductsHeading}
          products={data.featuredProducts}
        />
      ) : null}
      <BeyondCareLinesSection />
      {data.sections.lifestyle.enabled ? <LifestyleSection config={data.lifestyle} /> : null}
      {data.sections.mascots.enabled ? <MeetOurFriends config={data.mascots} /> : null}
      {data.sections.research_timeline.enabled ? (
        <ResearchTimeline config={data.researchTimeline} />
      ) : null}
      <DoctorAdvisorySection compact />
      {data.sections.testimonials.enabled ? (
        hasPublishedReviews || hasTestimonials ? (
          <TestimonialShowcase
            cmsItems={data.testimonials}
            communityReviews={communityReviews}
            heading={data.testimonialsHeading.heading}
            description={data.testimonialsHeading.description || undefined}
          />
        ) : (
          <EarlyAccessSection />
        )
      ) : null}
      {data.sections.newsletter.enabled ? <NewsletterCTA config={data.newsletter} /> : null}
    </>
  );
}
