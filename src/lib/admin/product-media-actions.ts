"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { isOptimizableImage, optimizeProductUpload } from "./product-media-optimize";
import {
  buildStoragePaths,
  isTrashPath,
  safeBaseName,
  sectionFromStoragePath,
  storagePathFromUrl,
} from "./product-media-paths";
import { getSection, TRASH_PATH_SEGMENT, type MediaSectionId } from "./product-media-sections";
import { suggestProductMediaSeo } from "./product-media-seo";
import { revalidateProductStorefront } from "./storefront-revalidate";

const PRODUCTS_BUCKET = "products";

export interface MediaActionResult {
  ok: boolean;
  error?: string;
  imageId?: string;
  url?: string;
}

async function ensureCatalogAccess() {
  await requirePermission(PERMISSIONS.CATALOG_MANAGE);
}

async function getPublicUrl(path: string): Promise<string> {
  const supabase = await createSupabaseServerClient();
  return supabase.storage.from(PRODUCTS_BUCKET).getPublicUrl(path).data.publicUrl;
}

async function registerInMediaLibrary(opts: {
  path: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
  width?: number;
  height?: number;
  blurDataUrl?: string;
  alt?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  const row = {
    folder_id: null,
    bucket: PRODUCTS_BUCKET,
    path: opts.path,
    url: opts.url,
    mime_type: opts.mimeType,
    size_bytes: opts.sizeBytes,
    original_name: opts.originalName,
    width: opts.width ?? null,
    height: opts.height ?? null,
    blur_data_url: opts.blurDataUrl ?? null,
    alt: opts.alt ?? null,
    created_by: user?.id ?? null,
  };

  const { data: existing } = await supabase
    .from("media_library")
    .select("id")
    .eq("bucket", PRODUCTS_BUCKET)
    .eq("path", opts.path)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("media_library").update(row).eq("id", existing.id);
    return;
  }
  await supabase.from("media_library").insert(row);
}

async function uploadBuffer(path: string, buffer: Buffer, contentType: string) {
  const supabase = await createSupabaseServerClient();
  return supabase.storage.from(PRODUCTS_BUCKET).upload(path, buffer, { contentType, upsert: true });
}

