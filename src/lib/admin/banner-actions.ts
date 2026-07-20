"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { BannerInput, BannerStatus } from "./banner-types";
import { validateBannerForPublish } from "./banner-validation";

export interface BannerActionResult {
  ok: boolean;
  error: string | null;
  id?: string;
  warnings?: string[];
}

async function audit(table: string, record: string, action: string, payload?: Json) {
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("log_audit", {
    p_table: table,
    p_record: record,
    p_action: action,
    ...(payload === undefined ? {} : { p_new: payload }),
  });
}

function revalidate() {
  revalidatePath("/admin/banners");
  revalidatePath("/");
  revalidatePath("/products");
}

function toRow(input: BannerInput) {
  return {
    title: input.title?.trim() || null,
    subtitle: input.subtitle?.trim() || null,
    image_url: input.imageUrl?.trim() || null,
    mobile_image_url: input.mobileImageUrl?.trim() || null,
    tablet_image_url: input.tabletImageUrl?.trim() || null,
    video_url: input.videoUrl?.trim() || null,
    media_type: input.mediaType ?? "image",
    link_url: input.linkUrl?.trim() || null,
    cta_label: input.ctaLabel?.trim() || null,
    placement: input.placement?.trim() || "homepage_mid",
    position: input.position ?? 0,
    priority: Math.min(100, Math.max(0, input.priority ?? 50)),
    status: input.status ?? "draft",
    is_active: input.isActive ?? input.status === "published",
    starts_at: input.startsAt || null,
    ends_at: input.endsAt || null,
    alt_text: input.altText?.trim() || null,
    aria_label: input.ariaLabel?.trim() || null,
    campaign_id: input.campaignId || null,
    updated_at: new Date().toISOString(),
  };
}

export async function createBanner(input: BannerInput): Promise<BannerActionResult> {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  const supabase = await createSupabaseServerClient();

  const status = input.status ?? "draft";
  if (status === "published") {
    const v = validateBannerForPublish(input);
    if (!v.ok) return { ok: false, error: v.errors.join(" ") };
  }

  const { data, error } = await supabase
    .from("banners")
    .insert(toRow({ ...input, status }))
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not create banner." };

  await audit("banners", data.id, "create", { title: input.title, status });
  revalidate();
  return { ok: true, error: null, id: data.id };
}

export async function updateBanner(id: string, input: BannerInput): Promise<BannerActionResult> {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  const supabase = await createSupabaseServerClient();

  const status = input.status ?? "draft";
  if (status === "published") {
    const v = validateBannerForPublish(input);
    if (!v.ok) return { ok: false, error: v.errors.join(" ") };
  }

  const { error } = await supabase.from("banners").update(toRow({ ...input, status })).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await audit("banners", id, "update", { title: input.title, status });
  revalidate();
  return { ok: true, error: null, id };
}

export async function setBannerStatus(id: string, status: BannerStatus): Promise<BannerActionResult> {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  const supabase = await createSupabaseServerClient();

  if (status === "published") {
    const { data } = await supabase.from("banners").select("*").eq("id", id).maybeSingle();
    if (!data) return { ok: false, error: "Banner not found." };
    const v = validateBannerForPublish({
      title: data.title ?? "",
      imageUrl: data.image_url ?? "",
      mobileImageUrl: data.mobile_image_url ?? "",
      linkUrl: data.link_url ?? "",
      ctaLabel: data.cta_label ?? "",
      startsAt: data.starts_at,
      endsAt: data.ends_at,
      priority: data.priority ?? 50,
      status,
    });
    if (!v.ok) return { ok: false, error: v.errors.join(" ") };
  }

  const { error } = await supabase
    .from("banners")
    .update({
      status,
      is_active: status === "published",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await audit("banners", id, status === "archived" ? "archive" : status === "published" ? "publish" : "update", {
    status,
  });
  revalidate();
  return { ok: true, error: null, id };
}

export async function duplicateBanner(id: string): Promise<BannerActionResult> {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  const supabase = await createSupabaseServerClient();
  const { data: src, error } = await supabase.from("banners").select("*").eq("id", id).maybeSingle();
  if (error || !src) return { ok: false, error: error?.message ?? "Banner not found." };

  const { data, error: insertError } = await supabase
    .from("banners")
    .insert({
      title: `${src.title ?? "Banner"} (Copy)`,
      subtitle: src.subtitle,
      image_url: src.image_url,
      mobile_image_url: src.mobile_image_url,
      tablet_image_url: src.tablet_image_url,
      video_url: src.video_url,
      media_type: src.media_type ?? "image",
      link_url: src.link_url,
      cta_label: src.cta_label,
      placement: src.placement,
      position: (src.position ?? 0) + 1,
      priority: src.priority ?? 50,
      status: "draft",
      is_active: false,
      starts_at: src.starts_at,
      ends_at: src.ends_at,
      alt_text: src.alt_text,
      aria_label: src.aria_label,
      campaign_id: src.campaign_id,
    })
    .select("id")
    .single();

  if (insertError || !data) return { ok: false, error: insertError?.message ?? "Duplicate failed." };

  await audit("banners", data.id, "duplicate", { sourceId: id });
  revalidate();
  return { ok: true, error: null, id: data.id };
}

export async function softDeleteBanner(id: string): Promise<BannerActionResult> {
  await requirePermission(PERMISSIONS.CONTENT_MANAGE);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("banners")
    .update({ deleted_at: new Date().toISOString(), is_active: false, status: "archived" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await audit("banners", id, "delete", {});
  revalidate();
  return { ok: true, error: null, id };
}
