"use server";

import { revalidatePath } from "next/cache";

import { revalidateStorefrontPages } from "@/lib/admin/storefront-revalidate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listMedia } from "./media-library";
import type { Json } from "@/lib/supabase/database.types";
import type { PublishStatus, SectionKey, SettingsKey } from "./homepage-schema";

export interface ActionResult {
  ok: boolean;
  error: string | null;
  id?: string;
}

async function guard() {
  await requirePermission(PERMISSIONS.CMS_MANAGE);
}

function revalidate() {
  revalidatePath("/admin/homepage");
  revalidateStorefrontPages();
}

// ----------------------------- Settings -----------------------------

export async function saveSettings(key: SettingsKey, value: Record<string, unknown>): Promise<ActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("homepage_settings")
    .upsert({ key, value: value as Json, updated_at: new Date().toISOString() }, { onConflict: "key" })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not save settings." };

  await supabase.rpc("log_audit", {
    p_table: "homepage_settings",
    p_record: data.id,
    p_action: "update",
    p_new: { key },
  });

  revalidate();
  return { ok: true, error: null, id: data.id };
}

// ----------------------------- Sections -----------------------------

export async function saveSection(
  key: SectionKey,
  payload: { isEnabled: boolean; config: Record<string, unknown> },
): Promise<ActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("homepage_sections")
    .update({
      is_enabled: payload.isEnabled,
      config: payload.config as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key)
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not save section." };

  await supabase.rpc("log_audit", {
    p_table: "homepage_sections",
    p_record: data.id,
    p_action: "update",
    p_new: { key, enabled: payload.isEnabled },
  });

  revalidate();
  return { ok: true, error: null, id: data.id };
}

// ----------------------------- Publishing -----------------------------

export async function setHomepageStatus(status: PublishStatus): Promise<ActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("homepage_settings")
    .upsert({ key: "publish", value: { status } as Json, updated_at: new Date().toISOString() }, { onConflict: "key" })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not update status." };

  await supabase.rpc("log_audit", {
    p_table: "homepage_settings",
    p_record: data.id,
    p_action: "update",
    p_new: { publish: status },
  });

  revalidate();
  return { ok: true, error: null };
}

// ----------------------------- Hero slides -----------------------------

export interface HeroSlideInput {
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
  isActive: boolean;
}

function heroRow(input: HeroSlideInput) {
  return {
    title: input.title || null,
    subtitle: input.subtitle || null,
    description: input.description || null,
    image_url: input.imageUrl || null,
    background_url: input.backgroundUrl || null,
    overlay: Math.min(100, Math.max(0, Math.round(input.overlay || 0))),
    cta_label: input.ctaLabel || null,
    cta_url: input.ctaUrl || null,
    secondary_cta_label: input.secondaryCtaLabel || null,
    secondary_cta_url: input.secondaryCtaUrl || null,
    is_active: input.isActive,
  };
}

export async function createHeroSlide(): Promise<ActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();

  const { data: last } = await supabase
    .from("hero_slides")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("hero_slides")
    .insert({ title: "New slide", position: (last?.position ?? 0) + 1, is_active: true })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not create slide." };

  await supabase.rpc("log_audit", { p_table: "hero_slides", p_record: data.id, p_action: "insert" });
  revalidate();
  return { ok: true, error: null, id: data.id };
}

export async function updateHeroSlide(id: string, input: HeroSlideInput): Promise<ActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("hero_slides")
    .update({ ...heroRow(input), updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await supabase.rpc("log_audit", { p_table: "hero_slides", p_record: id, p_action: "update" });
  revalidate();
  return { ok: true, error: null };
}

export async function deleteHeroSlide(id: string): Promise<ActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("hero_slides").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await supabase.rpc("log_audit", { p_table: "hero_slides", p_record: id, p_action: "delete" });
  revalidate();
  return { ok: true, error: null };
}

export async function reorderHeroSlides(orderedIds: string[]): Promise<ActionResult> {
  await guard();
  if (!orderedIds.length) return { ok: true, error: null };
  const supabase = await createSupabaseServerClient();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("hero_slides").update({ position: index + 1 }).eq("id", id),
    ),
  );

  await supabase.rpc("log_audit", {
    p_table: "hero_slides",
    p_record: orderedIds[0],
    p_action: "update",
    p_new: { reordered: orderedIds.length },
  });
  revalidate();
  return { ok: true, error: null };
}

// ----------------------------- Testimonials -----------------------------

export interface TestimonialInput {
  name: string;
  city: string;
  rating: number;
  text: string;
  avatarUrl: string;
  isPublished: boolean;
}

function testimonialRow(input: TestimonialInput) {
  return {
    name: input.name,
    city: input.city || null,
    rating: Math.min(5, Math.max(1, Math.round(input.rating || 5))),
    text: input.text,
    avatar_url: input.avatarUrl || null,
    is_published: input.isPublished,
  };
}

export async function createTestimonial(input: TestimonialInput): Promise<ActionResult> {
  await guard();
  if (!input.name.trim() || !input.text.trim())
    return { ok: false, error: "Name and testimonial text are required." };
  const supabase = await createSupabaseServerClient();

  const { data: last } = await supabase
    .from("testimonials")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("testimonials")
    .insert({ ...testimonialRow(input), position: (last?.position ?? 0) + 1 })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not create testimonial." };

  await supabase.rpc("log_audit", { p_table: "testimonials", p_record: data.id, p_action: "insert" });
  revalidate();
  return { ok: true, error: null, id: data.id };
}

export async function updateTestimonial(id: string, input: TestimonialInput): Promise<ActionResult> {
  await guard();
  if (!input.name.trim() || !input.text.trim())
    return { ok: false, error: "Name and testimonial text are required." };
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("testimonials")
    .update({ ...testimonialRow(input), updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await supabase.rpc("log_audit", { p_table: "testimonials", p_record: id, p_action: "update" });
  revalidate();
  return { ok: true, error: null };
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await supabase.rpc("log_audit", { p_table: "testimonials", p_record: id, p_action: "delete" });
  revalidate();
  return { ok: true, error: null };
}

export async function toggleTestimonialPublished(id: string, isPublished: boolean): Promise<ActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("testimonials")
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await supabase.rpc("log_audit", {
    p_table: "testimonials",
    p_record: id,
    p_action: "update",
    p_new: { published: isPublished },
  });
  revalidate();
  return { ok: true, error: null };
}

export async function reorderTestimonials(orderedIds: string[]): Promise<ActionResult> {
  await guard();
  if (!orderedIds.length) return { ok: true, error: null };
  const supabase = await createSupabaseServerClient();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("testimonials").update({ position: index + 1 }).eq("id", id),
    ),
  );

  await supabase.rpc("log_audit", {
    p_table: "testimonials",
    p_record: orderedIds[0],
    p_action: "update",
    p_new: { reordered: orderedIds.length },
  });
  revalidate();
  return { ok: true, error: null };
}

// ----------------------- Media picker (reuse Media Library) -----------------------

export interface PickerAsset {
  id: string;
  url: string;
  name: string;
}

/** Read-only search over the existing Media Library — no uploads here. */
export async function searchMediaImages(query: string): Promise<PickerAsset[]> {
  await guard();
  const { rows } = await listMedia({ search: query, type: "image", sort: "newest", perPage: 60 });
  return rows
    .filter((r) => Boolean(r.url))
    .map((r) => ({ id: r.id, url: r.url as string, name: r.originalName ?? r.path }));
}
