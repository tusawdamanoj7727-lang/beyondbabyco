"use client";

import dynamic from "next/dynamic";

import SectionWaveDivider from "@/components/ui/SectionWaveDivider";
import type { EnrichedPublicReview } from "@/lib/reviews/types";
import type { StorefrontHomepage } from "@/lib/homepage/storefront";
import { mergeTestimonials } from "@/lib/trust";
import type { SectionKey } from "@/lib/admin/homepage-schema";

/** Client boundary so below-fold sections can use `ssr: false` and stay off the critical HTML. */
const MeetOurFriends = dynamic(() => import("@/components/sections/MeetOurFriends"), { ssr: false });
const ResearchTimeline = dynamic(() => import("@/components/sections/ResearchTimeline"), { ssr: false });
const LifestyleSection = dynamic(() => import("@/components/sections/LifestyleSection"), { ssr: false });
const TestimonialShowcase = dynamic(() => import("@/components/trust/TestimonialShowcase"), { ssr: false });
const BrandPromise = dynamic(() => import("@/components/sections/BrandPromise"), { ssr: false });
const ScienceSection = dynamic(() => import("@/components/sections/ScienceSection"), { ssr: false });
const StatsBar = dynamic(() => import("@/components/sections/StatsBar"), { ssr: false });
const NewsletterCTA = dynamic(() => import("@/components/sections/NewsletterCTA"), { ssr: false });

const BELOW_FOLD: SectionKey[] = [
  "mascots",
  "trust_stats",
  "science",
  "brand_promise",
  "research_timeline",
  "lifestyle",
  "testimonials",
  "newsletter",
];

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

  const order = (data.sectionOrder.length ? data.sectionOrder : BELOW_FOLD).filter((k) =>
    BELOW_FOLD.includes(k),
  );

  return (
    <>
      {order.map((key) => {
        if (key === "mascots" && data.sections.mascots.enabled) {
          return (
            <div key="mascots" className="relative overflow-visible">
              <MeetOurFriends config={data.mascots} />
              <SectionWaveDivider />
            </div>
          );
        }
        if (key === "trust_stats" && data.sections.trust_stats.enabled) {
          return (
            <div key="trust_stats">
              <StatsBar config={data.trustStats} />
              <SectionWaveDivider fill="#ffffff" />
            </div>
          );
        }
        if (key === "science" && data.sections.science.enabled) {
          return (
            <div key="science">
              <ScienceSection config={data.science} />
              <SectionWaveDivider fill="#ffffff" />
            </div>
          );
        }
        if (key === "brand_promise" && data.sections.brand_promise.enabled) {
          return (
            <div key="brand_promise">
              <BrandPromise config={data.brandPromise} />
              <SectionWaveDivider />
            </div>
          );
        }
        if (key === "research_timeline" && data.sections.research_timeline.enabled) {
          return (
            <div key="research_timeline">
              <ResearchTimeline config={data.researchTimeline} />
              <SectionWaveDivider fill="#ffffff" />
            </div>
          );
        }
        if (key === "lifestyle" && data.sections.lifestyle.enabled) {
          return (
            <div key="lifestyle">
              <LifestyleSection config={data.lifestyle} />
              <SectionWaveDivider />
            </div>
          );
        }
        if (key === "testimonials" && showReviews) {
          return (
            <div key="testimonials">
              <TestimonialShowcase
                cmsItems={data.testimonials}
                communityReviews={communityReviews}
                heading={data.testimonialsHeading.heading}
                description={data.testimonialsHeading.description || undefined}
              />
            </div>
          );
        }
        if (key === "newsletter" && data.sections.newsletter.enabled) {
          return (
            <div key="newsletter">
              <SectionWaveDivider />
              <NewsletterCTA config={data.newsletter} />
            </div>
          );
        }
        return null;
      })}
    </>
  );
}
