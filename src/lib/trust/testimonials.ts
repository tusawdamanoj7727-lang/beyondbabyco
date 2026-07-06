import { testimonialPortrait } from "@/lib/brand/generated-assets";
import type { EnrichedPublicReview } from "@/lib/reviews/types";
import type { StorefrontTestimonial } from "@/lib/homepage/storefront";

export type TestimonialCategory = "parent" | "mother" | "father" | "doctor";

export type TrustTestimonial = {
  id: string;
  name: string;
  city: string;
  rating: number;
  text: string;
  category: TestimonialCategory;
  role?: string;
  avatarUrl?: string | null;
  photoUrl?: string | null;
  videoUrl?: string | null;
  verifiedPurchase?: boolean;
  featured?: boolean;
  date?: string;
  productUsed?: string;
  babyAge?: string;
};

function portrait(index: number) {
  return testimonialPortrait(index).url;
}

export const TRUST_TESTIMONIALS: TrustTestimonial[] = [];

export function computeAverageRating(testimonials: TrustTestimonial[]): number {
  if (testimonials.length === 0) return 0;
  const sum = testimonials.reduce((acc, t) => acc + t.rating, 0);
  return Math.round((sum / testimonials.length) * 10) / 10;
}

export function getFeaturedTestimonial(testimonials: TrustTestimonial[]): TrustTestimonial | undefined {
  return testimonials.find((t) => t.featured) ?? testimonials[0];
}

export function mapStorefrontTestimonials(
  items: { name: string; city: string; rating: number; text: string; avatarUrl?: string | null }[],
): TrustTestimonial[] {
  return items.map((t, i) => ({
    id: `cms-${i}`,
    name: t.name,
    city: t.city,
    rating: t.rating,
    text: t.text,
    category: "parent" as const,
    avatarUrl: t.avatarUrl ?? portrait(i),
    verifiedPurchase: false,
  }));
}

export function mapCommunityReviewToTestimonial(
  review: EnrichedPublicReview,
): TrustTestimonial {
  return {
    id: review.id,
    name: review.customerName,
    city: "Verified parent",
    rating: review.rating,
    text: review.body?.trim() || review.title?.trim() || "",
    category: "parent",
    verifiedPurchase: review.verifiedPurchase,
    featured: review.isFeatured,
    date: review.createdAt,
    productUsed: undefined,
  };
}

export function mergeTestimonials(
  cmsItems: StorefrontTestimonial[],
  communityReviews: EnrichedPublicReview[] = [],
): TrustTestimonial[] {
  const fromDb = communityReviews
    .filter((r) => r.body?.trim() || r.title?.trim())
    .map(mapCommunityReviewToTestimonial);
  const fromCms = mapStorefrontTestimonials(cmsItems);
  const seen = new Set<string>();

  return [...fromDb, ...fromCms].filter((item) => {
    if (!item.text.trim()) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