export async function uploadProductMedia(
  productId: string,
  productName: string,
  productSlug: string,
  formData: FormData,
): Promise<MediaActionResult> {
  await ensureCatalogAccess();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file provided." };
  }

  const sectionId = (formData.get("sectionId") as MediaSectionId) || "gallery";
  const section = getSection(sectionId);
  const altOverride = (formData.get("alt") as string)?.trim() || null;
  const seo = suggestProductMediaSeo({ productName, sectionId, originalFilename: file.name });

  const supabase = await createSupabaseServerClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const baseName = `${safeBaseName(file.name)}-${randomUUID().slice(0, 8)}`;
  const paths = buildStoragePaths(productId, section.path, baseName);

  let mainUrl: string;
  let mainPath: string;
  let width: number | undefined;
  let height: number | undefined;
  let blurDataUrl: string | undefined;
  let mainSize = file.size;

  if (isOptimizableImage(file.type)) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    await uploadBuffer(`${paths.original}.${ext}`, buffer, file.type);

    const optimized = await optimizeProductUpload(buffer);
    width = optimized.width;
    height = optimized.height;
    blurDataUrl = optimized.blurDataUrl;
    mainSize = optimized.mainSizeBytes;

    await uploadBuffer(paths.main, optimized.mainWebp, "image/webp");
    if (optimized.avif) await uploadBuffer(paths.avif, optimized.avif, "image/avif");
    await uploadBuffer(paths.thumb, optimized.thumb, "image/webp");
    await uploadBuffer(paths.retina, optimized.retina, "image/webp");
    for (const [w, buf] of Object.entries(optimized.responsive)) {
      await uploadBuffer(paths.responsive(Number(w)), buf, "image/webp");
    }

    mainPath = paths.main;
    mainUrl = await getPublicUrl(mainPath);
  } else {
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    mainPath = `${productId}/${section.path}/${baseName}.${ext}`;
    const { error } = await uploadBuffer(mainPath, buffer, file.type);
    if (error) return { ok: false, error: error.message };
    mainUrl = await getPublicUrl(mainPath);
  }

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const position = count ?? 0;
  const isPrimary = sectionId === "primary" || position === 0;

  if (isPrimary && sectionId === "primary") {
    await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  }

  const alt = altOverride || seo.alt;
  const { data: inserted, error: insertError } = await supabase
    .from("product_images")
    .insert({ product_id: productId, url: mainUrl, alt, position, is_primary: isPrimary })
    .select("id")
    .single();

  if (insertError) return { ok: false, error: insertError.message };

  await registerInMediaLibrary({
    path: mainPath,
    url: mainUrl,
    mimeType: isOptimizableImage(file.type) ? "image/webp" : file.type,
    sizeBytes: mainSize,
    originalName: file.name,
    width,
    height,
    blurDataUrl,
    alt,
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidateProductStorefront(productSlug);
  return { ok: true, imageId: inserted.id, url: mainUrl };
}

export async function trashProductImage(
  imageId: string,
  productId: string,
  productSlug: string,
): Promise<MediaActionResult> {
  await ensureCatalogAccess();
  const supabase = await createSupabaseServerClient();

  const { data: img } = await supabase.from("product_images").select("url,is_primary").eq("id", imageId).single();
  if (!img?.url) return { ok: false, error: "Image not found." };

  const oldPath = storagePathFromUrl(img.url);
  if (!oldPath) return { ok: false, error: "Invalid storage path." };

  const fileName = oldPath.split("/").pop() ?? "file.webp";
  const trashPath = `${productId}/${TRASH_PATH_SEGMENT}/${imageId}/${fileName}`;

  const { data: blob } = await supabase.storage.from(PRODUCTS_BUCKET).download(oldPath);
  if (blob) {
    await supabase.storage.from(PRODUCTS_BUCKET).upload(trashPath, blob, { upsert: true });
    await supabase.storage.from(PRODUCTS_BUCKET).remove([oldPath]);
  }

  const trashUrl = await getPublicUrl(trashPath);
  await supabase.from("product_images").update({ url: trashUrl, is_primary: false }).eq("id", imageId);

  if (img.is_primary) {
    const { data: remaining } = await supabase
      .from("product_images")
      .select("id,url")
      .eq("product_id", productId)
      .order("position");
    const next = (remaining ?? []).find((r) => r.id !== imageId && !isTrashPath(storagePathFromUrl(r.url) ?? ""));
    if (next) await supabase.from("product_images").update({ is_primary: true }).eq("id", next.id);
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidateProductStorefront(productSlug);
  return { ok: true };
}

export async function restoreProductImage(
  imageId: string,
  productId: string,
  productSlug: string,
  targetSectionId: MediaSectionId,
): Promise<MediaActionResult> {
  await ensureCatalogAccess();
  const supabase = await createSupabaseServerClient();
  const section = getSection(targetSectionId);

  const { data: img } = await supabase.from("product_images").select("url").eq("id", imageId).single();
  if (!img?.url) return { ok: false, error: "Image not found." };

  const trashPath = storagePathFromUrl(img.url);
  if (!trashPath || !isTrashPath(trashPath)) return { ok: false, error: "Image is not in trash." };

  const fileName = trashPath.split("/").pop() ?? "file.webp";
  const newPath = `${productId}/${section.path}/${fileName}`;

  const { data: blob } = await supabase.storage.from(PRODUCTS_BUCKET).download(trashPath);
  if (!blob) return { ok: false, error: "Could not read trashed file." };

  await supabase.storage.from(PRODUCTS_BUCKET).upload(newPath, blob, { upsert: true });
  await supabase.storage.from(PRODUCTS_BUCKET).remove([trashPath]);

  const newUrl = await getPublicUrl(newPath);
  await supabase.from("product_images").update({ url: newUrl }).eq("id", imageId);

  revalidatePath(`/admin/products/${productId}`);
  revalidateProductStorefront(productSlug);
  return { ok: true, url: newUrl };
}

export async function duplicateProductImage(
  imageId: string,
  productId: string,
  productSlug: string,
): Promise<MediaActionResult> {
  await ensureCatalogAccess();
  const supabase = await createSupabaseServerClient();

  const { data: img } = await supabase.from("product_images").select("url,alt,position").eq("id", imageId).single();
  if (!img?.url) return { ok: false, error: "Image not found." };

  const oldPath = storagePathFromUrl(img.url);
  if (!oldPath || isTrashPath(oldPath)) return { ok: false, error: "Cannot duplicate trashed image." };

  const sectionId = sectionFromStoragePath(oldPath, productId);
  const section = getSection(sectionId);
  const fileName = oldPath.split("/").pop() ?? "copy.webp";
  const newPath = `${productId}/${section.path}/copy-${randomUUID().slice(0, 8)}-${fileName}`;

  const { data: blob } = await supabase.storage.from(PRODUCTS_BUCKET).download(oldPath);
  if (!blob) return { ok: false, error: "Could not read source file." };

  await supabase.storage.from(PRODUCTS_BUCKET).upload(newPath, blob, { upsert: true });
  const newUrl = await getPublicUrl(newPath);

  const { data: inserted } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      url: newUrl,
      alt: img.alt,
      position: (img.position ?? 0) + 1,
      is_primary: false,
    })
    .select("id")
    .single();

  revalidatePath(`/admin/products/${productId}`);
  revalidateProductStorefront(productSlug);
  return { ok: true, imageId: inserted?.id, url: newUrl };
}

