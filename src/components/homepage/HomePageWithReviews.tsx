import { Suspense } from "react";

import HomePageContent from "@/components/homepage/HomePageContent";
import HomePageReviewsSection from "@/components/homepage/HomePageReviewsSection";
import type { StorefrontHomepage } from "@/lib/homepage/storefront";
import { getMarketingSurfaces } from "@/lib/marketing/surfaces";
import { getStorefrontBanners } from "@/lib/admin/banners";

/**
 * Critical path paints hero + featured products immediately.
 * Reviews/schema stream in a sibling Suspense — never remount the hero (hurts LCP).
 */
export default async function HomePageWithReviews({ data }: { data: StorefrontHomepage }) {
  const [marketing, managedBanners] = await Promise.all([
    getMarketingSurfaces(),
    getStorefrontBanners("homepage_mid").catch(() => []),
  ]);

  return (
    <>
      <HomePageContent
        data={data}
        communityReviews={[]}
        heroCampaign={marketing.heroCampaign}
        bannerCampaign={marketing.bannerCampaign}
        popupCampaign={marketing.popupCampaign}
        managedBanners={managedBanners}
      />
      <Suspense fallback={null}>
        <HomePageReviewsSection data={data} />
      </Suspense>
    </>
  );
}
