import Image from "next/image";

import HeroSection from "@/components/sections/HeroSection";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import HomePageBelowFold from "@/components/homepage/HomePageBelowFold";
import SectionWaveDivider from "@/components/ui/SectionWaveDivider";
import type { EnrichedPublicReview } from "@/lib/reviews/types";
import type { StorefrontHomepage } from "@/lib/homepage/storefront";
import { fixedImageSizes, mascotImageQuality } from "@/lib/media/image-delivery";

/**
 * Above-the-fold SSR (hero + featured products).
 * Below-fold mounts from a client boundary to cut initial HTML + main-thread cost.
 */
export default function HomePageContent({
  data,
  communityReviews,
}: {
  data: StorefrontHomepage;
  featuredReview?: EnrichedPublicReview | null;
  communityReviews: EnrichedPublicReview[];
}) {
  return (
    <>
      {data.sections.hero.enabled ? <HeroSection hero={data.hero} /> : null}
      <SectionWaveDivider />

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

      <HomePageBelowFold data={data} communityReviews={communityReviews} />
    </>
  );
}
