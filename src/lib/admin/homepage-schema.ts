/**
 * Client-safe shapes, defaults and constants for the Homepage CMS.
 * Section content is stored as JSON (homepage_sections.config /
 * homepage_settings.value); these types describe that JSON.
 */

import type { MascotPose, MascotType } from "@/components/mascots/Mascot";
import { EDITORIAL } from "@/lib/brand/generated-assets";

// ----------------------------- Navigation -----------------------------

export type CmsNavKey =
  | "general"
  | "layout"
  | "hero"
  | "announcement"
  | "promotions"
  | "featured_products"
  | "trust_stats"
  | "brand_promise"
  | "science"
  | "lifestyle"
  | "mascots"
  | "research_timeline"
  | "testimonials"
  | "newsletter"
  | "footer"
  | "seo";

export interface CmsNavItem {
  key: CmsNavKey;
  label: string;
  /** Where the data lives. */
  source: "settings" | "section" | "composite";
}

export const CMS_NAV: CmsNavItem[] = [
  { key: "general", label: "General", source: "settings" },
  { key: "layout", label: "Section Order", source: "composite" },
  { key: "hero", label: "Hero", source: "composite" },
  { key: "announcement", label: "Announcement Bar", source: "section" },
  { key: "promotions", label: "Promotional Cards", source: "section" },
  { key: "featured_products", label: "Featured Products", source: "section" },
  { key: "trust_stats", label: "Trust & Social Proof", source: "section" },
  { key: "brand_promise", label: "Brand Promise", source: "section" },
  { key: "science", label: "Science Section", source: "section" },
  { key: "lifestyle", label: "Lifestyle", source: "section" },
  { key: "mascots", label: "Mascots", source: "section" },
  { key: "research_timeline", label: "Research Timeline", source: "section" },
  { key: "testimonials", label: "Testimonials", source: "composite" },
  { key: "newsletter", label: "Newsletter", source: "section" },
  { key: "footer", label: "Footer", source: "settings" },
  { key: "seo", label: "SEO", source: "settings" },
];

/** Section keys backed by homepage_sections rows. */
export type SectionKey =
  | "announcement"
  | "hero"
  | "promotions"
  | "featured_products"
  | "trust_stats"
  | "brand_promise"
  | "science"
  | "lifestyle"
  | "mascots"
  | "research_timeline"
  | "testimonials"
  | "newsletter";

/** Homepage body sections that can be reordered (excludes announcement). */
export const REORDERABLE_SECTION_KEYS: SectionKey[] = [
  "hero",
  "promotions",
  "featured_products",
  "trust_stats",
  "mascots",
  "science",
  "brand_promise",
  "research_timeline",
  "lifestyle",
  "testimonials",
  "newsletter",
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  announcement: "Announcement Bar",
  hero: "Hero",
  promotions: "Promotional Cards",
  featured_products: "Featured Products",
  trust_stats: "Trust & Social Proof",
  brand_promise: "Brand Promise",
  science: "Science Section",
  lifestyle: "Lifestyle",
  mascots: "Mascots",
  research_timeline: "Research Timeline",
  testimonials: "Testimonials",
  newsletter: "Newsletter",
};

export type SettingsKey = "general" | "seo" | "footer";

// ----------------------------- Settings -----------------------------

export interface GeneralConfig {
  websiteName: string;
  tagline: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  ogImage: string;
  favicon: string;
}

