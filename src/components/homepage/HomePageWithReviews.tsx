import { Suspense } from "react";

import HomePageContent from "@/components/homepage/HomePageContent";
import HomePageReviewsSection from "@/components/homepage/HomePageReviewsSection";
import type { StorefrontHomepage } from "@/lib/homepage/storefront";

/** Hero streams first; reviews hydrate in a deferred server segment. */
export default function HomePageWithReviews({ data }: { data: StorefrontHomepage }) {
  return (
    <Suspense fallback={<HomePageContent data={data} communityReviews={[]} />}>
      <HomePageReviewsSection data={data} />
    </Suspense>
  );
}
