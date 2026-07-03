import type { PublicReview, ProductReviewSummary } from "@/lib/admin/review-types";

export type QAStatus = "answered" | "pending";
export type QACategory = "usage" | "ingredients" | "shipping" | "safety" | "general";

export const QA_CATEGORY_LABELS: Record<QACategory, string> = {
  usage: "Usage",
  ingredients: "Ingredients",
  shipping: "Shipping",
  safety: "Safety",
  general: "General",
};

export interface ProductAnswer {
  id: string;
  body: string;
  authorName: string;
  authorRole?: "parent" | "brand" | "expert";
  isPinned: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface ProductQuestion {
  id: string;
  productId: string;
  question: string;
  category: QACategory;
  status: QAStatus;
  askedBy: string;
  createdAt: string;
  helpfulCount: number;
  answers: ProductAnswer[];
}

export interface GalleryMediaItem {
  id: string;
  type: "photo" | "video";
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  productId?: string;
  productName?: string;
  productSlug?: string;
  reviewId?: string;
  customerName?: string;
}

export interface CommunityStory {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  imageUrl?: string;
  href: string;
}

export interface CareTip {
  id: string;
  title: string;
  body: string;
  icon?: string;
}

export interface CommunityHighlightItem {
  id: string;
  title: string;
  description: string;
  stat?: string;
  href?: string;
  icon?: string;
}

export interface EnrichedPublicReview extends PublicReview {
  /** Sample/demo content — never show verified purchase or emit to SEO schema. */
  isSample?: boolean;
  /** Placeholder flag for demo video reviews until backend supports uploads. */
  hasVideo?: boolean;
  videoPlaceholderLabel?: string;
}

export type ReviewSortOption = "newest" | "oldest" | "highest" | "lowest" | "helpful";

export interface ReviewFilters {
  search: string;
  rating: number | "all";
  verifiedOnly: boolean;
  withPhotos: boolean;
}

export interface PaginatedReviews {
  items: EnrichedPublicReview[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export type { PublicReview, ProductReviewSummary };
