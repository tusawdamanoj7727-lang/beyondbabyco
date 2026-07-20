/**
 * Banner Manager — client-safe types & constants.
 */

export const BANNER_STATUSES = ["draft", "published", "archived"] as const;
export type BannerStatus = (typeof BANNER_STATUSES)[number];

export const BANNER_STATUS_LABELS: Record<BannerStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const BANNER_MEDIA_TYPES = ["image", "video", "gif"] as const;
export type BannerMediaType = (typeof BANNER_MEDIA_TYPES)[number];

export const BANNER_PLACEMENTS = [
  "homepage_hero",
  "homepage_mid",
  "homepage_footer",
  "category",
  "cart",
  "checkout",
  "announcement",
] as const;
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];

export const BANNER_PLACEMENT_LABELS: Record<BannerPlacement, string> = {
  homepage_hero: "Homepage Hero",
  homepage_mid: "Homepage Mid",
  homepage_footer: "Homepage Footer",
  category: "Category",
  cart: "Cart",
  checkout: "Checkout",
  announcement: "Announcement",
};

export interface BannerListItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  mobileImageUrl: string;
  tabletImageUrl: string;
  videoUrl: string;
  mediaType: BannerMediaType;
  linkUrl: string;
  ctaLabel: string;
  placement: string;
  position: number;
  priority: number;
  status: BannerStatus;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  altText: string;
  ariaLabel: string;
  campaignId: string | null;
  updatedAt: string;
}

export interface BannerDashboard {
  total: number;
  published: number;
  draft: number;
  archived: number;
  scheduled: number;
}

export interface BannerInput {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  tabletImageUrl?: string;
  videoUrl?: string;
  mediaType?: BannerMediaType;
  linkUrl?: string;
  ctaLabel?: string;
  placement?: string;
  position?: number;
  priority?: number;
  status?: BannerStatus;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  altText?: string;
  ariaLabel?: string;
  campaignId?: string | null;
}
