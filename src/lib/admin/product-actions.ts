"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  productInputSchema,
  slugify,
  type ProductInput,
} from "./product-schema";
import type { ProductStatus, TablesInsert } from "@/lib/supabase/database.types";
import { revalidateProductStorefront } from "./storefront-revalidate";
import { validateImageUpload } from "@/lib/media/upload-validation";

const PRODUCTS_BUCKET = "products";

export interface ProductActionState {
  ok: boolean;
  error: string | null;
  fieldErrors?: Record<string, string>;
  productId?: string;
}

async function ensureCatalogAccess() {
  await requirePermission(PERMISSIONS.CATALOG_MANAGE);
}

// --------------------------- FormData parsing ---------------------------

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function numOrNull(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

function rawFromFormData(fd: FormData) {
  return {
    name: str(fd, "name") ?? "",
    slug: str(fd, "slug") ?? slugify(str(fd, "name") ?? ""),
    brand_id: str(fd, "brand_id"),
    category_id: str(fd, "category_id"),
    subcategory_id: str(fd, "subcategory_id"),
    short_description: str(fd, "short_description"),
    description: str(fd, "description"),
    compare_at_price: numOrNull(fd, "compare_at_price"),
    price: numOrNull(fd, "price") ?? 0,
    sale_price: numOrNull(fd, "sale_price"),
    gst_rate: numOrNull(fd, "gst_rate") ?? 0,
    tax_class: str(fd, "tax_class"),
    sku: str(fd, "sku"),
    barcode: str(fd, "barcode"),
    stock: numOrNull(fd, "stock") ?? 0,
    low_stock_threshold: numOrNull(fd, "low_stock_threshold") ?? 0,
    weight_grams: numOrNull(fd, "weight_grams"),
    length_cm: numOrNull(fd, "length_cm"),
    width_cm: numOrNull(fd, "width_cm"),
    height_cm: numOrNull(fd, "height_cm"),
    ingredient_ids: fd.getAll("ingredient_ids").map(String).filter(Boolean),
    benefit_ids: fd.getAll("benefit_ids").map(String).filter(Boolean),
    seo_title: str(fd, "seo_title"),
    seo_description: str(fd, "seo_description"),
    meta_keywords: str(fd, "meta_keywords"),
    canonical_url: str(fd, "canonical_url"),
    status: (str(fd, "status") ?? "draft") as ProductStatus,
    is_featured: bool(fd, "is_featured"),
    is_best_seller: bool(fd, "is_best_seller"),
    is_new_arrival: bool(fd, "is_new_arrival"),
    is_trending: bool(fd, "is_trending"),
    launch_date: str(fd, "launch_date"),
  };
}

function toProductRow(input: ProductInput): TablesInsert<"products"> {
  return {
    name: input.name,
    slug: input.slug,
    brand_id: input.brand_id,
    category_id: input.category_id,
    subcategory_id: input.subcategory_id,
    short_description: input.short_description,
    description: input.description,
    compare_at_price: input.compare_at_price,
    price: input.price,
    sale_price: input.sale_price,
    gst_rate: input.gst_rate,
    tax_class: input.tax_class,
    sku: input.sku,
    barcode: input.barcode,
    stock: input.stock,
    low_stock_threshold: input.low_stock_threshold,
    weight_grams: input.weight_grams,
    length_cm: input.length_cm,
    width_cm: input.width_cm,
    height_cm: input.height_cm,
    seo_title: input.seo_title,
    seo_description: input.seo_description,
    meta_keywords: input.meta_keywords,
    canonical_url: input.canonical_url,
    status: input.status,
    is_featured: input.is_featured,
    is_best_seller: input.is_best_seller,
    is_new_arrival: input.is_new_arrival,
    is_trending: input.is_trending,
    launch_date: input.launch_date,
    published_at: input.status === "active" ? new Date().toISOString() : null,
  };
}

function fieldErrorsFrom(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

async function syncRelations(productId: string, input: ProductInput) {
  const supabase = await createSupabaseServerClient();

  await supabase.from("product_ingredients").delete().eq("product_id", productId);
  await supabase.from("product_benefits").delete().eq("product_id", productId);

  if (input.ingredient_ids.length) {
    await supabase.from("product_ingredients").insert(
      input.ingredient_ids.map((ingredient_id) => ({ product_id: productId, ingredient_id })),
    );
  }
  if (input.benefit_ids.length) {
    await supabase.from("product_benefits").insert(
      input.benefit_ids.map((benefit_id) => ({ product_id: productId, benefit_id })),
    );
  }
}

// ------------------------------ Create ------------------------------

export async function createProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await ensureCatalogAccess();

  const parsed = productInputSchema.safeParse(rawFromFormData(formData));
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .insert(toProductRow(parsed.data))
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return { ok: false, error: "A product with this slug or SKU already exists.", fieldErrors: { slug: "Already in use" } };
    }
    return { ok: false, error: error?.message ?? "Could not create product." };
  }

  await syncRelations(data.id, parsed.data);
  await supabase.rpc("log_audit", {
    p_table: "products",
    p_record: data.id,
    p_action: "insert",
    p_new: { name: parsed.data.name, status: parsed.data.status },
  });

  revalidatePath("/admin/products");
  redirect(`/admin/products/${data.id}`);
}

