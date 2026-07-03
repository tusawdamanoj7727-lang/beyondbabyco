import type { CampaignStatus } from "@/lib/admin/marketing-types";

/** Marketing campaign categories (stored in buttons JSONB — not DB enum). */
export const MARKETING_CAMPAIGN_TYPES = [
  "product_launch",
  "festival",
  "discount",
  "coupon",
  "bundle",
  "flash_sale",
  "seasonal",
  "newsletter",
  "educational",
  "research",
  "referral",
  "influencer",
] as const;

export type MarketingCampaignType = (typeof MARKETING_CAMPAIGN_TYPES)[number];

export const MARKETING_CAMPAIGN_TYPE_LABELS: Record<MarketingCampaignType, string> = {
  product_launch: "Product Launch",
  festival: "Festival",
  discount: "Discount",
  coupon: "Coupon",
  bundle: "Bundle",
  flash_sale: "Flash Sale",
  seasonal: "Seasonal",
  newsletter: "Newsletter",
  educational: "Educational",
  research: "Research",
  referral: "Referral",
  influencer: "Influencer",
};

export const HOMEPAGE_CAMPAIGN_SLOTS = [
  "homepage_hero",
  "homepage_banner",
  "category_banner",
  "popup_banner",
  "announcement_bar",
  "newsletter_banner",
  "footer_banner",
  "campaign_cards",
] as const;

export type HomepageCampaignSlot = (typeof HOMEPAGE_CAMPAIGN_SLOTS)[number];

export const HOMEPAGE_SLOT_LABELS: Record<HomepageCampaignSlot, string> = {
  homepage_hero: "Homepage Hero",
  homepage_banner: "Homepage Banner",
  category_banner: "Category Banner",
  popup_banner: "Popup Banner",
  announcement_bar: "Announcement Bar",
  newsletter_banner: "Newsletter Banner",
  footer_banner: "Footer Banner",
  campaign_cards: "Campaign Cards",
};

export type CampaignLifecycle = "draft" | "upcoming" | "scheduled" | "active" | "expired";

export interface CampaignTheme {
  primary: string;
  background: string;
  accent?: string;
}

export interface CampaignAssets {
  banner?: string | null;
  hero?: string | null;
  mobileBanner?: string | null;
  background?: string | null;
}

export interface CampaignCta {
  label: string;
  url: string;
}

export interface CampaignMediaAsset {
  id: string;
  url: string;
  role: "banner" | "hero" | "mobile" | "background" | "creative";
  mediaLibraryId?: string | null;
  archived?: boolean;
}

export interface CampaignLandingSections {
  showHero: boolean;
  showProducts: boolean;
  showBenefits: boolean;
  showTrust: boolean;
  showCta: boolean;
  showFaq: boolean;
  showNewsletter: boolean;
  productIds?: string[];
}

export interface CampaignCenterConfig {
  /** Marker for config blob in buttons JSONB */
  _type: "campaign_center";
  slug: string;
  marketingType: MarketingCampaignType;
  headline: string;
  subheading: string;
  description: string;
  cta: CampaignCta;
  targetUrl: string;
  startDate: string | null;
  endDate: string | null;
  priority: number;
  theme: CampaignTheme;
  assets: CampaignAssets;
  homepageSlot: HomepageCampaignSlot | null;
  couponId: string | null;
  landingSlug: string | null;
  landingSections: CampaignLandingSections;
  mediaAssets: CampaignMediaAsset[];
  communicationsTemplateId: string | null;
  aiCreatives: { id: string; format: string; url: string; prompt?: string; createdAt: string }[];
}

export interface CampaignCenterItem {
  id: string;
  name: string;
  channelType: string;
  status: CampaignStatus;
  lifecycle: CampaignLifecycle;
  config: CampaignCenterConfig;
  scheduledAt: string | null;
  segmentName: string | null;
  createdAt: string;
  /** Demo/sample analytics until integrations connect */
  analytics: CampaignAnalyticsPreview;
}

export interface CampaignAnalyticsPreview {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  revenue: number;
  couponUsage: number;
  orders: number;
  traffic: number;
}

export interface CampaignCenterOverview {
  total: number;
  drafts: number;
  upcoming: number;
  scheduled: number;
  active: number;
  expired: number;
  performance: CampaignAnalyticsPreview;
  campaigns: CampaignCenterItem[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string | null;
  type: MarketingCampaignType | "newsletter" | "product_launch" | "festival" | "reminder";
  category: "campaign" | "launch" | "festival" | "newsletter" | "reminder";
  status: CampaignStatus | "planned";
  campaignId?: string;
}

export const AI_CREATIVE_FORMATS = [
  { id: "instagram_post", label: "Instagram Post", width: 1080, height: 1080, preset: "marketing_banner" as const },
  { id: "instagram_story", label: "Instagram Story", width: 1080, height: 1920, preset: "marketing_banner" as const },
  { id: "facebook_banner", label: "Facebook Banner", width: 1200, height: 628, preset: "marketing_banner" as const },
  { id: "google_ads", label: "Google Ads", width: 1200, height: 628, preset: "marketing_banner" as const },
  { id: "email_header", label: "Email Header", width: 600, height: 200, preset: "marketing_banner" as const },
  { id: "whatsapp_banner", label: "WhatsApp Banner", width: 800, height: 800, preset: "marketing_banner" as const },
  { id: "pinterest_pin", label: "Pinterest Pin", width: 1000, height: 1500, preset: "marketing_banner" as const },
  { id: "campaign_hero", label: "Campaign Hero", width: 1920, height: 1080, preset: "hero_background" as const },
  { id: "lifestyle", label: "Marketing Lifestyle", width: 1024, height: 1024, preset: "lifestyle" as const },
] as const;

export type AiCreativeFormatId = (typeof AI_CREATIVE_FORMATS)[number]["id"];

export const MARKETING_MEDIA_FOLDER = "Campaigns";
