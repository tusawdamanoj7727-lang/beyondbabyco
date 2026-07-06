"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedImageType } from "@/lib/media/upload-validation";
import { requirePermission } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { slugify } from "./category-schema";
import { MEDIA_BUCKETS, type MediaBucket } from "./media-types";

export interface MediaActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

async function ensureMediaAccess() {
  await requirePermission(PERMISSIONS.MEDIA_MANAGE);
}

function safeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "file";
}

function num(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// ------------------------------ Upload ------------------------------

export async function uploadMedia(formData: FormData): Promise<MediaActionResult> {
  await ensureMediaAccess();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file provided." };
  }
  if (file.type.startsWith("image/") && !isAllowedImageType(file.type)) {
    return { ok: false, error: "Only JPG, PNG, WebP allowed" };
  }

  const bucket = String(formData.get("bucket") ?? "media") as MediaBucket;
  if (!MEDIA_BUCKETS.includes(bucket)) {
    return { ok: false, error: "Unknown bucket." };
  }
  const folderId = (formData.get("folderId") as string) || null;
  const prefix = (formData.get("pathPrefix") as string) || "";
  const width = num(formData.get("width"));
  const height = num(formData.get("height"));
  const blur = (formData.get("blur") as string) || null;

  const supabase = await createSupabaseServerClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${prefix}${randomUUID()}-${safeName(file.name)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  const user = await getCurrentUser();

  const { data: inserted, error } = await supabase
    .from("media_library")
    .insert({
      folder_id: folderId,
      bucket,
      path,
      url: pub.publicUrl,
      mime_type: file.type || null,
      size_bytes: file.size,
      original_name: file.name,
      width,
      height,
      blur_data_url: blur,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    // Roll back the orphaned storage object on metadata failure.
    await supabase.storage.from(bucket).remove([path]);
    return { ok: false, error: error?.message ?? "Could not save media." };
  }

  await supabase.rpc("log_audit", {
    p_table: "media_library",
    p_record: inserted.id,
    p_action: "insert",
    p_new: { bucket, path, name: file.name },
  });

  revalidatePath("/admin/media");
  return { ok: true, id: inserted.id };
}

// ------------------------------ Rename ------------------------------

export async function renameMedia(id: string, name: string): Promise<MediaActionResult> {
  await ensureMediaAccess();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Name is required." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("media_library")
    .update({ original_name: trimmed })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await supabase.rpc("log_audit", {
    p_table: "media_library",
    p_record: id,
    p_action: "rename",
    p_new: { name: trimmed },
  });
  revalidatePath("/admin/media");
  return { ok: true };
}

// ------------------------- Move / assign folder -------------------------

export async function moveMedia(ids: string[], folderId: string | null): Promise<MediaActionResult> {
  await ensureMediaAccess();
  if (!ids.length) return { ok: true };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("media_library")
    .update({ folder_id: folderId })
    .in("id", ids);
  if (error) return { ok: false, error: error.message };

  await supabase.rpc("log_audit", {
    p_table: "media_library",
    p_record: ids[0],
    p_action: "move",
    p_new: { folder_id: folderId, count: ids.length },
  });
  revalidatePath("/admin/media");
  return { ok: true };
}

// ----------------------------- Duplicate -----------------------------

export async function duplicateMedia(id: string): Promise<MediaActionResult> {
  await ensureMediaAccess();
  const supabase = await createSupabaseServerClient();

  const { data: original } = await supabase
    .from("media_library")
    .select("*")
    .eq("id", id)
    .single();
  if (!original) return { ok: false, error: "Not found." };

  const ext = original.path.split(".").pop() || "bin";
  const dir = original.path.includes("/") ? original.path.slice(0, original.path.lastIndexOf("/") + 1) : "";
  const newPath = `${dir}${randomUUID()}.${ext}`;

  const { error: copyError } = await supabase.storage.from(original.bucket).copy(original.path, newPath);
  if (copyError) return { ok: false, error: copyError.message };

  const { data: pub } = supabase.storage.from(original.bucket).getPublicUrl(newPath);
  const user = await getCurrentUser();

  const { data: copy } = await supabase
    .from("media_library")
    .insert({
      folder_id: original.folder_id,
      bucket: original.bucket,
      path: newPath,
      url: pub.publicUrl,
      mime_type: original.mime_type,
      size_bytes: original.size_bytes,
      original_name: original.original_name ? `Copy of ${original.original_name}` : null,
      width: original.width,
      height: original.height,
      blur_data_url: original.blur_data_url,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (copy) {
    await supabase.rpc("log_audit", {
      p_table: "media_library",
      p_record: copy.id,
      p_action: "insert",
      p_new: { duplicated_from: id },
    });
  }
  revalidatePath("/admin/media");
  return { ok: true, id: copy?.id };
}

// ------------------------------ Replace ------------------------------

export async function replaceMedia(id: string, formData: FormData): Promise<MediaActionResult> {
  await ensureMediaAccess();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file provided." };
  }
  if (file.type.startsWith("image/") && !isAllowedImageType(file.type)) {
    return { ok: false, error: "Only JPG, PNG, WebP allowed" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from("media_library")
    .select("bucket,path")
    .eq("id", id)
    .single();
  if (!row) return { ok: false, error: "Not found." };

  const { error: uploadError } = await supabase.storage
    .from(row.bucket)
    .upload(row.path, file, { contentType: file.type, upsert: true });
  if (uploadError) return { ok: false, error: uploadError.message };

  const width = num(formData.get("width"));
  const height = num(formData.get("height"));
  const blur = (formData.get("blur") as string) || null;

  await supabase
    .from("media_library")
    .update({
      mime_type: file.type || null,
      size_bytes: file.size,
      width,
      height,
      blur_data_url: blur,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  await supabase.rpc("log_audit", {
    p_table: "media_library",
    p_record: id,
    p_action: "update",
    p_new: { replaced: true, name: file.name },
  });
  revalidatePath("/admin/media");
  return { ok: true };
}

// ------------------------------ Delete ------------------------------

export async function deleteMedia(id: string): Promise<MediaActionResult> {
  await ensureMediaAccess();
  const supabase = await createSupabaseServerClient();

  const { data: row } = await supabase
    .from("media_library")
    .select("bucket,path")
    .eq("id", id)
    .single();
  if (row) await supabase.storage.from(row.bucket).remove([row.path]);

  await supabase.from("media_library").delete().eq("id", id);
  await supabase.rpc("log_audit", { p_table: "media_library", p_record: id, p_action: "delete" });
  revalidatePath("/admin/media");
  return { ok: true };
}

export async function bulkDeleteMedia(ids: string[]): Promise<MediaActionResult> {
  await ensureMediaAccess();
  if (!ids.length) return { ok: true };
  const supabase = await createSupabaseServerClient();

  const { data: rows } = await supabase
    .from("media_library")
    .select("id,bucket,path")
    .in("id", ids);

  // Group removals by bucket.
  const byBucket = new Map<string, string[]>();
  for (const r of rows ?? []) {
    const list = byBucket.get(r.bucket) ?? [];
    list.push(r.path);
    byBucket.set(r.bucket, list);
  }
  await Promise.all(
    [...byBucket.entries()].map(([bucket, paths]) => supabase.storage.from(bucket).remove(paths)),
  );

  await supabase.from("media_library").delete().in("id", ids);
  await supabase.rpc("log_audit", {
    p_table: "media_library",
    p_record: ids[0],
    p_action: "delete",
    p_new: { bulk_delete: true, count: ids.length },
  });
  revalidatePath("/admin/media");
  return { ok: true };
}

/** Records a download in the audit log (no data change). */
export async function logMediaDownload(id: string): Promise<void> {
  await ensureMediaAccess();
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("log_audit", { p_table: "media_library", p_record: id, p_action: "download" });
}

// ------------------------------ Folders ------------------------------

export async function createMediaFolder(name: string): Promise<MediaActionResult> {
  await ensureMediaAccess();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Folder name is required." };

  const slug = slugify(trimmed);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("media_folders")
    .insert({
      name: trimmed,
      slug,
      bucket: "media",
      path_prefix: `custom/${slug}/`,
      icon: "media",
      is_system: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") return { ok: false, error: "A folder with this name already exists." };
    return { ok: false, error: error?.message ?? "Could not create folder." };
  }

  await supabase.rpc("log_audit", { p_table: "media_folders", p_record: data.id, p_action: "insert", p_new: { name: trimmed } });
  revalidatePath("/admin/media");
  return { ok: true, id: data.id };
}

export async function renameMediaFolder(id: string, name: string): Promise<MediaActionResult> {
  await ensureMediaAccess();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Folder name is required." };

  const supabase = await createSupabaseServerClient();
  const { data: folder } = await supabase.from("media_folders").select("is_system").eq("id", id).single();
  if (folder?.is_system) return { ok: false, error: "System folders cannot be renamed." };

  const { error } = await supabase.from("media_folders").update({ name: trimmed }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await supabase.rpc("log_audit", { p_table: "media_folders", p_record: id, p_action: "rename", p_new: { name: trimmed } });
  revalidatePath("/admin/media");
  return { ok: true };
}

export async function deleteMediaFolder(id: string): Promise<MediaActionResult> {
  await ensureMediaAccess();
  const supabase = await createSupabaseServerClient();
  const { data: folder } = await supabase.from("media_folders").select("is_system").eq("id", id).single();
  if (folder?.is_system) return { ok: false, error: "System folders cannot be deleted." };

  // Detach assets (keep the files; just unassign the folder).
  await supabase.from("media_library").update({ folder_id: null }).eq("folder_id", id);
  await supabase.from("media_folders").delete().eq("id", id);
  await supabase.rpc("log_audit", { p_table: "media_folders", p_record: id, p_action: "delete" });
  revalidatePath("/admin/media");
  return { ok: true };
}

// ------------------------------- Sync -------------------------------

interface StorageObject {
  name: string;
  id: string | null;
  metadata: { size?: number; mimetype?: string } | null;
}

async function listBucketRecursive(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  bucket: string,
  prefix = "",
  acc: { path: string; size: number | null; mime: string | null }[] = [],
): Promise<{ path: string; size: number | null; mime: string | null }[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return acc;

  for (const obj of data as StorageObject[]) {
    const full = prefix ? `${prefix}${obj.name}` : obj.name;
    // Folders are returned with a null id and no metadata.
    if (obj.id === null && !obj.metadata) {
      await listBucketRecursive(supabase, bucket, `${full}/`, acc);
    } else {
      acc.push({ path: full, size: obj.metadata?.size ?? null, mime: obj.metadata?.mimetype ?? null });
    }
  }
  return acc;
}

/** Reconcile media_library with the actual objects in Supabase Storage. */
export async function syncMediaLibrary(): Promise<MediaActionResult & { added?: number }> {
  await ensureMediaAccess();
  const supabase = await createSupabaseServerClient();
  let added = 0;

  for (const bucket of MEDIA_BUCKETS) {
    const objects = await listBucketRecursive(supabase, bucket);
    if (!objects.length) continue;

    const { data: existing } = await supabase
      .from("media_library")
      .select("path")
      .eq("bucket", bucket);
    const known = new Set((existing ?? []).map((r) => r.path));

    const missing = objects.filter((o) => !known.has(o.path));
    if (!missing.length) continue;

    const rows = missing.map((o) => {
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(o.path);
      const name = o.path.split("/").pop() ?? o.path;
      return {
        bucket,
        path: o.path,
        url: pub.publicUrl,
        mime_type: o.mime,
        size_bytes: o.size,
        original_name: name,
      };
    });

    const { error } = await supabase
      .from("media_library")
      .upsert(rows, { onConflict: "bucket,path", ignoreDuplicates: true });
    if (!error) added += rows.length;
  }

  revalidatePath("/admin/media");
  return { ok: true, added };
}
