import type { ProductReviewSummary } from "@/lib/admin/review-types";

import type {
  EnrichedPublicReview,
  PaginatedReviews,
  ProductQuestion,
  QACategory,
  ReviewFilters,
  ReviewSortOption,
} from "./types";

export function computeReviewSummary(reviews: EnrichedPublicReview[]): ProductReviewSummary {
  const distribution: ProductReviewSummary["ratingDistribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const key = Math.max(1, Math.min(5, r.rating)) as 1 | 2 | 3 | 4 | 5;
    distribution[key] += 1;
  }
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  return {
    averageRating: Math.round(avg * 10) / 10,
    reviewCount: count,
    ratingDistribution: distribution,
  };
}

export function aggregateProsCons(reviews: EnrichedPublicReview[]): { pros: string[]; cons: string[] } {
  const pros = new Set<string>();
  const cons = new Set<string>();
  for (const r of reviews) {
    if (r.pros) {
      for (const line of r.pros.split(/[,;|\n]+/).map((s) => s.trim()).filter(Boolean)) {
        pros.add(line);
      }
    }
    if (r.cons) {
      for (const line of r.cons.split(/[,;|\n]+/).map((s) => s.trim()).filter(Boolean)) {
        cons.add(line);
      }
    }
  }
  return { pros: [...pros].slice(0, 6), cons: [...cons].slice(0, 6) };
}

export function filterReviews(reviews: EnrichedPublicReview[], filters: ReviewFilters): EnrichedPublicReview[] {
  const q = filters.search.trim().toLowerCase();
  return reviews.filter((r) => {
    if (filters.rating !== "all" && r.rating !== filters.rating) return false;
    if (filters.verifiedOnly && !r.verifiedPurchase) return false;
    if (filters.withPhotos && r.imageUrls.length === 0 && !r.hasVideo) return false;
    if (!q) return true;
    const haystack = [r.title, r.body, r.pros, r.cons, r.customerName].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

export function sortReviews(reviews: EnrichedPublicReview[], sort: ReviewSortOption): EnrichedPublicReview[] {
  const copy = [...reviews];
  switch (sort) {
    case "oldest":
      return copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case "highest":
      return copy.sort((a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt));
    case "lowest":
      return copy.sort((a, b) => a.rating - b.rating || b.createdAt.localeCompare(a.createdAt));
    case "helpful":
      return copy.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.createdAt.localeCompare(a.createdAt));
    case "newest":
    default:
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export function paginateReviews(
  reviews: EnrichedPublicReview[],
  page: number,
  pageSize: number,
): PaginatedReviews {
  const total = reviews.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    items: reviews.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    pageCount,
  };
}

export function filterQuestions(
  questions: ProductQuestion[],
  opts: { search?: string; category?: QACategory | "all" },
): ProductQuestion[] {
  const q = opts.search?.trim().toLowerCase() ?? "";
  return questions.filter((item) => {
    if (opts.category && opts.category !== "all" && item.category !== opts.category) return false;
    if (!q) return true;
    const haystack = [
      item.question,
      item.askedBy,
      ...item.answers.map((a) => `${a.body} ${a.authorName}`),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function formatReviewDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}