export async function moveProductImageSection(
  imageId: string,
  productId: string,
  productSlug: string,
  targetSectionId: MediaSectionId,
): Promise<MediaActionResult> {
  await ensureCatalogAccess();
  const supabase = await createSupabaseServerClient();
  const section = getSection(targetSectionId);

  const { data: img } = await supabase.from("product_images").select("url").eq("id", imageId).single();
  if (!img?.url) return { ok: false, error: "Image not found." };

  const oldPath = storagePathFromUrl(img.url);
  if (!oldPath || isTrashPath(oldPath)) return { ok: false, error: "Invalid source." };

  const fileName = oldPath.split("/").pop() ?? "file.webp";
  const newPath = `${productId}/${section.path}/${fileName}`;

  const { data: blob } = await supabase.storage.from(PRODUCTS_BUCKET).download(oldPath);
  if (!blob) return { ok: false, error: "Could not read file." };

  await supabase.storage.from(PRODUCTS_BUCKET).upload(newPath, blob, { upsert: true });
  await supabase.storage.from(PRODUCTS_BUCKET).remove([oldPath]);

  const newUrl = await getPublicUrl(newPath);
  await supabase.from("product_images").update({ url: newUrl }).eq("id", imageId);

  revalidatePath(`/admin/products/${productId}`);
  revalidateProductStorefront(productSlug);
  return { ok: true, url: newUrl };
}

export async function bulkTrashProductImages(
  imageIds: string[],
  productId: string,
  productSlug: string,
): Promise<MediaActionResult> {
  for (const id of imageIds) {
    await trashProductImage(id, productId, productSlug);
  }
  return { ok: true };
}

export async function updateProductMediaSeo(
  imageId: string,
  productId: string,
  productSlug: string,
  fields: { alt?: string },
): Promise<MediaActionResult> {
  await ensureCatalogAccess();
  const supabase = await createSupabaseServerClient();
  await supabase.from("product_images").update({ alt: fields.alt?.trim() || null }).eq("id", imageId);
  revalidatePath(`/admin/products/${productId}`);
  revalidateProductStorefront(productSlug);
  return { ok: true };
}
