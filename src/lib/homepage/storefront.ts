import "server-only";

import { cache } from "react";

import {
  DEFAULTS,
  type BrandPromiseConfig,
  type FooterConfig,
  type LifestyleConfig,
  type MascotsConfig,
  type NewsletterConfig,
  type PromotionsConfig,
  type ResearchTimelineConfig,
  type ScienceConfig,
  type SectionKey,
  type SeoConfig,
  type TestimonialsConfig,
  type TrustStatsConfig,
  REORDERABLE_SECTION_KEYS,
} from "@/lib/admin/homepage-schema";
import { listSevenStorefrontProducts } from "@/lib/catalog/storefront";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { getAnnouncementTickerItems } from "@/lib/brand/announcement-ticker";
import { FEATURED_PRODUCTS, TESTIMONIALS, TRUST_STATS } from "@/lib/data";

import { getHomepage, type Homepage, type HomepageSection } from "./queries";
import { resolveHeroContent, type ResolvedHeroContent } from "./hero-content";

export type StorefrontFeaturedProduct = {
  id: string | number;
  slug?: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  price: string;
  imageUrl?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
};

export type StorefrontTestimonial = {
  name: string;
  city: string;
  rating: number;
  text: string;
  avatarUrl?: string | null;
};

export type StorefrontHomepage = {
  published: boolean;
  seo: SeoConfig;
  footer: FooterConfig;
  announcement: {
    enabled: boolean;
    items: string[];
    background?: string;
    textColor?: string;
    link?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    sticky: boolean;
    startsAt?: string;
    endsAt?: string;
    rotationSpeedMs?: number;
    pauseOnHover?: boolean;
    autoPlay?: boolean;
    maxVisible?: number;
    mobileSwipe?: boolean;
  };
  /** Body sections ordered by CMS position (excludes announcement). */
  sectionOrder: SectionKey[];
  sections: Record<SectionKey, { enabled: boolean }>;
  hero: ResolvedHeroContent;
  brandPromise: BrandPromiseConfig;
  science: ScienceConfig;
  lifestyle: LifestyleConfig;
  mascots: MascotsConfig;
  researchTimeline: ResearchTimelineConfig;
  testimonialsHeading: TestimonialsConfig;
  newsletter: NewsletterConfig;
  promotions: PromotionsConfig;
  trustStats: TrustStatsConfig;
  featuredProducts: StorefrontFeaturedProduct[];
  featuredProductsHeading?: string;
  testimonials: StorefrontTestimonial[];
};

function mergeConfig<T extends object>(fallback: T, value: unknown): T {
  if (!value || typeof value !== "object") return { ...fallback };
  return { ...fallback, ...(value as Partial<T>) };
}

function findSection(sections: HomepageSection[], key: string) {
  return sections.find((s) => s.key === key);
}

function sectionEnabled(cms: Homepage, key: SectionKey, published: boolean): boolean {
  if (!published) return true;
  const row = findSection(cms.sections, key);
  return row?.isEnabled ?? true;
}

function sectionConfig<T extends object>(
  cms: Homepage,
  key: SectionKey,
  fallback: T,
  published: boolean,
): T {
  if (!published) return fallback;
  const row = findSection(cms.sections, key);
  return mergeConfig(fallback, row?.config);
}

function launchProductBadge(product: StorefrontProduct): string {
  if (product.status === "coming_soon") return "Coming Soon";
  if (product.inStock) return "In Stock";
  return "Out of Stock";
}

function mapLaunchProduct(product: StorefrontProduct): StorefrontFeaturedProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.categoryName ?? "Baby Care",
    badge: launchProductBadge(product),
    description: product.shortDescription ?? "",
    price: `₹${Math.round(product.effectivePrice).toLocaleString("en-IN")}`,
    imageUrl: product.imageUrl,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
  };
}

function mapStaticProducts(): StorefrontFeaturedProduct[] {
  return FEATURED_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    badge: p.badge,
    description: p.description,
    price: p.price,
    imageUrl: p.imageUrl,
    slug: "slug" in p ? p.slug : undefined,
  }));
}

async function resolveProducts(): Promise<StorefrontFeaturedProduct[]> {
  try {
    const launch = await listSevenStorefrontProducts();
    if (launch.length > 0) return launch.map(mapLaunchProduct);
  } catch {
    /* fall through to static launch cards */
  }

  return mapStaticProducts().slice(0, 8);
}

function resolveTestimonials(cms: Homepage, published: boolean): StorefrontTestimonial[] {
  if (published && cms.testimonials.length > 0) {
    return cms.testimonials.map((t) => ({
      name: t.name,
      city: t.city,
      rating: t.rating,
      text: t.text,
      avatarUrl: t.avatarUrl || null,
    }));
  }
  return TESTIMONIALS.map((t) => ({
    ...t,
    avatarUrl: t.avatarUrl ?? null,
  }));
}

function resolveAnnouncement(cms: Homepage, published: boolean) {
  const cfg = sectionConfig(cms, "announcement", DEFAULTS.announcement, published);
  const fromText = cfg.text.trim()
    ? cfg.text.split(/\n|•/).map((s) => s.trim()).filter(Boolean)
    : [];
  const rotating = (cfg.rotating ?? []).map((s) => s.trim()).filter(Boolean);
  const cmsLines = [...fromText, ...rotating];

  return {
    enabled: sectionEnabled(cms, "announcement", published),
    items: [...getAnnouncementTickerItems(cmsLines.length ? cmsLines : undefined)],
    background: cfg.background || undefined,
    textColor: cfg.textColor || undefined,
    link: cfg.link || undefined,
    ctaLabel: cfg.ctaLabel || undefined,
    ctaUrl: cfg.ctaUrl || undefined,
    sticky: cfg.sticky !== false,
    startsAt: cfg.startsAt || undefined,
    endsAt: cfg.endsAt || undefined,
    rotationSpeedMs: cfg.rotationSpeedMs ?? 40000,
    pauseOnHover: cfg.pauseOnHover !== false,
    autoPlay: cfg.autoPlay !== false,
    maxVisible: cfg.maxVisible ?? 1,
    mobileSwipe: cfg.mobileSwipe !== false,
  };
}

