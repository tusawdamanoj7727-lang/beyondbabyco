import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProductReviewSummary, PublicReview } from "@/lib/admin/review-types";

function parseApproved(raw: { moderation_status: string | null; is_published: boolean; deleted_at: string | null }) {
  if (raw.deleted_at) return false;
  const s = raw.moderation_status;
  if (s === "approved") return true;
  if (s === "pending" || s === "rejected" || s === "hidden" || s === "spam") return false;
  return raw.is_published;
}

export async function getReviews(opts?: {
  productId?: string;
  featured?: boolean;
  limit?: number;
}): Promise<PublicReview[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("reviews")
    .select("id, product_id, customer_id, rating, title, body, pros, cons, is_verified, is_featured, moderation_status, is_published, deleted_at, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 50);

  if (opts?.productId) query = query.eq("product_id", opts.productId);
  if (opts?.featured) query = query.eq("is_featured", true);

  const { data } = await query;
  const approved = (data ?? []).filter(parseApproved);
  if (!approved.length) return [];

  const reviewIds = approved.map((r) => r.id);
  const customerIds = [...new Set(approved.map((r) => r.customer_id).filter(Boolean))] as string[];

  const [{ data: customers }, { data: images }] = await Promise.all([
    customerIds.length ? supabase.from("customers").select("id, full_name").in("id", customerIds) : Promise.resolve({ data: [] }),
    supabase.from("review_images").select("review_id, url").in("review_id", reviewIds),
  ]);

  const cMap = new Map((customers ?? []).map((c) => [c.id, c.full_name]));
  const imgMap = new Map<string, string[]>();
  for (const img of images ?? []) {
    const list = imgMap.get(img.review_id) ?? [];
    list.push(img.url);
    imgMap.set(img.review_id, list);
  }

  return approved.map((r) => ({
    id: r.id,
    productId: r.product_id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    pros: r.pros,
    cons: r.cons,
    customerName: r.customer_id ? cMap.get(r.customer_id) ?? "Customer" : "Anonymous",
    verifiedPurchase: r.is_verified,
    isFeatured: r.is_featured ?? false,
    imageUrls: imgMap.get(r.id) ?? [],
    createdAt: r.created_at,
  }));
}

export async function getProductReviews(productId: string): Promise<{
  reviews: PublicReview[];
  summary: ProductReviewSummary;
}> {
  const reviews = await getReviews({ productId, limit: 100 });
  const distribution: ProductReviewSummary["ratingDistribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const key = Math.max(1, Math.min(5, r.rating)) as 1 | 2 | 3 | 4 | 5;
    distribution[key] += 1;
  }
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  return {
    reviews,
    summary: {
      averageRating: Math.round(avg * 10) / 10,
      reviewCount: count,
      ratingDistribution: distribution,
    },
  };
}

export async function getFeaturedReviews(limit = 10): Promise<PublicReview[]> {
  return getReviews({ featured: true, limit });
}
