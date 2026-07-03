/**
 * Client-safe constants, types and helpers for the reviews module.
 */

export const REVIEW_STATUSES = ["pending", "approved", "rejected", "hidden", "spam"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  hidden: "Hidden",
  spam: "Spam",
};

export const REVIEW_SORTABLE_COLUMNS = ["rating", "created_at", "updated_at", "product", "customer"] as const;
export type ReviewSortColumn = (typeof REVIEW_SORTABLE_COLUMNS)[number];

export interface ReviewListItem {
  id: string;
  rating: number;
  productId: string;
  productName: string;
  productSku: string | null;
  customerId: string | null;
  customerName: string;
  verifiedPurchase: boolean;
  status: ReviewStatus;
  isFeatured: boolean;
  imageCount: number;
  title: string | null;
  createdAt: string;
}

export interface ReviewDashboard {
  pendingReviews: number;
  approvedReviews: number;
  averageRating: number;
  reviewsThisMonth: number;
  featuredReviews: number;
}

export interface ReviewImageRow {
  id: string;
  url: string;
  createdAt: string;
}

export interface ReviewTimelineEvent {
  id: string;
  type: string;
  message: string;
  metadata: Record<string, unknown>;
  userName: string | null;
  createdAt: string;
}

export interface ReviewDetail {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  pros: string | null;
  cons: string | null;
  status: ReviewStatus;
  isFeatured: boolean;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  internalNotes: string | null;
  moderationReason: string | null;
  moderatorName: string | null;
  customer: {
    id: string | null;
    name: string;
    email: string | null;
    avatarUrl: string | null;
    segment: string | null;
  };
  product: {
    id: string;
    name: string;
    sku: string | null;
    slug: string;
    thumbnailUrl: string | null;
  };
  order: {
    id: string;
    orderNumber: string;
    purchaseDate: string;
  } | null;
  images: ReviewImageRow[];
}

/** Storefront-facing review summary for a product. */
export interface ProductReviewSummary {
  averageRating: number;
  reviewCount: number;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface PublicReview {
  id: string;
  productId: string;
  rating: number;
  title: string | null;
  body: string | null;
  pros: string | null;
  cons: string | null;
  customerName: string;
  verifiedPurchase: boolean;
  isFeatured: boolean;
  imageUrls: string[];
  createdAt: string;
}

export function starsLabel(rating: number): string {
  return "★".repeat(Math.max(1, Math.min(5, rating))) + "☆".repeat(5 - Math.max(1, Math.min(5, rating)));
}
