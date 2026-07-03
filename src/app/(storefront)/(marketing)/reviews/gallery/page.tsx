import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import ModuleLoading from "@/components/ui/ModuleLoading";
import JsonLd from "@/components/seo/JsonLd";
import { DEMO_GALLERY_ITEMS } from "@/lib/reviews/demo-data";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

const ReviewGallery = dynamic(() => import("@/components/reviews/ReviewGallery"), {
  loading: () => <ModuleLoading label="Loading gallery…" />,
});

export const metadata: Metadata = buildPageMetadata({
  title: "Customer Review Gallery",
  description:
    "Lifestyle moments from BeyondBabyCo parents — gentle care in real homes across India.",
  path: "/reviews/gallery",
});

type PageProps = {
  searchParams: Promise<{ product?: string }>;
};

export default async function ReviewGalleryPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const productSlug = sp.product;
  const items = productSlug
    ? DEMO_GALLERY_ITEMS.filter((i) => i.productSlug === productSlug)
    : DEMO_GALLERY_ITEMS;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Review Gallery" },
        ])}
      />
      <div className="premium-page-bg relative min-h-[60vh] py-10 md:py-14">
        <div className="container relative z-10">
        <nav aria-label="Breadcrumb" className="text-sm text-green-700/70">
          <Link href="/" className="hover:text-terra-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/community" className="hover:text-terra-600">
            Community
          </Link>
          <span className="mx-2">/</span>
          <span className="text-green-900">Gallery</span>
        </nav>

        <header className="mt-6 max-w-2xl">
          <h1 className="font-heading text-3xl font-extrabold text-green-900 md:text-4xl">
            Customer review gallery
          </h1>
          <p className="mt-3 text-body text-green-700/80">
            Real moments from families who choose gentle, research-backed care.
            {productSlug ? " Showing photos linked to this product." : ""}
          </p>
          {productSlug ? (
            <Link href="/reviews/gallery" className="mt-3 inline-block text-sm font-semibold text-terra-600 hover:underline">
              Show all gallery items
            </Link>
          ) : null}
        </header>

        <div className="mt-10">
          <ReviewGallery items={items.length ? items : DEMO_GALLERY_ITEMS} layout="grid" />
        </div>
        </div>
      </div>
    </>
  );
}
