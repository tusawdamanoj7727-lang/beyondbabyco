"use client";

import dynamic from "next/dynamic";

import SectionWaveDivider from "@/components/ui/SectionWaveDivider";
import type { EnrichedPublicReview } from "@/lib/reviews/types";
import type { StorefrontHomepage } from "@/lib/homepage/storefront";
import { mergeTestimonials } from "@/lib/trust";

/** Client boundary so below-fold sections can use `ssr: false` and stay off the critical HTML. */
const MeetOurFriends = dynamic(() => import("@/components/sections/MeetOurFriends"), { ssr: false });
const ResearchTimeline = dynamic(() => import("@/components/sections/ResearchTimeline"), { ssr: false });
const LifestyleSection = dynamic(() => import("@/components/sections/LifestyleSection"), { ssr: false });
const TestimonialShowcase = dynamic(() => import("@/components/trust/TestimonialShowcase"), { ssr: false });
const BrandPromise = dynamic(() => import("@/components/sections/BrandPromise"), { ssr: false });
const ScienceSection = dynamic(() => import("@/components/sections/ScienceSection"), { ssr: false });
const StatsBar = dynamic(() => import("@/components/sections/StatsBar"), { ssr: false });

export default function HomePageBelowFold({
  data,
  communityReviews,
}: {
  data: StorefrontHomepage;
  communityReviews: EnrichedPublicReview[];
}) {
  const cmsTestimonials = mergeTestimonials(data.testimonials, communityReviews);
  const hasPublishedReviews = communityReviews.length > 0;
  const hasTestimonials = cmsTestimonials.length > 0;
  const showReviews = data.sections.testimonials.enabled && (hasPublishedReviews || hasTestimonials);

  return (
    <>
      {data.sections.mascots.enabled ? (
        <div className="relative overflow-visible">
          <MeetOurFriends config={data.mascots} />
        </div>
      ) : null}

      <SectionWaveDivider />

      <StatsBar />

      <SectionWaveDivider fill="#ffffff" />

      {data.sections.science.enabled ? <ScienceSection config={data.science} /> : null}

      <SectionWaveDivider fill="#ffffff" />

      {data.sections.brand_promise.enabled ? <BrandPromise config={data.brandPromise} /> : null}

      <SectionWaveDivider />

      {data.sections.research_timeline.enabled ? (
        <ResearchTimeline config={data.researchTimeline} />
      ) : null}

      <SectionWaveDivider fill="#ffffff" />

      {data.sections.lifestyle.enabled ? <LifestyleSection config={data.lifestyle} /> : null}

      <SectionWaveDivider />

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
