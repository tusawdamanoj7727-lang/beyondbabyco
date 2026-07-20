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
  type PromotionsConfig,
  type PublishStatus,
  type ResearchTimelineConfig,
  type ScienceConfig,
  type SectionKey,
  type SeoConfig,
  type TestimonialsConfig,
  type TrustStatsConfig,
  REORDERABLE_SECTION_KEYS,
  SECTION_LABELS,
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
  mobileImageUrl: string;
  videoUrl: string;
  startsAt: string;
  endsAt: string;
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

export interface SectionLayoutItem {
  key: SectionKey;
  label: string;
  position: number;
  isEnabled: boolean;
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
    promotions: SectionState<PromotionsConfig>;
    featured_products: SectionState<FeaturedProductsConfig>;
    trust_stats: SectionState<TrustStatsConfig>;
    brand_promise: SectionState<BrandPromiseConfig>;
    science: SectionState<ScienceConfig>;
    lifestyle: SectionState<LifestyleConfig>;
    mascots: SectionState<MascotsConfig>;
    research_timeline: SectionState<ResearchTimelineConfig>;
    testimonials: SectionState<TestimonialsConfig>;
    newsletter: SectionState<NewsletterConfig>;
  };
  sectionLayout: SectionLayoutItem[];
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
      promotions: section("promotions", DEFAULTS.promotions),
      featured_products: section("featured_products", DEFAULTS.featured_products),
      trust_stats: section("trust_stats", DEFAULTS.trust_stats),
      brand_promise: section("brand_promise", DEFAULTS.brand_promise),
      science: section("science", DEFAULTS.science),
      lifestyle: section("lifestyle", DEFAULTS.lifestyle),
      mascots: section("mascots", DEFAULTS.mascots),
      research_timeline: section("research_timeline", DEFAULTS.research_timeline),
      testimonials: section("testimonials", DEFAULTS.testimonials),
      newsletter: section("newsletter", DEFAULTS.newsletter),
    },
    sectionLayout: (() => {
      const rows = sectionsRes.data ?? [];
      const byKey = new Map(rows.map((r) => [r.key, r]));
      const ordered = [...REORDERABLE_SECTION_KEYS]
        .map((key) => {
          const row = byKey.get(key);
          return {
            key,
            label: SECTION_LABELS[key],
            position: row?.position ?? 99,
            isEnabled: row?.is_enabled ?? true,
          };
        })
        .sort((a, b) => a.position - b.position);
      return ordered;
    })(),
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
      mobileImageUrl: (r as { mobile_image_url?: string | null }).mobile_image_url ?? "",
      videoUrl: (r as { video_url?: string | null }).video_url ?? "",
      startsAt: (r as { starts_at?: string | null }).starts_at ?? "",
      endsAt: (r as { ends_at?: string | null }).ends_at ?? "",
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
