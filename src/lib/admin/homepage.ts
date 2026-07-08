import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DEFAULTS,
  type AnnouncementConfig,
  type BrandPromiseConfig,
  type FeaturedProductsConfig,
  type FooterConfig,
  type GeneralConfig,
  type LifestyleConfig,
  type MascotsConfig,
  type NewsletterConfig,
  type PublishStatus,
  type ResearchTimelineConfig,
  type ScienceConfig,
  type SectionKey,
  type SeoConfig,
  type TestimonialsConfig,
} from "./homepage-schema";

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  backgroundUrl: string;
  overlay: number;
  ctaLabel: string;
  ctaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
  position: number;
  isActive: boolean;
}

export interface TestimonialRow {
  id: string;
  name: string;
  city: string;
  rating: number;
  text: string;
  avatarUrl: string;
  isPublished: boolean;
  position: number;
}

export interface SelectOption {
  id: string;
  name: string;
}

export interface SectionState<T> {
  isEnabled: boolean;
  config: T;
}

export interface HomepageAdminData {
  status: PublishStatus;
  settings: {
    general: GeneralConfig;
    seo: SeoConfig;
    footer: FooterConfig;
  };
  sections: {
    announcement: SectionState<AnnouncementConfig>;
    hero: SectionState<Record<string, never>>;
    featured_products: SectionState<FeaturedProductsConfig>;
    brand_promise: SectionState<BrandPromiseConfig>;
    science: SectionState<ScienceConfig>;
    lifestyle: SectionState<LifestyleConfig>;
    mascots: SectionState<MascotsConfig>;
    research_timeline: SectionState<ResearchTimelineConfig>;
    testimonials: SectionState<TestimonialsConfig>;
    newsletter: SectionState<NewsletterConfig>;
  };
  heroSlides: HeroSlide[];
  testimonials: TestimonialRow[];
  options: {
    products: SelectOption[];
  };
}

function merge<T extends object>(fallback: T, value: unknown): T {
  if (!value || typeof value !== "object") return { ...fallback };
  return { ...fallback, ...(value as Partial<T>) };
}

export async function getHomepageAdminData(): Promise<HomepageAdminData> {
  const supabase = await createSupabaseServerClient();

  const [settingsRes, sectionsRes, heroRes, testimonialRes, prodRes] = await Promise.all([
    supabase.from("homepage_settings").select("key, value"),
    supabase.from("homepage_sections").select("key, is_enabled, config, position"),
    supabase
      .from("hero_slides")
      .select("*")
      .order("position", { ascending: true }),
    supabase
      .from("testimonials")
      .select("*")
      .order("position", { ascending: true }),
    supabase
      .from("products")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  const settingsMap = new Map<string, unknown>();
  for (const row of settingsRes.data ?? []) settingsMap.set(row.key, row.value);

  const sectionMap = new Map<string, { is_enabled: boolean; config: unknown }>();
  for (const row of sectionsRes.data ?? [])
    sectionMap.set(row.key, { is_enabled: row.is_enabled, config: row.config });

  const section = <T extends object>(key: SectionKey, fallback: T): SectionState<T> => {
    const row = sectionMap.get(key);
    return {
      isEnabled: row?.is_enabled ?? true,
      config: merge(fallback, row?.config),
    };
  };

  const publish = settingsMap.get("publish") as { status?: PublishStatus } | undefined;

  return {
    status: publish?.status === "published" ? "published" : "draft",
    settings: {
      general: merge(DEFAULTS.general, settingsMap.get("general")),
      seo: merge(DEFAULTS.seo, settingsMap.get("seo")),
      footer: merge(DEFAULTS.footer, settingsMap.get("footer")),
    },
    sections: {
      announcement: section("announcement", DEFAULTS.announcement),
      hero: section("hero", {} as Record<string, never>),
      featured_products: section("featured_products", DEFAULTS.featured_products),
      brand_promise: section("brand_promise", DEFAULTS.brand_promise),
      science: section("science", DEFAULTS.science),
      lifestyle: section("lifestyle", DEFAULTS.lifestyle),
      mascots: section("mascots", DEFAULTS.mascots),
      research_timeline: section("research_timeline", DEFAULTS.research_timeline),
      testimonials: section("testimonials", DEFAULTS.testimonials),
      newsletter: section("newsletter", DEFAULTS.newsletter),
    },
    heroSlides: (heroRes.data ?? []).map((r) => ({
      id: r.id,
      title: r.title ?? "",
      subtitle: r.subtitle ?? "",
      description: r.description ?? "",
      imageUrl: r.image_url ?? "",
      backgroundUrl: r.background_url ?? "",
      overlay: r.overlay ?? 0,
      ctaLabel: r.cta_label ?? "",
      ctaUrl: r.cta_url ?? "",
      secondaryCtaLabel: r.secondary_cta_label ?? "",
      secondaryCtaUrl: r.secondary_cta_url ?? "",
      position: r.position,
      isActive: r.is_active,
    })),
    testimonials: (testimonialRes.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      city: r.city ?? "",
      rating: r.rating,
      text: r.text,
      avatarUrl: r.avatar_url ?? "",
      isPublished: r.is_published,
      position: r.position,
    })),
    options: {
      products: prodRes.data ?? [],
    },
  };
}
