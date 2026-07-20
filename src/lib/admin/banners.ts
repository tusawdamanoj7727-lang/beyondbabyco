import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabasePublicClient } from "@/lib/supabase/public";

import {
  BANNER_STATUSES,
  type BannerDashboard,
  type BannerListItem,
  type BannerMediaType,
  type BannerStatus,
} from "./banner-types";

function mapRow(r: Record<string, unknown>): BannerListItem {
  const statusRaw = String(r.status ?? (r.is_active ? "published" : "draft"));
  const status = (BANNER_STATUSES as readonly string[]).includes(statusRaw)
    ? (statusRaw as BannerStatus)
    : "draft";

  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    subtitle: String(r.subtitle ?? ""),
    imageUrl: String(r.image_url ?? ""),
    mobileImageUrl: String(r.mobile_image_url ?? ""),
    tabletImageUrl: String(r.tablet_image_url ?? ""),
    videoUrl: String(r.video_url ?? ""),
    mediaType: (String(r.media_type ?? "image") as BannerMediaType) || "image",
    linkUrl: String(r.link_url ?? ""),
    ctaLabel: String(r.cta_label ?? ""),
    placement: String(r.placement ?? "homepage_mid"),
    position: Number(r.position ?? 0),
    priority: Number(r.priority ?? 50),
    status,
    isActive: Boolean(r.is_active),
    startsAt: r.starts_at ? String(r.starts_at) : null,
    endsAt: r.ends_at ? String(r.ends_at) : null,
    altText: String(r.alt_text ?? ""),
    ariaLabel: String(r.aria_label ?? ""),
    campaignId: r.campaign_id ? String(r.campaign_id) : null,
    updatedAt: String(r.updated_at ?? ""),
  };
}

export async function listBanners(params?: {
  status?: BannerStatus | "all";
  search?: string;
  trash?: boolean;
}): Promise<{ rows: BannerListItem[]; dashboard: BannerDashboard }> {
  const supabase = await createSupabaseServerClient();

  const buildDashboard = (rows: BannerListItem[]): BannerDashboard => {
    const now = Date.now();
    return {
      total: rows.length,
      published: rows.filter((b) => b.status === "published").length,
      draft: rows.filter((b) => b.status === "draft").length,
      archived: rows.filter((b) => b.status === "archived").length,
      scheduled: rows.filter((b) => {
        if (b.status !== "published" || !b.startsAt) return false;
        return Date.parse(b.startsAt) > now;
      }).length,
    };
  };

  try {
    let query = supabase
      .from("banners")
      .select("*")
      .order("priority", { ascending: false })
      .order("position", { ascending: true });

    if (params?.trash) {
      query = query.not("deleted_at", "is", null);
    } else {
      query = query.is("deleted_at", null);
    }

    if (params?.status && params.status !== "all") {
      query = query.eq("status", params.status);
    }

    if (params?.search?.trim()) {
      query = query.ilike("title", `%${params.search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const rows = (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
    return { rows, dashboard: buildDashboard(rows) };
  } catch {
    // Pre-migration: columns may be missing
    let legacy = supabase.from("banners").select("*").order("position", { ascending: true });
    if (params?.search?.trim()) legacy = legacy.ilike("title", `%${params.search.trim()}%`);
    const { data } = await legacy;
    const rows = (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
    return { rows, dashboard: buildDashboard(rows) };
  }
}

export async function getBanner(id: string): Promise<BannerListItem | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("banners").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

/** Public storefront banners for a placement (published + in schedule). */
export async function getStorefrontBanners(placement?: string): Promise<BannerListItem[]> {
  const supabase = createSupabasePublicClient();
  const now = Date.now();

  const mapAndFilter = (rows: unknown[]) =>
    rows
      .map((r) => mapRow(r as Record<string, unknown>))
      .filter((b) => {
        if (b.status === "archived" || b.status === "draft") return false;
        if (!b.isActive && b.status !== "published") return false;
        if (b.startsAt && Date.parse(b.startsAt) > now) return false;
        if (b.endsAt && Date.parse(b.endsAt) < now) return false;
        return Boolean(b.imageUrl || b.mobileImageUrl || b.videoUrl);
      })
      .sort((a, b) => b.priority - a.priority || a.position - b.position);

  try {
    let query = supabase
      .from("banners")
      .select("*")
      .eq("status", "published")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("priority", { ascending: false })
      .order("position", { ascending: true });

    if (placement) query = query.eq("placement", placement);

    const { data, error } = await query;
    if (!error && data) return mapAndFilter(data);
  } catch {
    /* fall through to legacy query */
  }

  // Pre-migration fallback: is_active only
  let legacy = supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true });
  if (placement) legacy = legacy.eq("placement", placement);
  const { data } = await legacy;
  return mapAndFilter(data ?? []).map((b) => ({ ...b, status: "published" as const }));
}
