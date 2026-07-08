import dynamic from "next/dynamic";
import Image from "next/image";

import HeroSection from "@/components/sections/HeroSection";
import StatsBar from "@/components/sections/StatsBar";
import BrandPromise from "@/components/sections/BrandPromise";
import ScienceSection from "@/components/sections/ScienceSection";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import SectionWaveDivider from "@/components/ui/SectionWaveDivider";
import ScrollAnimationSection from "@/components/ui/ScrollAnimationSection";
import type { EnrichedPublicReview } from "@/lib/reviews/types";
import type { StorefrontHomepage } from "@/lib/homepage/storefront";
import { fixedImageSizes, mascotImageQuality } from "@/lib/media/image-delivery";
import { mergeTestimonials } from "@/lib/trust";

/** Below-fold client sections — code-split to reduce main-thread work on LCP path. */
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
      <SectionWaveDivider fill="#faf5f0" />

      {/* 2. Products — immediately after hero */}
      {data.sections.featured_products.enabled ? (
        <ScrollAnimationSection>
          <section id="products" className="relative overflow-visible bg-[#faf5f0] py-16">
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
          <div className="mb-12 px-4 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-[#c4673a]">
              Pure &amp; Gentle
            </span>
            <h2
              className="mb-3 mt-2 text-4xl font-black text-[#2d5a27] md:text-5xl"
              style={{ fontFamily: "Montserrat" }}
            >
              Our Products
            </h2>
            <p className="mx-auto max-w-lg text-lg text-gray-500">
              5 years of research. Every ingredient chosen for your baby.
            </p>
          </div>
          <FeaturedProducts
            heading={data.featuredProductsHeading}
            products={data.featuredProducts}
          />
        </section>
        </ScrollAnimationSection>
      ) : null}

      <SectionWaveDivider fill="#f0f7ee" />

      {/* 3. Mascots */}
      {data.sections.mascots.enabled ? (
        <ScrollAnimationSection>
          <div className="relative overflow-visible">
            <MeetOurFriends config={data.mascots} />
          </div>
        </ScrollAnimationSection>
      ) : null}

      <SectionWaveDivider fill="#faf5f0" />

      {/* 4. Stats */}
      <ScrollAnimationSection>
        <StatsBar />
      </ScrollAnimationSection>

      <SectionWaveDivider fill="#ffffff" />

      {/* 5. Science */}
      {data.sections.science.enabled ? (
        <ScrollAnimationSection>
          <ScienceSection config={data.science} />
        </ScrollAnimationSection>
      ) : null}

      <SectionWaveDivider fill="#ffffff" />

      {/* 7. Brand promise */}
      {data.sections.brand_promise.enabled ? (
        <ScrollAnimationSection>
          <BrandPromise config={data.brandPromise} />
        </ScrollAnimationSection>
      ) : null}

      <SectionWaveDivider fill="#faf5f0" />

      {/* 8. Research timeline */}
      {data.sections.research_timeline.enabled ? (
        <ScrollAnimationSection>
          <ResearchTimeline config={data.researchTimeline} />
        </ScrollAnimationSection>
      ) : null}

      <SectionWaveDivider fill="#ffffff" />

      {/* 9. Lifestyle */}
      {data.sections.lifestyle.enabled ? (
        <ScrollAnimationSection>
          <LifestyleSection config={data.lifestyle} />
        </ScrollAnimationSection>
      ) : null}

      <SectionWaveDivider fill="#faf5f0" />

      {/* 10. Reviews */}
      {showReviews ? (
        <ScrollAnimationSection>
          <TestimonialShowcase
            cmsItems={data.testimonials}
            communityReviews={communityReviews}
            heading={data.testimonialsHeading.heading}
            description={data.testimonialsHeading.description || undefined}
          />
        </ScrollAnimationSection>
      ) : null}

      {/* Footer — rendered in root layout via StorefrontFooter */}
    </>
  );
}