export interface SeoConfig {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  schema: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface FooterConfig {
  companyInfo: string;
  email: string;
  phone: string;
  address: string;
  social: SocialLink[];
  copyright: string;
}

// ----------------------------- Sections -----------------------------

export interface AnnouncementConfig {
  /** Primary message — supports emoji. Newlines or • split rotating lines. */
  text: string;
  link: string;
  background: string;
  textColor: string;
  /** Optional CTA button label (shown when ctaUrl is set). */
  ctaLabel: string;
  ctaUrl: string;
  /** Keep bar in fixed header (true) or let it scroll away (false). */
  sticky: boolean;
  /** ISO date — hide before this time when set. */
  startsAt: string;
  /** ISO date — auto-hide after this time when set. */
  endsAt: string;
  /** Extra rotating messages (merged with text lines). */
  rotating: string[];
  /** Rotation / ticker behaviour */
  rotationSpeedMs: number;
  pauseOnHover: boolean;
  autoPlay: boolean;
  maxVisible: number;
  mobileSwipe: boolean;
}

export interface PromoCardItem {
  title: string;
  description: string;
  href: string;
  emoji?: string;
  imageUrl?: string;
}

export interface PromotionsConfig {
  heading: string;
  cards: PromoCardItem[];
}

export interface TrustStatItem {
  value: string;
  label: string;
}

export interface TrustStatsConfig {
  heading: string;
  stats: TrustStatItem[];
}

export interface FeaturedProductsConfig {
  heading: string;
  limit: number;
  productIds: string[];
}

export interface CardItem {
  title: string;
  description: string;
  imageUrl?: string;
}

export interface BrandPromiseConfig {
  heading: string;
  description: string;
  backgroundUrl?: string;
  galleryImages?: string[];
  lifestyleImages?: string[];
  cards: CardItem[];
}

export interface ScienceConfig {
  heading: string;
  description: string;
  imageUrl: string;
  galleryImages?: string[];
  features: CardItem[];
}

export interface LifestyleConfig {
  heading: string;
  description: string;
  imageUrl: string;
  galleryImages?: string[];
  cards: CardItem[];
}

export interface MascotItem {
  mascot: MascotType;
  pose: MascotPose;
  description: string;
  visible: boolean;
}

export interface MascotsConfig {
  heading: string;
  items: MascotItem[];
}

export interface TimelineEntry {
  year: string;
  title: string;
  description: string;
  imageUrl?: string;
}

export interface ResearchTimelineConfig {
  heading: string;
  entries: TimelineEntry[];
}

export interface TestimonialsConfig {
  heading: string;
  description: string;
}

export interface NewsletterConfig {
  heading: string;
  description: string;
  buttonText: string;
  imageUrl?: string;
  artworkUrl?: string;
}

// ----------------------------- Defaults -----------------------------

export const DEFAULTS = {
  general: {
    websiteName: "Beyond Baby Co",
    tagline: "",
    defaultSeoTitle: "",
    defaultSeoDescription: "",
    ogImage: "",
    favicon: "",
  } as GeneralConfig,
  seo: { title: "", description: "", keywords: "", canonical: "", schema: "" } as SeoConfig,
  footer: { companyInfo: "", email: "", phone: "", address: "", social: [], copyright: "" } as FooterConfig,
  announcement: {
    text: "",
    link: "",
    background: "#0f5132",
    textColor: "#faf7f2",
    ctaLabel: "",
    ctaUrl: "",
    sticky: true,
    startsAt: "",
    endsAt: "",
    rotating: [],
    rotationSpeedMs: 40000,
    pauseOnHover: true,
    autoPlay: true,
    maxVisible: 1,
    mobileSwipe: true,
  } as AnnouncementConfig,
  promotions: {
    heading: "Shop by occasion",
    cards: [
      { title: "New Arrival", description: "Fresh formulas just launched", href: "/products?sort=newest", emoji: "✨" },
      { title: "Best Seller", description: "Parents repurchase these most", href: "/products?sort=best_selling", emoji: "⭐" },
      { title: "Limited Offer", description: "Seasonal bundles & gifts", href: "/products", emoji: "🎁" },
      { title: "Doctor Recommended", description: "Formulas parents trust", href: "/research", emoji: "🩺" },
    ],
  } as PromotionsConfig,
  trust_stats: {
    heading: "",
    stats: [
      { value: "2021", label: "Research Started" },
      { value: "5+", label: "Years of R&D" },
      { value: "100%", label: "Natural Ingredients" },
      { value: "0", label: "Harmful Chemicals" },
      { value: "2026", label: "First Launch" },
    ],
  } as TrustStatsConfig,
  featured_products: { heading: "Featured Collection", limit: 8, productIds: [] } as FeaturedProductsConfig,
  brand_promise: { heading: "Our Promise", description: "", cards: [] } as BrandPromiseConfig,
  science: {
    heading: "Gentle Ingredients.\nPowerful Research.",
    description: "",
    imageUrl: EDITORIAL.science.url,
    features: [],
  } as ScienceConfig,
  lifestyle: {
    heading: "Lifestyle",
    description: "",
    imageUrl: EDITORIAL.lifestyleHero.url,
    cards: [],
  } as LifestyleConfig,
  mascots: { heading: "Meet Our Friends", items: [] } as MascotsConfig,
  research_timeline: { heading: "Our Research", entries: [] } as ResearchTimelineConfig,
  testimonials: { heading: "What Parents Say", description: "" } as TestimonialsConfig,
  newsletter: {
    heading: "Join the family",
    description: "",
    buttonText: "Subscribe",
    imageUrl: EDITORIAL.newsletter.url,
    artworkUrl: EDITORIAL.newsletterAlt.url,
  } as NewsletterConfig,
};

// ----------------------------- Mascot options -----------------------------

export const MASCOT_OPTIONS: { value: MascotType; label: string }[] = [
  { value: "bella-bunny", label: "Bella Bunny" },
  { value: "gigi-giraffe", label: "Gigi Giraffe" },
  { value: "poppy-panda", label: "Poppy Panda" },
  { value: "eli-elephant", label: "Eli Elephant" },
  { value: "penny-penguin", label: "Penny Penguin" },
  { value: "freddy-ferret", label: "Freddy Ferret" },
];

export const POSE_OPTIONS: MascotPose[] = [
  "default",
  "default-standing",
  "welcome",
  "wave",
  "peek",
  "reading",
  "hug",
  "sleeping",
  "studying",
  "celebration",
  "hold-heart",
  "hold-product",
];

export type PublishStatus = "draft" | "published";