function resolveSectionOrder(cms: Homepage, published: boolean): SectionKey[] {
  if (!published) return [...REORDERABLE_SECTION_KEYS];

  const positioned = cms.sections
    .filter((s) => REORDERABLE_SECTION_KEYS.includes(s.key as SectionKey))
    .sort((a, b) => a.position - b.position)
    .map((s) => s.key as SectionKey);

  const missing = REORDERABLE_SECTION_KEYS.filter((k) => !positioned.includes(k));
  return [...positioned, ...missing];
}

function buildFromCms(cms: Homepage): StorefrontHomepage {
  const published = cms.status === "published";

  return {
    published,
    seo: published ? mergeConfig(DEFAULTS.seo, cms.seo) : DEFAULTS.seo,
    footer: published ? mergeConfig(DEFAULTS.footer, cms.footer) : DEFAULTS.footer,
    announcement: resolveAnnouncement(cms, published),
    sectionOrder: resolveSectionOrder(cms, published),
    sections: {
      announcement: { enabled: sectionEnabled(cms, "announcement", published) },
      hero: { enabled: sectionEnabled(cms, "hero", published) },
      promotions: { enabled: sectionEnabled(cms, "promotions", published) },
      featured_products: { enabled: sectionEnabled(cms, "featured_products", published) },
      trust_stats: { enabled: sectionEnabled(cms, "trust_stats", published) },
      brand_promise: { enabled: sectionEnabled(cms, "brand_promise", published) },
      science: { enabled: sectionEnabled(cms, "science", published) },
      lifestyle: { enabled: sectionEnabled(cms, "lifestyle", published) },
      mascots: { enabled: sectionEnabled(cms, "mascots", published) },
      research_timeline: { enabled: sectionEnabled(cms, "research_timeline", published) },
      testimonials: { enabled: sectionEnabled(cms, "testimonials", published) },
      newsletter: { enabled: sectionEnabled(cms, "newsletter", published) },
    },
    hero: resolveHeroContent(cms.hero[0], published),
    brandPromise: sectionConfig(cms, "brand_promise", DEFAULTS.brand_promise, published),
    science: sectionConfig(cms, "science", DEFAULTS.science, published),
    lifestyle: sectionConfig(cms, "lifestyle", DEFAULTS.lifestyle, published),
    mascots: sectionConfig(cms, "mascots", DEFAULTS.mascots, published),
    researchTimeline: sectionConfig(cms, "research_timeline", DEFAULTS.research_timeline, published),
    testimonialsHeading: sectionConfig(cms, "testimonials", DEFAULTS.testimonials, published),
    newsletter: sectionConfig(cms, "newsletter", DEFAULTS.newsletter, published),
    promotions: sectionConfig(cms, "promotions", DEFAULTS.promotions, published),
    trustStats: sectionConfig(cms, "trust_stats", DEFAULTS.trust_stats, published),
    featuredProductsHeading: sectionConfig(
      cms,
      "featured_products",
      DEFAULTS.featured_products,
      published,
    ).heading,
    featuredProducts: mapStaticProducts(),
    testimonials: resolveTestimonials(cms, published),
  };
}

const STATIC_FALLBACK: StorefrontHomepage = {
  published: false,
  seo: DEFAULTS.seo,
  footer: DEFAULTS.footer,
  announcement: {
    enabled: true,
    items: [...getAnnouncementTickerItems()],
    background: undefined,
    textColor: undefined,
    link: undefined,
    sticky: true,
  },
  sectionOrder: [...REORDERABLE_SECTION_KEYS],
  sections: {
    announcement: { enabled: true },
    hero: { enabled: true },
    promotions: { enabled: true },
    featured_products: { enabled: true },
    trust_stats: { enabled: true },
    brand_promise: { enabled: true },
    science: { enabled: true },
    lifestyle: { enabled: true },
    mascots: { enabled: true },
    research_timeline: { enabled: true },
    testimonials: { enabled: true },
    newsletter: { enabled: true },
  },
  hero: resolveHeroContent(undefined, false),
  brandPromise: DEFAULTS.brand_promise,
  science: DEFAULTS.science,
  lifestyle: DEFAULTS.lifestyle,
  mascots: DEFAULTS.mascots,
  researchTimeline: DEFAULTS.research_timeline,
  testimonialsHeading: DEFAULTS.testimonials,
  newsletter: DEFAULTS.newsletter,
  promotions: DEFAULTS.promotions,
  trustStats: DEFAULTS.trust_stats,
  featuredProducts: mapStaticProducts(),
  testimonials: TESTIMONIALS,
};

/** Cached storefront payload — shared by homepage, ticker and footer. */
export const getStorefrontHomepage = cache(async (): Promise<StorefrontHomepage> => {
  try {
    const cms = await getHomepage();
    const base = buildFromCms(cms);
    const featuredProducts = await resolveProducts();
    return { ...base, featuredProducts };
  } catch {
    return STATIC_FALLBACK;
  }
});

export { TRUST_STATS };
