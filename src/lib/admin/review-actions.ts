"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import type { Json } from "@/lib/supabase/database.types";
import { featureReviewSchema, bulkReviewIdsSchema } from "./review-schema";
import { resolveVerifiedPurchase } from "./reviews";
import type { ReviewStatus } from "./review-types";

export interface ReviewActionResult {
  ok: boolean;
  error: string | null;
  id?: string;
}

async function guard() {
  await requirePermission(PERMISSIONS.REVIEWS_MANAGE);
}

function revalidate(id?: string) {
  revalidatePath("/admin/reviews");
  if (id) revalidatePath(`/admin/reviews/${id}`);
}

async function logReviewEvent(
  reviewId: string,
  type: string,
  message: string,
  metadata: Record<string, unknown> = {},
) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  await supabase.from("review_events").insert({
    review_id: reviewId,
    type,
    message,
    metadata: metadata as Json,
    created_by: user?.id ?? null,
  });
}

async function setReviewStatus(
  reviewId: string,
  status: ReviewStatus,
  opts?: { reason?: string | null; notes?: string | null },
): Promise<ReviewActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();

  const { data: review } = await supabase
    .from("reviews")
    .select("customer_id, product_id")
    .eq("id", reviewId)
    .maybeSingle();
  if (!review) return { ok: false, error: "Review not found." };

  const verified = await resolveVerifiedPurchase(review.customer_id, review.product_id);

  const { error } = await supabase
    .from("reviews")
    .update({
      moderation_status: status,
      is_published: status === "approved",
      is_verified: verified.verified,
      order_id: verified.orderId,
      moderator_id: user?.id ?? null,
      moderation_reason: opts?.reason ?? null,
      internal_notes: opts?.notes ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId);
  if (error) return { ok: false, error: error.message };

  await logReviewEvent(reviewId, status, `Review ${status}.`, { reason: opts?.reason });
  await supabase.rpc("log_audit", {
    p_table: "reviews",
    p_record: reviewId,
    p_action: status,
    p_new: { status, reason: opts?.reason },
  });

  revalidate(reviewId);
  return { ok: true, error: null, id: reviewId };
}

export async function approveReview(reviewId: string, reason?: string | null): Promise<ReviewActionResult> {
  return setReviewStatus(reviewId, "approved", { reason });
}

export async function rejectReview(reviewId: string, reason?: string | null): Promise<ReviewActionResult> {
  return setReviewStatus(reviewId, "rejected", { reason });
}

export async function hideReview(reviewId: string, reason?: string | null): Promise<ReviewActionResult> {
  return setReviewStatus(reviewId, "hidden", { reason });
}

export async function markReviewSpam(reviewId: string, reason?: string | null): Promise<ReviewActionResult> {
  return setReviewStatus(reviewId, "spam", { reason });
}

export async function restoreReview(reviewId: string): Promise<ReviewActionResult> {
  return setReviewStatus(reviewId, "pending");
}

export async function deleteReview(reviewId: string): Promise<ReviewActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("reviews")
    .update({
      moderation_status: "hidden",
      is_published: false,
      deleted_at: now,
      updated_at: now,
    })
    .eq("id", reviewId);
  if (error) return { ok: false, error: error.message };

  await logReviewEvent(reviewId, "deleted", "Review deleted.");
  await supabase.rpc("log_audit", { p_table: "reviews", p_record: reviewId, p_action: "delete" });

  revalidate();
  return { ok: true, error: null, id: reviewId };
}

export async function featureReview(reviewId: string, featured: boolean): Promise<ReviewActionResult> {
  await guard();
  const parsed = featureReviewSchema.safeParse({ review_id: reviewId, featured });
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("reviews")
    .update({ is_featured: featured, updated_at: new Date().toISOString() })
    .eq("id", reviewId);
  if (error) return { ok: false, error: error.message };

  await logReviewEvent(reviewId, featured ? "featured" : "unfeatured", featured ? "Review featured." : "Review unfeatured.");
  await supabase.rpc("log_audit", {
    p_table: "reviews",
    p_record: reviewId,
    p_action: featured ? "feature" : "unfeature",
    p_new: { is_featured: featured },
  });

  revalidate(reviewId);
  return { ok: true, error: null, id: reviewId };
}

export async function updateReviewNotes(
  reviewId: string,
  internalNotes: string | null,
  reason: string | null,
): Promise<ReviewActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("reviews")
    .update({ internal_notes: internalNotes, moderation_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", reviewId);
  if (error) return { ok: false, error: error.message };

  await logReviewEvent(reviewId, "notes", "Moderation notes updated.");
  revalidate(reviewId);
  return { ok: true, error: null, id: reviewId };
}

export async function deleteReviewImage(imageId: string, reviewId: string): Promise<ReviewActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("review_images").delete().eq("id", imageId);
  if (error) return { ok: false, error: error.message };

  await logReviewEvent(reviewId, "image_deleted", "Review image removed.", { image_id: imageId });
  await supabase.rpc("log_audit", {
    p_table: "review_images",
    p_record: imageId,
    p_action: "delete",
    p_new: { review_id: reviewId },
  });

  revalidate(reviewId);
  return { ok: true, error: null, id: imageId };
}

export async function bulkApproveReviews(ids: string[]): Promise<ReviewActionResult> {
  const parsed = bulkReviewIdsSchema.safeParse({ ids });
  if (!parsed.success) return { ok: false, error: "No reviews selected." };
  for (const id of parsed.data.ids) {
    const res = await approveReview(id);
    if (!res.ok) return res;
  }
  revalidate();
  return { ok: true, error: null };
}

export async function bulkRejectReviews(ids: string[], reason?: string): Promise<ReviewActionResult> {
  const parsed = bulkReviewIdsSchema.safeParse({ ids, reason });
  if (!parsed.success) return { ok: false, error: "No reviews selected." };
  for (const id of parsed.data.ids) {
    const res = await rejectReview(id, reason);
    if (!res.ok) return res;
  }
  revalidate();
  return { ok: true, error: null };
}

export async function bulkHideReviews(ids: string[]): Promise<ReviewActionResult> {
  const parsed = bulkReviewIdsSchema.safeParse({ ids });
  if (!parsed.success) return { ok: false, error: "No reviews selected." };
  for (const id of parsed.data.ids) {
    const res = await hideReview(id);
    if (!res.ok) return res;
  }
  revalidate();
  return { ok: true, error: null };
}

export async function bulkDeleteReviews(ids: string[]): Promise<ReviewActionResult> {
  const parsed = bulkReviewIdsSchema.safeParse({ ids });
  if (!parsed.success) return { ok: false, error: "No reviews selected." };
  for (const id of parsed.data.ids) {
    const res = await deleteReview(id);
    if (!res.ok) return res;
  }
  revalidate();
  return { ok: true, error: null };
}
