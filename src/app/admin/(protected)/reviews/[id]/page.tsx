import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getReviewDetail, getReviewTimeline } from "@/lib/admin/reviews";
import ReviewDetailClient from "./ReviewDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const review = await getReviewDetail(id);
  return { title: review?.title ? `Review: ${review.title}` : "Review" };
}

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(PERMISSIONS.REVIEWS_MANAGE);
  const { id } = await params;

  const review = await getReviewDetail(id);
  if (!review) notFound();

  const timeline = await getReviewTimeline(id);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Reviews" title={review.title ?? "Product review"} description={`${review.rating}★ · ${review.product.name}`} />
      <ReviewDetailClient review={review} timeline={timeline} />
    </div>
  );
}
