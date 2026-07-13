import dynamic from "next/dynamic";

import Image from "next/image";

import HeroSection from "@/components/sections/HeroSection";
import StatsBar from "@/components/sections/StatsBar";
import BrandPromise from "@/components/sections/BrandPromise";
import ScienceSection from "@/components/sections/ScienceSection";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import SectionWaveDivider from "@/components/ui/SectionWaveDivider";
import type { EnrichedPublicReview } from "@/lib/reviews/types";
import type { StorefrontHomepage } from "@/lib/homepage/storefront";
import { fixedImageSizes, mascotImageQuality } from "@/lib/media/image-delivery";
import { mergeTestimonials } from "@/lib/trust";

/** Below-fold sections — lazy-loaded to keep them off the initial homepage bundle. */
const MeetOurFriends = dynamic(() => import("@/components/sections/MeetOurFriends"));
const ResearchTimeline = dynamic(() => import("@/components/sections/ResearchTimeline"));
const LifestyleSection = dynamic(() => import("@/components/sections/LifestyleSection"));
const TestimonialShowcase = dynamic(() => import("@/components/trust/TestimonialShowcase"));

// <NewsletterSection /> — removed (duplicate; footer captures email)
// <EarlyAccessSection /> — removed (duplicate)
// <ExpertGuidanceSection /> — optional, not on homepage

export default function HomePageContent({
  data,
  communityReviews,
}: {
  data: StorefrontHomepage;
  featuredReview?: EnrichedPublicReview | null;
  communityReviews: EnrichedPublicReview[];
}) {
  const cmsTestimonials = mergeTestimonials(data.testimonials, communityReviews);
  const hasPublishedReviews = communityReviews.length > 0;
  const hasTestimonials = cmsTestimonials.length > 0;
  const showReviews = data.sections.testimonials.enabled && (hasPublishedReviews || hasTestimonials);

  return (
    <>
      {/* 1. Hero */}
      {data.sections.hero.enabled ? <HeroSection hero={data.hero} /> : null}
      <SectionWaveDivider />

      {/* 2. Products — immediately after hero */}
      {data.sections.featured_products.enabled ? (
        <div className="relative overflow-visible">
          <div
            className="pointer-events-none absolute right-0 top-8 z-20 hidden select-none xl:block"
            aria-hidden="true"
          >
            <Image
              src="/icons/bella-bunny/hold-product.webp"
              alt=""
              width={160}
              height={160}
              loading="lazy"
              sizes={fixedImageSizes(160)}
              quality={mascotImageQuality(160)}
              className="animate-float object-contain drop-shadow-2xl"
              style={{
                background: "transparent",
                filter: "drop-shadow(0 15px 30px rgba(0,0,0,0.12))",
              }}
            />
          </div>
          <FeaturedProducts heading={data.featuredProductsHeading} products={data.featuredProducts} />
        </div>
      ) : null}

      <SectionWaveDivider fill="#f0f7ee" />

      {/* 3. Mascots */}
      {data.sections.mascots.enabled ? (
        <div className="relative overflow-visible">
          <MeetOurFriends config={data.mascots} />
        </div>
      ) : null}

      <SectionWaveDivider />

      {/* 4. Stats */}
      <StatsBar />

      <SectionWaveDivider fill="#ffffff" />

      {/* 5. Science */}
      {data.sections.science.enabled ? <ScienceSection config={data.science} /> : null}

      <SectionWaveDivider fill="#ffffff" />

      {/* 7. Brand promise */}
      {data.sections.brand_promise.enabled ? <BrandPromise config={data.brandPromise} /> : null}

      <SectionWaveDivider />

      {/* 8. Research timeline */}
      {data.sections.research_timeline.enabled ? (
        <ResearchTimeline config={data.researchTimeline} />
      ) : null}

      <SectionWaveDivider fill="#ffffff" />

      {/* 9. Lifestyle */}
      {data.sections.lifestyle.enabled ? <LifestyleSection config={data.lifestyle} /> : null}

      <SectionWaveDivider />

      {/* 10. Reviews */}
      {showReviews ? (
        <TestimonialShowcase
          cmsItems={data.testimonials}
          communityReviews={communityReviews}
          heading={data.testimonialsHeading.heading}
          description={data.testimonialsHeading.description || undefined}
        />
      ) : null}

      {/* Footer — rendered in root layout via StorefrontFooter */}
    </>
  );
}
