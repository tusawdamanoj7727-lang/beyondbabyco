import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Reusable, frontend-facing media queries backed by `media_library`.
 * These will power homepage hero/marketing imagery, mascot assets and any
 * surface that needs to pull curated media by bucket or folder.
 */

export interface MediaAsset {
  id: string;
  url: string | null;
  alt: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  bucket: string;
  path: string;
}

function map(r: {
  id: string;
  url: string | null;
  alt: string | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  blur_data_url: string | null;
  bucket: string;
  path: string;
}): MediaAsset {
  return {
    id: r.id,
    url: r.url,
    alt: r.alt,
    mimeType: r.mime_type,
    width: r.width,
    height: r.height,
    blurDataUrl: r.blur_data_url,
    bucket: r.bucket,
    path: r.path,
  };
}

const SELECT = "id,url,alt,mime_type,width,height,blur_data_url,bucket,path";

/** Generic media fetch with optional bucket / type / limit. */
export async function getMedia(opts: {
  bucket?: string;
  imagesOnly?: boolean;
  limit?: number;
} = {}): Promise<MediaAsset[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("media_library")
    .select(SELECT)
    .order("created_at", { ascending: false });

  if (opts.bucket) query = query.eq("bucket", opts.bucket);
  if (opts.imagesOnly) query = query.ilike("mime_type", "image/%");
  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(map);
}

/** All assets within a folder, by folder id or slug. */
export async function getMediaByFolder(folder: string): Promise<MediaAsset[]> {
  const supabase = await createSupabaseServerClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(folder);

  // Resolve a slug into its folder row (and bucket/prefix for system folders).
  const { data: row } = await supabase
    .from("media_folders")
    .select("id,bucket,path_prefix,is_system")
    .eq(isUuid ? "id" : "slug", folder)
    .maybeSingle();

  if (!row) return [];

  let query = supabase.from("media_library").select(SELECT).order("created_at", { ascending: false });

  if (row.is_system && row.bucket) {
    query = query.eq("bucket", row.bucket);
    if (row.path_prefix) query = query.ilike("path", `${row.path_prefix}%`);
  } else {
    query = query.eq("folder_id", row.id);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(map);
}

/** Homepage CMS imagery (homepage bucket). */
export async function getHomepageAssets(): Promise<MediaAsset[]> {
  return getMedia({ bucket: "homepage" });
}

/** Mascot artwork (mascots bucket). */
export async function getMascotAssets(): Promise<MediaAsset[]> {
  return getMedia({ bucket: "mascots" });
}
