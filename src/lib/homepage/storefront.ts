import "server-only";

import { cache } from "react";

import {
  DEFAULTS,
  type BrandPromiseConfig,
  type FeaturedCategoriesConfig,
  type FooterConfig,
  type LifestyleConfig,
  type MascotsConfig,
  type NewsletterConfig,
  type ResearchTimelineConfig,
  type ScienceConfig,
  type SectionKey,
  type SeoConfig,
  type TestimonialsConfig,
} from "@/lib/admin/homepage-schema";
import {
  getCategoriesByIds,
  getFeaturedCategories,
  getProductsByIds,
  type CategoryNode,
  type PublicProduct,
} from "@/lib/catalog/queries";
import { getAnnouncementTickerItems } from "@/lib/brand/announcement-ticker";
import {
  CATEGORY_ITEMS,
  FEATURED_PRODUCTS,
  TESTIMONIALS,
  TRUST_STATS,
} from "@/lib/data";

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
};

export type StorefrontCategoryItem = {
  title: string;
  count: string;
  icon: string;
  color: string;
  imageUrl?: string;
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
    link?: string;
  };
  sections: Record<SectionKey, { enabled: boolean }>;
  hero: ResolvedHeroContent;
  brandPromise: BrandPromiseConfig;
  science: ScienceConfig;
  lifestyle: LifestyleConfig;
  mascots: MascotsConfig;
  researchTimeline: ResearchTimelineConfig;
  testimonialsHeading: TestimonialsConfig;
  newsletter: NewsletterConfig;
  featuredProducts: StorefrontFeaturedProduct[];
  categories: StorefrontCategoryItem[];
  featuredCategoriesHeading?: string;
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

function formatProductPrice(product: PublicProduct): string {
  if (product.status === "coming_soon") return "Coming Soon";
  const amount = product.salePrice ?? product.price;
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function productBadge(product: PublicProduct): string {
  if (product.status === "coming_soon") return "Coming Soon";
  if (product.isBestSeller) return "Best Seller";
  if (product.isNewArrival) return "New";
  return "Featured";
}

function mapProduct(product: PublicProduct): StorefrontFeaturedProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.categoryName ?? "Baby Care",
    badge: productBadge(product),
    description: product.shortDescription ?? "",
    price: formatProductPrice(product),
    imageUrl: product.imageUrl,
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

function mapCategory(node: CategoryNode, index: number): StorefrontCategoryItem {
  const colors = ["green", "terra", "cream", "green"] as const;
  return {
    title: node.name,
    count: node.description?.trim() || "Explore collection",
    icon: node.icon?.trim() || "✨",
    color: colors[index % colors.length] ?? "green",
  };
}

function mapStaticCategories(): StorefrontCategoryItem[] {
  return CATEGORY_ITEMS.map((c) => ({
    title: c.title,
    count: c.count,
    icon: c.icon,
    color: c.color,
    imageUrl: "imageUrl" in c ? c.imageUrl : undefined,
  }));
}

function mapCategoryAssets(
  assets: FeaturedCategoriesConfig["categoryAssets"],
): StorefrontCategoryItem[] {
  if (!assets?.length) return mapStaticCategories();
  return assets.map((c, index) => {
    const colors = ["green", "terra", "cream", "green"] as const;
    return {
      title: c.title,
      count: c.count?.trim() || "Explore collection",
      icon: c.iconUrl?.trim() || "✨",
      color: c.color ?? colors[index % colors.length] ?? "green",
    };
  });
}

async function resolveProducts(
  cms: Homepage,
  published: boolean,
): Promise<StorefrontFeaturedProduct[]> {
  const cfg = sectionConfig(cms, "featured_products", DEFAULTS.featured_products, published);
  const launchCatalog = mapStaticProducts().slice(0, 8);

  if (published && cfg.productIds.length > 0) {
    try {
      const rows = await getProductsByIds(cfg.productIds.slice(0, 8));
      if (rows.length > 0) return rows.map(mapProduct);
    } catch {
      /* fall through to launch catalog */
    }
  }

  return launchCatalog;
}

async function resolveCategories(
  cms: Homepage,
  published: boolean,
): Promise<StorefrontCategoryItem[]> {
  const cfg = sectionConfig(cms, "featured_categories", DEFAULTS.featured_categories, published);
  if (cfg.categoryAssets?.length) {
    return mapCategoryAssets(cfg.categoryAssets);
  }

  if (!published) return mapStaticCategories();

  try {
    if (cfg.categoryIds.length > 0) {
      const rows = await getCategoriesByIds(cfg.categoryIds.slice(0, cfg.limit));
      if (rows.length > 0) return rows.map(mapCategory);
    }
    const featured = await getFeaturedCategories(cfg.limit);
    if (featured.length > 0) return featured.map(mapCategory);
  } catch {
    /* fall through */
  }
  return mapStaticCategories();
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
  const cmsLines = cfg.text.trim()
    ? cfg.text.split(/\n|•/).map((s) => s.trim()).filter(Boolean)
    : undefined;

  return {
    enabled: sectionEnabled(cms, "announcement", published),
    items: [...getAnnouncementTickerItems(cmsLines)],
    background: cfg.background || undefined,
    link: cfg.link || undefined,
  };
}

function buildFromCms(cms: Homepage): StorefrontHomepage {
  const published = cms.status === "published";

  return {
    published,
    seo: published ? mergeConfig(DEFAULTS.seo, cms.seo) : DEFAULTS.seo,
    footer: published ? mergeConfig(DEFAULTS.footer, cms.footer) : DEFAULTS.footer,
    announcement: resolveAnnouncement(cms, published),
    sections: {
      announcement: { enabled: sectionEnabled(cms, "announcement", published) },
      hero: { enabled: sectionEnabled(cms, "hero", published) },
      featured_categories: { enabled: false },
      featured_products: { enabled: sectionEnabled(cms, "featured_products", published) },
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
    featuredCategoriesHeading: sectionConfig(
      cms,
      "featured_categories",
      DEFAULTS.featured_categories,
      published,
    ).heading,
    featuredProductsHeading: sectionConfig(
      cms,
      "featured_products",
      DEFAULTS.featured_products,
      published,
    ).heading,
    featuredProducts: mapStaticProducts(),
    categories: mapStaticCategories(),
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
    link: undefined,
  },
  sections: {
    announcement: { enabled: true },
    hero: { enabled: true },
    featured_categories: { enabled: false },
    featured_products: { enabled: true },
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
  featuredProducts: mapStaticProducts(),
  categories: mapStaticCategories(),
  testimonials: TESTIMONIALS,
};

/** Cached storefront payload — shared by homepage, ticker and footer. */
export const getStorefrontHomepage = cache(async (): Promise<StorefrontHomepage> => {
  try {
    const cms = await getHomepage();
    const base = buildFromCms(cms);
    const [featuredProducts, categories] = await Promise.all([
      resolveProducts(cms, base.published),
      resolveCategories(cms, base.published),
    ]);
    return { ...base, featuredProducts, categories };
  } catch {
    return STATIC_FALLBACK;
  }
});

export { TRUST_STATS };
