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

/** Enabled homepage sections, ordered by position. */
export async function getHomepageSections(): Promise<HomepageSection[]> {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase
    .from("homepage_sections")
    .select("key, title, position, is_enabled, config")
    .eq("is_enabled", true)
    .order("position", { ascending: true });

  return (data ?? []).map((r) => ({
    key: r.key,
    title: r.title,
    position: r.position,
    isEnabled: r.is_enabled,
    config: (r.config as Record<string, unknown>) ?? {},
  }));
}

/** Active hero slides, ordered by position. */
export async function getHero(): Promise<HomepageHeroSlide[]> {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true });

  return (data ?? []).map((r) => ({
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
  }));
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
    getHomepageSections(),
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
