import type { Metadata } from "next";
import Link from "next/link";

import CommunitySection from "@/components/reviews/CommunitySection";
import JsonLd from "@/components/seo/JsonLd";
import { listStorefrontProducts } from "@/lib/catalog/storefront";
import { getFeaturedReviews } from "@/lib/reviews/queries";
import { breadcrumbJsonLd, reviewJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Parents Love BeyondBabyCo — Community",
  description:
    "Community highlights, parent stories, top-rated products, and featured reviews from BeyondBabyCo families.",
  path: "/community",
});

export default async function CommunityPage() {
  let featuredDb: Awaited<ReturnType<typeof getFeaturedReviews>> = [];
  let catalog: Awaited<ReturnType<typeof listStorefrontProducts>> = {
    products: [],
    total: 0,
    page: 1,
    perPage: 12,
    pageCount: 1,
  };

  try {
    [featuredDb, catalog] = await Promise.all([
      getFeaturedReviews(6),
      listStorefrontProducts({ sort: "best_selling", page: 1 }),
    ]);
  } catch {
    // Keep the community page available even if live catalog/review queries fail.
  }

  const featuredReviews = featuredDb.map((r) => ({ ...r, hasVideo: false }));

  const popularProducts = catalog.products.filter((p) => p.isBestSeller || p.isTrending).slice(0, 4);
  const topRatedProducts = [...catalog.products]
    .sort((a, b) => b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount)
    .slice(0, 4);

  const reviewsSchema =
    featuredDb.length > 0
      ? reviewJsonLd(
          featuredReviews.slice(0, 5).map((r) => ({
            author: r.customerName,
            rating: r.rating,
            body: r.body ?? "",
            date: r.createdAt,
          })),
        )
      : null;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Community" },
          ]),
          ...(reviewsSchema ?? []),
        ]}
      />
      <div className="container py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="text-sm text-green-700">
          <Link href="/" className="hover:text-terra-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-green-900">Community</span>
        </nav>

        <CommunitySection
          featuredReviews={featuredReviews}
          popularProducts={popularProducts.length ? popularProducts : catalog.products.slice(0, 4)}
          topRatedProducts={topRatedProducts.length ? topRatedProducts : catalog.products.slice(0, 4)}
          className="mt-8"
        />

        <p className="mt-12 text-center text-sm text-green-700">
          Browse the{" "}
          <Link href="/reviews/gallery" className="font-semibold text-terra-600 hover:underline">
            review gallery
          </Link>{" "}
          or explore our{" "}
          <Link href="/trust-center" className="font-semibold text-terra-600 hover:underline">
            Trust Center
          </Link>
          .
        </p>
      </div>
    </>
  );
}
