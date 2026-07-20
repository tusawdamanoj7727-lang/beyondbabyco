import "server-only";

import { unstable_cache } from "next/cache";

import { createSupabasePublicClient } from "@/lib/supabase/public";
import { DEFAULTS, type PublishStatus } from "@/lib/admin/homepage-schema";

export interface HomepageSection {
  key: string;
  title: string | null;
  position: number;
  isEnabled: boolean;
  config: Record<string, unknown>;
}

export interface HomepageHeroSlide {
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
  mobileImageUrl?: string;
  videoUrl?: string;
}

export interface HomepageTestimonial {
  id: string;
  name: string;
  city: string;
  rating: number;
  text: string;
  avatarUrl: string;
}

export interface Homepage {
  status: PublishStatus;
  general: typeof DEFAULTS.general;
  seo: typeof DEFAULTS.seo;
  footer: typeof DEFAULTS.footer;
  sections: HomepageSection[];
  hero: HomepageHeroSlide[];
  testimonials: HomepageTestimonial[];
}

function merge<T extends object>(fallback: T, value: unknown): T {
  if (!value || typeof value !== "object") return { ...fallback };
  return { ...fallback, ...(value as Partial<T>) };
}

/** All homepage sections (enabled + disabled), ordered by position. */
export async function getAllHomepageSections(): Promise<HomepageSection[]> {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase
    .from("homepage_sections")
    .select("key, title, position, is_enabled, config")
    .order("position", { ascending: true });

  return (data ?? []).map((r) => ({
    key: r.key,
    title: r.title,
    position: r.position,
    isEnabled: r.is_enabled,
    config: (r.config as Record<string, unknown>) ?? {},
  }));
}

/** Enabled homepage sections, ordered by position. */
export async function getHomepageSections(): Promise<HomepageSection[]> {
  const all = await getAllHomepageSections();
  return all.filter((s) => s.isEnabled);
}

/** Active hero slides within schedule window, ordered by position. */
export async function getHero(): Promise<HomepageHeroSlide[]> {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true });

  const now = Date.now();

  return (data ?? [])
    .filter((r) => {
      const row = r as Record<string, unknown>;
      const startsAt = typeof row.starts_at === "string" ? row.starts_at : null;
      const endsAt = typeof row.ends_at === "string" ? row.ends_at : null;
      if (startsAt) {
        const start = Date.parse(startsAt);
        if (!Number.isNaN(start) && now < start) return false;
      }
      if (endsAt) {
        const end = Date.parse(endsAt);
        if (!Number.isNaN(end) && now > end) return false;
      }
      return true;
    })
    .map((r) => {
      const row = r as Record<string, unknown>;
      return {
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
        mobileImageUrl: typeof row.mobile_image_url === "string" ? row.mobile_image_url : "",
        videoUrl: typeof row.video_url === "string" ? row.video_url : "",
      };
    });
}

/** Published testimonials, ordered by position. */
export async function getHomepageTestimonials(): Promise<HomepageTestimonial[]> {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_published", true)
    .order("position", { ascending: true });

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    city: r.city ?? "",
    rating: r.rating,
    text: r.text,
    avatarUrl: r.avatar_url ?? "",
  }));
}

/** Full homepage payload — settings, sections, hero and testimonials. */
async function fetchHomepage(): Promise<Homepage> {
  const supabase = createSupabasePublicClient();

  const [settingsRes, sections, hero, testimonials] = await Promise.all([
    supabase.from("homepage_settings").select("key, value"),
    getAllHomepageSections(),
    getHero(),
    getHomepageTestimonials(),
  ]);

  const settingsMap = new Map<string, unknown>();
  for (const row of settingsRes.data ?? []) settingsMap.set(row.key, row.value);

  const publish = settingsMap.get("publish") as { status?: PublishStatus } | undefined;

  return {
    status: publish?.status === "published" ? "published" : "draft",
    general: merge(DEFAULTS.general, settingsMap.get("general")),
    seo: merge(DEFAULTS.seo, settingsMap.get("seo")),
    footer: merge(DEFAULTS.footer, settingsMap.get("footer")),
    sections,
    hero,
    testimonials,
  };
}

const getCachedHomepage = unstable_cache(fetchHomepage, ["homepage-cms"], {
  revalidate: 60,
});

export async function getHomepage(): Promise<Homepage> {
  return getCachedHomepage();
}
