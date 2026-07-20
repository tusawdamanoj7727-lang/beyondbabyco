import Image from "next/image";

import HeroSection from "@/components/sections/HeroSection";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import HomepageMarketingBanner from "@/components/homepage/HomepageMarketingBanner";
import ManagedStorefrontBanner from "@/components/marketing/ManagedStorefrontBanner";
import HomePageClientIslands from "@/components/homepage/HomePageClientIslands";
import SectionWaveDivider from "@/components/ui/SectionWaveDivider";
import type { EnrichedPublicReview } from "@/lib/reviews/types";
import type { StorefrontHomepage } from "@/lib/homepage/storefront";
import { applyHeroCampaignOverride } from "@/lib/homepage/hero-content";
import type { StorefrontCampaignSlot } from "@/lib/admin/campaign-center";
import type { BannerListItem } from "@/lib/admin/banner-types";
import { fixedImageSizes, mascotImageQuality } from "@/lib/media/image-delivery";

/**
 * Above-the-fold SSR (hero + featured products when ordered early).
 * Below-fold + popup mount from a client island to allow `ssr: false`.
 */
export default function HomePageContent({
  data,
  communityReviews,
  heroCampaign = null,
  bannerCampaign = null,
  popupCampaign = null,
  managedBanners = [],
}: {
  data: StorefrontHomepage;
  featuredReview?: EnrichedPublicReview | null;
  communityReviews: EnrichedPublicReview[];
  heroCampaign?: StorefrontCampaignSlot | null;
  bannerCampaign?: StorefrontCampaignSlot | null;
  popupCampaign?: StorefrontCampaignSlot | null;
  managedBanners?: BannerListItem[];
}) {
  const hero = applyHeroCampaignOverride(data.hero, heroCampaign);
  const order = data.sectionOrder.length
    ? data.sectionOrder
    : (["hero", "featured_products"] as const);

  const aboveFoldKeys = new Set(["hero", "featured_products"]);
  const above = order.filter((k) => aboveFoldKeys.has(k));

  return (
    <>
      {above.map((key) => {
        if (key === "hero" && data.sections.hero.enabled) {
          return <HeroSection key="hero" hero={hero} />;
        }
        if (key === "featured_products" && data.sections.featured_products.enabled) {
          return (
            <div key="featured_products" className="homepage-featured-wrap relative overflow-visible">
              <SectionWaveDivider className="homepage-section-wave" />
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
          );
        }
        return null;
      })}

      {bannerCampaign ? (
        <HomepageMarketingBanner slot={bannerCampaign} />
      ) : (
        managedBanners.slice(0, 1).map((b) => <ManagedStorefrontBanner key={b.id} banner={b} />)
      )}

      <SectionWaveDivider fill="#f0f7ee" />

      <HomePageClientIslands
        data={data}
        communityReviews={communityReviews}
        popupCampaign={popupCampaign}
      />
    </>
  );
}
