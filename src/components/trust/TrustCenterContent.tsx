import dynamic from "next/dynamic";

import Link from "next/link";

import CatalogHero from "@/components/catalog/CatalogHero";
import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import FaqAccordion from "@/components/content/ContentSections";
import QualityStandardsGrid from "@/components/trust/QualityStandardsGrid";
import ResearchProcessSection from "@/components/trust/ResearchProcessSection";
import TrustWidgets from "@/components/trust/TrustWidgets";
import { RESEARCH_PROCESS_FAQ, TRUST_IMAGES } from "@/lib/trust";

const IngredientTransparency = dynamic(() => import("@/components/trust/IngredientTransparency"));
const DoctorAdvisorySection = dynamic(() => import("@/components/trust/DoctorAdvisorySection"));
const ManufacturingStory = dynamic(() => import("@/components/trust/ManufacturingStory"));
const SustainabilitySection = dynamic(() => import("@/components/trust/SustainabilitySection"));
const TestimonialShowcase = dynamic(() => import("@/components/trust/TestimonialShowcase"));

export default function TrustCenterContent() {
  return (
    <>
      <CatalogHero
        banner={{
          title: "Trust Center",
          subtitle: "BeyondBabyCo",
          description:
            "Research, quality, transparency, and social proof — everything you need to feel confident in every BeyondBabyCo product.",
          imageUrl: TRUST_IMAGES.trustHero,
        }}
      />
      <CatalogBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Trust Center" },
        ]}
      />
      <TrustWidgets variant="grid" />
      <ResearchProcessSection id="research" />
      <IngredientTransparency id="ingredients" />
      <QualityStandardsGrid id="quality" />
      <DoctorAdvisorySection id="advisory" />
      <ManufacturingStory id="manufacturing-story" />
      <SustainabilitySection id="sustainability" />
      <TestimonialShowcase
        heading="Trusted By Families"
        description="Real stories from parents who chose BeyondBabyCo."
        showCarousel
        showFeatured={false}
      />
      <section className="section-padding bg-cream-50">
        <div className="container max-w-3xl">
          <h2 className="section-heading text-center">Research process FAQ</h2>
          <div className="mt-8">
            <FaqAccordion items={RESEARCH_PROCESS_FAQ} />
          </div>
          <p className="mt-8 text-center">
            <Link
              href="/research"
              className="font-semibold text-terra-600 underline-offset-4 hover:underline"
            >
              Explore our full research story
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
