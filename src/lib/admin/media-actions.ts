"use server";

import { randomUUID } from "crypto";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateImageUpload } from "@/lib/media/upload-validation";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { MEDIA_BUCKET, type MediaFolder, type MediaUploadResult } from "./media";

/**
 * Shared media-asset helpers for the catalog taxonomy modules
 * (categories & brands). Assets are stored in the private `media`
 * bucket under module-specific folders and are publicly readable
 * (see migration 008 storage policy).
 */

async function ensureCatalogAccess() {
  await requirePermission(PERMISSIONS.CATALOG_MANAGE);
}

/**
 * Upload a single image to `media/<folder>/<uuid>.<ext>` and return its
 * public URL. The caller stores the URL on the owning record.
 */
export async function uploadMediaAsset(
  folder: MediaFolder,
  formData: FormData,
): Promise<MediaUploadResult> {
  await ensureCatalogAccess();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file provided." };
  }
  const typeError = validateImageUpload(file);
  if (typeError) {
    return { ok: false, error: typeError };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Image must be 5 MB or smaller." };
  }

  const supabase = await createSupabaseServerClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { ok: true, url: pub.publicUrl };
}

/** Best-effort removal of a previously uploaded media asset by its URL. */
export async function deleteMediaAsset(url: string | null): Promise<void> {
  if (!url) return;
  await ensureCatalogAccess();

  const marker = `/${MEDIA_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  if (!path) return;

  const supabase = await createSupabaseServerClient();
  await supabase.storage.from(MEDIA_BUCKET).remove([path]);
}
