import dynamic from "next/dynamic";

import HeroSection from "@/components/sections/HeroSection";
import HeroTrustBar from "@/components/sections/HeroTrustBar";
import StatsBar from "@/components/sections/StatsBar";
import BrandPromise from "@/components/sections/BrandPromise";
import ScienceSection from "@/components/sections/ScienceSection";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import CategoriesSection from "@/components/sections/CategoriesSection";
import HomepageMascotGuide from "@/components/mascots/HomepageMascotGuide";
import SectionWaveDivider from "@/components/ui/SectionWaveDivider";
import type { EnrichedPublicReview } from "@/lib/reviews/types";
import type { StorefrontHomepage } from "@/lib/homepage/storefront";
import { mergeTestimonials } from "@/lib/trust";

/** Below-fold client sections — code-split to reduce main-thread work on LCP path. */
const MeetOurFriends = dynamic(() => import("@/components/sections/MeetOurFriends"));
const ResearchTimeline = dynamic(() => import("@/components/sections/ResearchTimeline"));
const TestimonialShowcase = dynamic(() => import("@/components/trust/TestimonialShowcase"));

export default function HomePageContent({
  data,
  featuredReview: _featuredReview,
  communityReviews,
}: {
  data: StorefrontHomepage;
  featuredReview: EnrichedPublicReview | null;
  communityReviews: EnrichedPublicReview[];
}) {
  const cmsTestimonials = mergeTestimonials(data.testimonials, communityReviews);
  const hasPublishedReviews = communityReviews.length > 0;
  const hasTestimonials = cmsTestimonials.length > 0;
  const showReviews = data.sections.testimonials.enabled && (hasPublishedReviews || hasTestimonials);

  return (
    <>
      {data.sections.hero.enabled ? (
        <>
          <HeroSection hero={data.hero} />
          <HeroTrustBar />
          <SectionWaveDivider fill="#faf5f0" />
        </>
      ) : null}

      {data.sections.featured_products.enabled ? (
        <section id="products" className="relative overflow-visible bg-[#faf5f0] py-16">
          <HomepageMascotGuide
            mascot="bella-bunny"
            pose="hold-product"
            size={200}
            placementClassName="-right-4 bottom-0 xl:-right-8"
          />
          <div className="mb-12 text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#c4673a]">
              Our Products
            </span>
            <h2
              className="mb-4 mt-2 text-4xl font-black text-[#2d5a27] font-[family-name:var(--font-montserrat)]"
            >
              Crafted For Your Little One
            </h2>
            <p className="mx-auto max-w-xl text-lg text-gray-600">
              5 years of research. Every drop tested. Every ingredient chosen with love.
            </p>
          </div>
          <FeaturedProducts
            heading={data.featuredProductsHeading}
            products={data.featuredProducts}
          />
        </section>
      ) : null}

      <SectionWaveDivider fill="#f0f7ee" />

      {data.sections.mascots.enabled ? (
        <div className="relative overflow-visible">
          <MeetOurFriends config={data.mascots} />
        </div>
      ) : null}

      <SectionWaveDivider fill="#faf5f0" />
      <StatsBar />
      <SectionWaveDivider fill="#ffffff" />

      <CategoriesSection
        heading={data.featuredCategoriesHeading}
        categories={data.categories}
      />

      <SectionWaveDivider fill="#faf5f0" />

      {data.sections.science.enabled ? <ScienceSection config={data.science} /> : null}

      <SectionWaveDivider fill="#ffffff" />

      {data.sections.brand_promise.enabled ? (
        <BrandPromise config={data.brandPromise} />
      ) : null}

      <SectionWaveDivider fill="#faf5f0" />

      {data.sections.research_timeline.enabled ? (
        <ResearchTimeline config={data.researchTimeline} />
      ) : null}

      <SectionWaveDivider fill="#ffffff" />

      {showReviews ? (
        <TestimonialShowcase
          cmsItems={data.testimonials}
          communityReviews={communityReviews}
          heading={data.testimonialsHeading.heading}
          description={data.testimonialsHeading.description || undefined}
        />
      ) : null}
    </>
  );
}
