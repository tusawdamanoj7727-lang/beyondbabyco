"use client";

import dynamic from "next/dynamic";

import type { EnrichedPublicReview } from "@/lib/reviews/types";
import type { StorefrontHomepage } from "@/lib/homepage/storefront";
import type { StorefrontCampaignSlot } from "@/lib/admin/campaign-center";

/** Client-only deferred islands — keeps `ssr: false` out of Server Components. */
const HomePageBelowFold = dynamic(() => import("@/components/homepage/HomePageBelowFold"), {
  ssr: false,
  loading: () => <div className="min-h-[50vh]" aria-hidden="true" />,
});

const CampaignPopup = dynamic(() => import("@/components/campaigns/CampaignPopup"), {
  ssr: false,
});

export default function HomePageClientIslands({
  data,
  communityReviews,
  popupCampaign = null,
}: {
  data: StorefrontHomepage;
  communityReviews: EnrichedPublicReview[];
  popupCampaign?: StorefrontCampaignSlot | null;
}) {
  return (
    <>
      <HomePageBelowFold data={data} communityReviews={communityReviews} />
      {popupCampaign ? <CampaignPopup slot={popupCampaign} /> : null}
    </>
  );
}
