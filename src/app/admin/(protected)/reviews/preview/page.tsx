import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/admin/PageHeader";
import CommunitySection from "@/components/reviews/CommunitySection";
import ProductQASection from "@/components/reviews/ProductQASection";
import ProductReviewsPanel from "@/components/reviews/ProductReviewsPanel";
import ReviewGallery from "@/components/reviews/ReviewGallery";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  DEMO_GALLERY_ITEMS,
  getDemoQuestionsForProduct,
  mergeReviewsWithDemo,
} from "@/lib/reviews/demo-data";
import { computeReviewSummary } from "@/lib/reviews/helpers";

export const metadata: Metadata = { title: "Review Components Preview" };

export default async function ReviewsPreviewPage() {
  await requirePermission(PERMISSIONS.REVIEWS_MANAGE);

  const reviews = mergeReviewsWithDemo("preview", [], "Gentle Baby Wash Demo");
  const summary = computeReviewSummary(reviews);
  const questions = getDemoQuestionsForProduct("preview");

  return (
    <div className="space-y-10">
      <PageHeader
        title="Review & community preview"
        description="Storefront review widgets, gallery, Q&A, and community sections — read-only component preview."
        actions={
          <Link
            href="/admin/reviews"
            className="rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm font-semibold text-green-800 hover:bg-cream-50"
          >
            ← Back to moderation
          </Link>
        }
      />

      <section className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card">
        <h2 className="font-heading text-xl font-bold text-green-900">Product reviews panel</h2>
        <div className="mt-6">
          <ProductReviewsPanel
            reviews={reviews}
            summary={summary}
            productName="Gentle Baby Wash Demo"
            productSlug="gentle-baby-wash"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card">
        <h2 className="font-heading text-xl font-bold text-green-900">Review gallery</h2>
        <div className="mt-6">
          <ReviewGallery items={DEMO_GALLERY_ITEMS} layout="grid" />
        </div>
      </section>

      <section className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card">
        <h2 className="font-heading text-xl font-bold text-green-900">Questions & answers</h2>
        <div className="mt-6">
          <ProductQASection questions={questions} productName="Gentle Baby Wash Demo" />
        </div>
      </section>

      <section className="rounded-2xl border border-cream-200 bg-white p-6 shadow-card">
        <h2 className="font-heading text-xl font-bold text-green-900">Community section</h2>
        <div className="mt-6">
          <CommunitySection
            featuredReviews={reviews.filter((r) => r.isFeatured)}
            popularProducts={[]}
            topRatedProducts={[]}
          />
        </div>
      </section>
    </div>
  );
}