// ------------------------------ Update ------------------------------

export async function updateProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await ensureCatalogAccess();

  const id = str(formData, "id");
  if (!id) return { ok: false, error: "Missing product id." };

  const parsed = productInputSchema.safeParse(rawFromFormData(formData));
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("products")
    .update(toProductRow(parsed.data))
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "A product with this slug or SKU already exists.", fieldErrors: { slug: "Already in use" } };
    }
    return { ok: false, error: error.message };
  }

  await syncRelations(id, parsed.data);
  await supabase.rpc("log_audit", {
    p_table: "products",
    p_record: id,
    p_action: "update",
    p_new: { name: parsed.data.name, status: parsed.data.status },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  return { ok: true, error: null, productId: id };
}

// --------------------------- Row operations ---------------------------

export async function softDeleteProduct(id: string) {
  await ensureCatalogAccess();
  const supabase = await createSupabaseServerClient();
  await supabase.from("products").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  await supabase.rpc("log_audit", { p_table: "products", p_record: id, p_action: "delete" });
  revalidatePath("/admin/products");
}

export async function restoreProduct(id: string) {
  await ensureCatalogAccess();
  const supabase = await createSupabaseServerClient();
  await supabase.from("products").update({ deleted_at: null }).eq("id", id);
  await supabase.rpc("log_audit", { p_table: "products", p_record: id, p_action: "update", p_new: { restored: true } });
  revalidatePath("/admin/products");
}

export async function duplicateProduct(id: string) {
  await ensureCatalogAccess();
  const supabase = await createSupabaseServerClient();

  const { data: original } = await supabase.from("products").select("*").eq("id", id).single();
  if (!original) return;

  const suffix = randomUUID().slice(0, 6);
  const rest: Record<string, unknown> = { ...original };
  delete rest.id;
  delete rest.created_at;
  delete rest.updated_at;

  const { data: copy } = await supabase
    .from("products")
    .insert({
      ...(rest as TablesInsert<"products">),
      name: `${original.name} (Copy)`,
      slug: `${original.slug}-copy-${suffix}`,
      sku: original.sku ? `${original.sku}-COPY-${suffix}` : null,
      status: "draft",
      published_at: null,
      deleted_at: null,
    })
    .select("id")
    .single();

  if (copy) {
    await supabase.rpc("log_audit", { p_table: "products", p_record: copy.id, p_action: "insert", p_new: { duplicated_from: id } });
    revalidatePath("/admin/products");
    redirect(`/admin/products/${copy.id}`);
  }
}

// ----------------------------- Bulk -----------------------------

export async function bulkUpdateStatus(ids: string[], status: ProductStatus) {
  await ensureCatalogAccess();
  if (!ids.length) return;
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("products")
    .update({
      status,
      published_at: status === "active" ? new Date().toISOString() : null,
    })
    .in("id", ids);
  await supabase.rpc("log_audit", {
    p_table: "products",
    p_record: ids[0],
    p_action: "update",
    p_new: { bulk_status: status, count: ids.length },
  });
  revalidatePath("/admin/products");
}

export async function bulkSoftDelete(ids: string[]) {
  await ensureCatalogAccess();
  if (!ids.length) return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("products").update({ deleted_at: new Date().toISOString() }).in("id", ids);
  await supabase.rpc("log_audit", {
    p_table: "products",
    p_record: ids[0],
    p_action: "delete",
    p_new: { bulk_delete: true, count: ids.length },
  });
  revalidatePath("/admin/products");
}

// --------------------------- Taxonomy quick-add ---------------------------

export async function createIngredient(name: string) {
  await ensureCatalogAccess();
  const trimmed = name.trim();
  if (!trimmed) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("ingredients")
    .insert({ name: trimmed })
    .select("id,name")
    .single();
  return data ?? null;
}

export async function createBenefit(name: string) {
  await ensureCatalogAccess();
  const trimmed = name.trim();
  if (!trimmed) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("benefits")
    .insert({ name: trimmed })
    .select("id,name")
    .single();
  return data ?? null;
}

// ----------------------------- Images -----------------------------

export interface ImageActionResult {
  ok: boolean;
  error?: string;
}

export async function uploadProductImage(
  productId: string,
  formData: FormData,
): Promise<ImageActionResult> {
  await ensureCatalogAccess();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file provided." };
  }
  const typeError = validateImageUpload(file);
  if (typeError) {
    return { ok: false, error: typeError };
  }

  const supabase = await createSupabaseServerClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${productId}/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCTS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: pub } = supabase.storage.from(PRODUCTS_BUCKET).getPublicUrl(path);

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const position = count ?? 0;
  const { data: inserted } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      url: pub.publicUrl,
      alt: null,
      position,
      is_primary: position === 0,
    })
    .select("id")
    .single();

  if (inserted) {
    await supabase.rpc("log_audit", { p_table: "product_images", p_record: inserted.id, p_action: "insert", p_new: { path } });
  }

  revalidatePath(`/admin/products/${productId}`);
  const { data: product } = await supabase.from("products").select("slug").eq("id", productId).maybeSingle();
  revalidateProductStorefront(product?.slug);
  return { ok: true };
}

