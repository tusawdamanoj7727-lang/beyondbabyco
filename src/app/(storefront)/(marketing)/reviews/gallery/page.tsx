import type { Metadata } from "next";
import Link from "next/link";

import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Customer Review Gallery",
  description:
    "Lifestyle moments from BeyondBabyCo parents — gentle care in real homes across India.",
  path: "/reviews/gallery",
});

export default async function ReviewGalleryPage() {
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
          <nav aria-label="Breadcrumb" className="text-sm text-green-700">
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
            <p className="mt-3 text-body text-green-700">
              Real moments from families who choose gentle, research-backed care will appear here as
              verified photo reviews are published.
            </p>
          </header>

          <div className="mt-10 rounded-3xl border border-dashed border-green-200 bg-cream-50/70 px-6 py-14 text-center">
            <p className="font-heading text-xl font-bold text-green-900">Gallery coming with real orders</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-green-700">
              We only show authentic customer photos — no demo imagery. Check back after your first
              delivery, or explore products now.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/products"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-green-700 px-6 text-sm font-semibold text-cream-50 hover:bg-green-800"
              >
                Shop products
              </Link>
              <Link
                href="/community"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-green-200 bg-white px-6 text-sm font-semibold text-green-800 hover:bg-cream-50"
              >
                Back to community
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
