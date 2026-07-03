"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { brandInputSchema, type BrandInput } from "./brand-schema";
import { slugify } from "./category-schema";
import type { CatalogStatus, TablesInsert } from "@/lib/supabase/database.types";

export interface BrandActionState {
  ok: boolean;
  error: string | null;
  fieldErrors?: Record<string, string>;
  brandId?: string;
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

function numOr(fd: FormData, key: string, fallback: number): number {
  const v = str(fd, key);
  if (v === null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

function rawFromFormData(fd: FormData) {
  return {
    name: str(fd, "name") ?? "",
    slug: str(fd, "slug") ?? slugify(str(fd, "name") ?? ""),
    website_url: str(fd, "website_url"),
    description: str(fd, "description"),
    country_of_origin: str(fd, "country_of_origin"),
    logo_url: str(fd, "logo_url"),
    banner_url: str(fd, "banner_url"),
    seo_title: str(fd, "seo_title"),
    seo_description: str(fd, "seo_description"),
    meta_keywords: str(fd, "meta_keywords"),
    canonical_url: str(fd, "canonical_url"),
    status: (str(fd, "status") ?? "draft") as CatalogStatus,
    is_featured: bool(fd, "is_featured"),
    position: numOr(fd, "position", 0),
  };
}

function toBrandRow(input: BrandInput): TablesInsert<"brands"> {
  return {
    name: input.name,
    slug: input.slug,
    website_url: input.website_url,
    description: input.description,
    country_of_origin: input.country_of_origin,
    logo_url: input.logo_url,
    banner_url: input.banner_url,
    seo_title: input.seo_title,
    seo_description: input.seo_description,
    meta_keywords: input.meta_keywords,
    canonical_url: input.canonical_url,
    status: input.status,
    is_active: input.status === "active",
    is_featured: input.is_featured,
    position: input.position,
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

// ------------------------------ Create ------------------------------

export async function createBrandAction(
  _prev: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  await ensureCatalogAccess();

  const parsed = brandInputSchema.safeParse(rawFromFormData(formData));
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("brands")
    .insert(toBrandRow(parsed.data))
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return { ok: false, error: "A brand with this slug already exists.", fieldErrors: { slug: "Already in use" } };
    }
    return { ok: false, error: error?.message ?? "Could not create brand." };
  }

  await supabase.rpc("log_audit", {
    p_table: "brands",
    p_record: data.id,
    p_action: "insert",
    p_new: { name: parsed.data.name, status: parsed.data.status },
  });

  revalidatePath("/admin/brands");
  redirect(`/admin/brands/${data.id}`);
}

// ------------------------------ Update ------------------------------

export async function updateBrandAction(
  _prev: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  await ensureCatalogAccess();

  const id = str(formData, "id");
  if (!id) return { ok: false, error: "Missing brand id." };

  const parsed = brandInputSchema.safeParse(rawFromFormData(formData));
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("brands").update(toBrandRow(parsed.data)).eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "A brand with this slug already exists.", fieldErrors: { slug: "Already in use" } };
    }
    return { ok: false, error: error.message };
  }

  await supabase.rpc("log_audit", {
    p_table: "brands",
    p_record: id,
    p_action: "update",
    p_new: { name: parsed.data.name, status: parsed.data.status },
  });

  revalidatePath("/admin/brands");
  revalidatePath(`/admin/brands/${id}`);
  return { ok: true, error: null, brandId: id };
}

// --------------------------- Row operations ---------------------------

export async function softDeleteBrand(id: string) {
  await ensureCatalogAccess();
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("brands")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);
  await supabase.rpc("log_audit", { p_table: "brands", p_record: id, p_action: "delete" });
  revalidatePath("/admin/brands");
}

export async function restoreBrand(id: string) {
  await ensureCatalogAccess();
  const supabase = await createSupabaseServerClient();
  await supabase.from("brands").update({ deleted_at: null }).eq("id", id);
  await supabase.rpc("log_audit", { p_table: "brands", p_record: id, p_action: "update", p_new: { restored: true } });
  revalidatePath("/admin/brands");
}

export async function duplicateBrand(id: string) {
  await ensureCatalogAccess();
  const supabase = await createSupabaseServerClient();

  const { data: original } = await supabase.from("brands").select("*").eq("id", id).single();
  if (!original) return;

  const suffix = randomUUID().slice(0, 6);
  const rest: Record<string, unknown> = { ...original };
  delete rest.id;
  delete rest.created_at;
  delete rest.updated_at;

  const { data: copy } = await supabase
    .from("brands")
    .insert({
      ...(rest as TablesInsert<"brands">),
      name: `${original.name} (Copy)`,
      slug: `${original.slug}-copy-${suffix}`,
      status: "draft",
      is_active: false,
      is_featured: false,
      deleted_at: null,
    })
    .select("id")
    .single();

  if (copy) {
    await supabase.rpc("log_audit", { p_table: "brands", p_record: copy.id, p_action: "insert", p_new: { duplicated_from: id } });
    revalidatePath("/admin/brands");
    redirect(`/admin/brands/${copy.id}`);
  }
}

// ----------------------------- Bulk -----------------------------

export async function bulkUpdateBrandStatus(ids: string[], status: CatalogStatus) {
  await ensureCatalogAccess();
  if (!ids.length) return;
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("brands")
    .update({ status, is_active: status === "active" })
    .in("id", ids);
  await supabase.rpc("log_audit", {
    p_table: "brands",
    p_record: ids[0],
    p_action: "update",
    p_new: { bulk_status: status, count: ids.length },
  });
  revalidatePath("/admin/brands");
}

export async function bulkSoftDeleteBrands(ids: string[]) {
  await ensureCatalogAccess();
  if (!ids.length) return;
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("brands")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .in("id", ids);
  await supabase.rpc("log_audit", {
    p_table: "brands",
    p_record: ids[0],
    p_action: "delete",
    p_new: { bulk_delete: true, count: ids.length },
  });
  revalidatePath("/admin/brands");
}
