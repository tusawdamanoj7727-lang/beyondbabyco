import type { CampaignCenterConfig, MarketingCampaignType } from "./types";
import { DEFAULT_CAMPAIGN_CONFIG } from "./config";

export type FestivalTemplateId =
  | "diwali"
  | "holi"
  | "christmas"
  | "new_year"
  | "mothers_day"
  | "childrens_day"
  | "baby_day"
  | "black_friday"
  | "independence_day"
  | "raksha_bandhan";

export interface FestivalTemplate {
  id: FestivalTemplateId;
  name: string;
  marketingType: MarketingCampaignType;
  headline: string;
  subheading: string;
  description: string;
  ctaLabel: string;
  theme: CampaignCenterConfig["theme"];
  homepageSlot: CampaignCenterConfig["homepageSlot"];
  priority: number;
}

/** Reusable seasonal campaign starters for Campaign Center. */
export const FESTIVAL_TEMPLATES: FestivalTemplate[] = [
  {
    id: "diwali",
    name: "Diwali",
    marketingType: "festival",
    headline: "Light up gentle care this Diwali",
    subheading: "Festive gift sets for little ones",
    description: "Celebrate Diwali with research-backed baby care bundles and free gift wrapping.",
    ctaLabel: "Shop Diwali gifts",
    theme: { primary: "#7c2d12", background: "#fff7ed", accent: "#ea580c" },
    homepageSlot: "homepage_hero",
    priority: 90,
  },
  {
    id: "holi",
    name: "Holi",
    marketingType: "festival",
    headline: "Gentle skin care for colourful days",
    subheading: "Post-Holi soothing essentials",
    description: "Keep baby skin calm after Holi with mild cleansers and barrier-supporting care.",
    ctaLabel: "Shop Holi care",
    theme: { primary: "#5b21b6", background: "#f5f3ff", accent: "#db2777" },
    homepageSlot: "announcement_bar",
    priority: 85,
  },
  {
    id: "raksha_bandhan",
    name: "Raksha Bandhan",
    marketingType: "festival",
    headline: "Gift gentle care this Rakhi",
    subheading: "Curated bundles for siblings & new parents",
    description: "Celebrate Rakhi with premium baby care gift sets.",
    ctaLabel: "Shop gift bundles",
    theme: { primary: "#7c2d12", background: "#fff7ed", accent: "#ea580c" },
    homepageSlot: "announcement_bar",
    priority: 88,
  },
  {
    id: "christmas",
    name: "Christmas",
    marketingType: "festival",
    headline: "Warm wishes, gentle care",
    subheading: "Holiday gift boxes for baby",
    description: "Thoughtful Christmas gift sets with free personalised notes.",
    ctaLabel: "Explore holiday gifts",
    theme: { primary: "#14532d", background: "#ecfdf5", accent: "#b91c1c" },
    homepageSlot: "homepage_banner",
    priority: 86,
  },
  {
    id: "new_year",
    name: "New Year",
    marketingType: "seasonal",
    headline: "New year, softer routines",
    subheading: "Start fresh with gentle essentials",
    description: "Reset the nursery routine with dermatologist-tested formulas.",
    ctaLabel: "Shop new year picks",
    theme: { primary: "#1e3a5f", background: "#eff6ff", accent: "#c45c3e" },
    homepageSlot: "popup_banner",
    priority: 80,
  },
  {
    id: "mothers_day",
    name: "Mother's Day",
    marketingType: "festival",
    headline: "For the hands that care",
    subheading: "Gifts that feel like gratitude",
    description: "Celebrate mothers with soft, research-led baby care collections.",
    ctaLabel: "Shop Mother's Day",
    theme: { primary: "#9f1239", background: "#fff1f2", accent: "#e11d48" },
    homepageSlot: "campaign_cards",
    priority: 84,
  },
  {
    id: "childrens_day",
    name: "Children's Day",
    marketingType: "festival",
    headline: "Made for little celebrations",
    subheading: "Everyday care, festive joy",
    description: "Celebrate Children's Day with bestsellers parents already trust.",
    ctaLabel: "Shop Children's Day",
    theme: { primary: "#1a4d2e", background: "#e8f4ec", accent: "#c45c3e" },
    homepageSlot: "homepage_banner",
    priority: 82,
  },
  {
    id: "baby_day",
    name: "Baby Day",
    marketingType: "product_launch",
    headline: "Because every baby deserves the safest touch",
    subheading: "Our full gentle-care lineup",
    description: "Discover formulas developed through years of research for Indian families.",
    ctaLabel: "Explore collection",
    theme: { primary: "#1a4d2e", background: "#faf7f2", accent: "#c45c3e" },
    homepageSlot: "homepage_hero",
    priority: 92,
  },
  {
    id: "black_friday",
    name: "Black Friday",
    marketingType: "flash_sale",
    headline: "Limited-time gentle care savings",
    subheading: "Sitewide offers for a short window",
    description: "Black Friday deals on bestsellers — while stocks last.",
    ctaLabel: "Shop the sale",
    theme: { primary: "#111827", background: "#f3f4f6", accent: "#dc2626" },
    homepageSlot: "popup_banner",
    priority: 95,
  },
  {
    id: "independence_day",
    name: "Independence Day",
    marketingType: "festival",
    headline: "Proudly made in India",
    subheading: "Research-backed care for every family",
    description: "Celebrate with Made-in-India formulas parents can trust.",
    ctaLabel: "Shop Made in India",
    theme: { primary: "#14532d", background: "#fff7ed", accent: "#ea580c" },
    homepageSlot: "announcement_bar",
    priority: 83,
  },
];

export function applyFestivalTemplate(
  templateId: FestivalTemplateId,
  base: CampaignCenterConfig = DEFAULT_CAMPAIGN_CONFIG(),
): CampaignCenterConfig {
  const template = FESTIVAL_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return base;

  return {
    ...base,
    marketingType: template.marketingType,
    headline: template.headline,
    subheading: template.subheading,
    description: template.description,
    cta: { label: template.ctaLabel, url: base.cta.url || "/products" },
    targetUrl: base.targetUrl || "/products",
    theme: { ...template.theme },
    homepageSlot: template.homepageSlot,
    priority: template.priority,
    slug: base.slug || template.id,
  };
}
