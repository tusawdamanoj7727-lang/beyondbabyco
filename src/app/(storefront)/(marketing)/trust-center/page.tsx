import type { Metadata } from "next";

import TrustCenterContent from "@/components/trust/TrustCenterContent";
import JsonLd from "@/components/seo/JsonLd";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { RESEARCH_PROCESS_FAQ, TRUST_IMAGES } from "@/lib/trust";

export const metadata: Metadata = buildPageMetadata({
  title: "Trust Center",
  description:
    "Explore BeyondBabyCo's research process, ingredient transparency, quality standards, manufacturing story, and customer testimonials.",
  path: "/trust-center",
  image: "/images/generated/homepage/phase-8-2/brand-promise/lifestyle-08.png",
});

export default function TrustCenterPage() {
  const faqSchema = faqJsonLd(RESEARCH_PROCESS_FAQ);
  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", url: "/" },
      { name: "Trust Center" },
    ]),
    articleJsonLd({
      title: "BeyondBabyCo Trust Center",
      description:
        "Research process, ingredient transparency, quality standards, and social proof for BeyondBabyCo baby care products.",
      path: "/trust-center",
    }),
    ...(faqSchema ? [faqSchema] : []),
  ];

  return (
    <>
      <link rel="preload" as="image" href={TRUST_IMAGES.trustHero} fetchPriority="high" />
      <JsonLd data={jsonLd} />
      <TrustCenterContent />
    </>
  );
}
