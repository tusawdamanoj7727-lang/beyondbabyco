import { Suspense } from "react";

import HomePageContent from "@/components/homepage/HomePageContent";
import HomePageReviewsSection from "@/components/homepage/HomePageReviewsSection";
import type { StorefrontHomepage } from "@/lib/homepage/storefront";

/**
 * Critical path paints hero + featured products immediately.
 * Reviews/schema stream in a sibling Suspense — never remount the hero (hurts LCP).
 */
export default function HomePageWithReviews({ data }: { data: StorefrontHomepage }) {
  return (
    <>
      <HomePageContent data={data} communityReviews={[]} />
      <Suspense fallback={null}>
        <HomePageReviewsSection data={data} />
      </Suspense>
    </>
  );
}
