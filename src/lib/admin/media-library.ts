import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type MediaListParams,
  type MediaItem,
  type MediaListResult,
  type MediaFolderItem,
} from "./media-types";

// Re-export the client-safe constants/types/helpers for convenience.
export * from "./media-types";

function mapRow(r: {
  id: string;
  folder_id: string | null;
  bucket: string;
  path: string;
  url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  original_name: string | null;
  width: number | null;
  height: number | null;
  blur_data_url: string | null;
  alt: string | null;
  created_at: string;
  updated_at: string;
}): MediaItem {
  return {
    id: r.id,
    folderId: r.folder_id,
    bucket: r.bucket,
    path: r.path,
    url: r.url,
    mimeType: r.mime_type,
    sizeBytes: r.size_bytes,
    originalName: r.original_name,
    width: r.width,
    height: r.height,
    blurDataUrl: r.blur_data_url,
    alt: r.alt,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listMediaFolders(): Promise<MediaFolderItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("media_folders")
    .select("id,name,slug,bucket,path_prefix,icon,is_system,position")
    .order("is_system", { ascending: false })
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  return (data ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    bucket: f.bucket,
    pathPrefix: f.path_prefix,
    icon: f.icon,
    isSystem: f.is_system,
    position: f.position,
  }));
}

export async function getMediaFolder(id: string): Promise<MediaFolderItem | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("media_folders")
    .select("id,name,slug,bucket,path_prefix,icon,is_system,position")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    bucket: data.bucket,
    pathPrefix: data.path_prefix,
    icon: data.icon,
    isSystem: data.is_system,
    position: data.position,
  };
}

export async function listMedia(params: MediaListParams): Promise<MediaListResult> {
  const supabase = await createSupabaseServerClient();

  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(120, Math.max(6, params.perPage ?? 24));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("media_library")
    .select(
      "id,folder_id,bucket,path,url,mime_type,size_bytes,original_name,width,height,blur_data_url,alt,created_at,updated_at",
      { count: "exact" },
    );

  if (params.search && params.search.trim()) {
    const q = params.search.trim().replace(/[%,]/g, "");
    query = query.or(`original_name.ilike.%${q}%,path.ilike.%${q}%`);
  }
  if (params.bucket && params.bucket !== "all") query = query.eq("bucket", params.bucket);
  if (params.folderId) query = query.eq("folder_id", params.folderId);
  if (params.pathPrefix) query = query.ilike("path", `${params.pathPrefix}%`);
  if (params.productId) query = query.ilike("path", `${params.productId}/%`);
  if (params.minWidth) query = query.gte("width", params.minWidth);
  if (params.minSizeBytes) query = query.gte("size_bytes", params.minSizeBytes);
  if (params.maxSizeBytes) query = query.lte("size_bytes", params.maxSizeBytes);

  switch (params.type) {
    case "image":
      query = query.ilike("mime_type", "image/%");
      break;
    case "video":
      query = query.ilike("mime_type", "video/%");
      break;
    case "pdf":
      query = query.eq("mime_type", "application/pdf");
      break;
    case "other":
      query = query
        .not("mime_type", "ilike", "image/%")
        .not("mime_type", "ilike", "video/%")
        .neq("mime_type", "application/pdf");
      break;
    default:
      break;
  }

  switch (params.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "largest":
      query = query.order("size_bytes", { ascending: false, nullsFirst: false });
      break;
    case "smallest":
      query = query.order("size_bytes", { ascending: true, nullsFirst: false });
      break;
    case "name":
      query = query.order("original_name", { ascending: true, nullsFirst: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []).map(mapRow);
  const total = count ?? 0;
  return { rows, total, page, perPage, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getMediaItem(id: string): Promise<MediaItem | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("media_library")
    .select(
      "id,folder_id,bucket,path,url,mime_type,size_bytes,original_name,width,height,blur_data_url,alt,created_at,updated_at",
    )
    .eq("id", id)
    .maybeSingle();
  return data ? mapRow(data) : null;
}

/** Custom (non-system) folders only — used for move/assign targets. */
export async function listCustomFolders(): Promise<MediaFolderItem[]> {
  const all = await listMediaFolders();
  return all.filter((f) => !f.isSystem);
}
