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
  | "hero"
  | "announcement"
  | "featured_categories"
  | "featured_products"
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
  { key: "hero", label: "Hero", source: "composite" },
  { key: "announcement", label: "Announcement Bar", source: "section" },
  { key: "featured_categories", label: "Featured Categories", source: "section" },
  { key: "featured_products", label: "Featured Products", source: "section" },
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
  | "featured_categories"
  | "featured_products"
  | "brand_promise"
  | "science"
  | "lifestyle"
  | "mascots"
  | "research_timeline"
  | "testimonials"
  | "newsletter";

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
  text: string;
  link: string;
  background: string;
}

export interface FeaturedCategoriesConfig {
  heading: string;
  limit: number;
  categoryIds: string[];
  /** Asset overrides when categories are not yet in the catalog DB. */
  categoryAssets?: Array<{
    slug: string;
    title: string;
    count?: string;
    iconUrl?: string;
    imageUrl?: string;
    color?: string;
  }>;
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
  announcement: { text: "", link: "", background: "#0f5132" } as AnnouncementConfig,
  featured_categories: { heading: "Shop by Category", limit: 6, categoryIds: [] } as FeaturedCategoriesConfig,
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