function storagePathFromUrl(url: string): string | null {
  const marker = `/${PRODUCTS_BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

export async function deleteProductImage(
  imageId: string,
  productId: string,
): Promise<ImageActionResult> {
  await ensureCatalogAccess();
  const supabase = await createSupabaseServerClient();

  const { data: img } = await supabase
    .from("product_images")
    .select("url,is_primary")
    .eq("id", imageId)
    .single();

  if (img) {
    const path = storagePathFromUrl(img.url);
    if (path) await supabase.storage.from(PRODUCTS_BUCKET).remove([path]);
  }

  await supabase.from("product_images").delete().eq("id", imageId);
  await supabase.rpc("log_audit", { p_table: "product_images", p_record: imageId, p_action: "delete" });

  // Ensure a primary image still exists.
  const { data: remaining } = await supabase
    .from("product_images")
    .select("id,is_primary")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (remaining && remaining.length && !remaining.some((r) => r.is_primary)) {
    await supabase.from("product_images").update({ is_primary: true }).eq("id", remaining[0].id);
  }

  revalidatePath(`/admin/products/${productId}`);
  const { data: product } = await supabase.from("products").select("slug").eq("id", productId).maybeSingle();
  revalidateProductStorefront(product?.slug);
  return { ok: true };
}

export async function updateProductImageAlt(
  imageId: string,
  productId: string,
  alt: string,
): Promise<ImageActionResult> {
  await ensureCatalogAccess();
  const supabase = await createSupabaseServerClient();
  await supabase.from("product_images").update({ alt: alt.trim() || null }).eq("id", imageId);
  revalidatePath(`/admin/products/${productId}`);
  const { data: product } = await supabase.from("products").select("slug").eq("id", productId).maybeSingle();
  revalidateProductStorefront(product?.slug);
  return { ok: true };
}

export async function setPrimaryImage(
  imageId: string,
  productId: string,
): Promise<ImageActionResult> {
  await ensureCatalogAccess();
  const supabase = await createSupabaseServerClient();
  await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  await supabase.from("product_images").update({ is_primary: true }).eq("id", imageId);
  revalidatePath(`/admin/products/${productId}`);
  const { data: product } = await supabase.from("products").select("slug").eq("id", productId).maybeSingle();
  revalidateProductStorefront(product?.slug);
  return { ok: true };
}

export async function reorderProductImages(
  productId: string,
  orderedIds: string[],
): Promise<ImageActionResult> {
  await ensureCatalogAccess();
  const supabase = await createSupabaseServerClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("product_images").update({ position: index }).eq("id", id),
    ),
  );
  revalidatePath(`/admin/products/${productId}`);
  const { data: product } = await supabase.from("products").select("slug").eq("id", productId).maybeSingle();
  revalidateProductStorefront(product?.slug);
  return { ok: true };
}
