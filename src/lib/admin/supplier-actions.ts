"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { fieldErrorsFrom, supplierInputSchema, type SupplierInput } from "./inventory-schema";
import type { TablesInsert } from "@/lib/supabase/database.types";

export interface SupplierActionState {
  ok: boolean;
  error: string | null;
  fieldErrors?: Record<string, string>;
  supplierId?: string;
}

async function guard() {
  await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
}

function revalidate() {
  revalidatePath("/admin/suppliers");
  revalidatePath("/admin/inventory");
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

function rawFromForm(formData: FormData) {
  return {
    name: str(formData, "name") ?? "",
    contact_name: str(formData, "contact_name"),
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    gstin: str(formData, "gstin"),
    address: str(formData, "address"),
    country: str(formData, "country") ?? "India",
    website: str(formData, "website"),
    notes: str(formData, "notes"),
    is_active: formData.has("is_active") ? bool(formData, "is_active") : true,
  };
}

function toRow(input: SupplierInput): TablesInsert<"suppliers"> {
  return {
    name: input.name,
    contact_name: input.contact_name,
    email: input.email,
    phone: input.phone,
    gstin: input.gstin,
    address: input.address,
    country: input.country,
    website: input.website,
    notes: input.notes,
    is_active: input.is_active,
  };
}

export async function createSupplierAction(
  _prev: SupplierActionState,
  formData: FormData,
): Promise<SupplierActionState> {
  await guard();
  const parsed = supplierInputSchema.safeParse(rawFromForm(formData));
  if (!parsed.success) {
    return { ok: false, error: "Fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("suppliers").insert(toRow(parsed.data)).select("id").single();
  if (error || !data) return { ok: false, error: error?.message ?? "Could not create supplier." };

  await supabase.rpc("log_audit", {
    p_table: "suppliers",
    p_record: data.id,
    p_action: "insert",
    p_new: { name: parsed.data.name },
  });

  revalidate();
  redirect(`/admin/suppliers/${data.id}`);
}

export async function updateSupplierAction(
  _prev: SupplierActionState,
  formData: FormData,
): Promise<SupplierActionState> {
  await guard();
  const id = str(formData, "id");
  if (!id) return { ok: false, error: "Missing supplier id." };

  const parsed = supplierInputSchema.safeParse(rawFromForm(formData));
  if (!parsed.success) {
    return { ok: false, error: "Fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("suppliers")
    .update({ ...toRow(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await supabase.rpc("log_audit", {
    p_table: "suppliers",
    p_record: id,
    p_action: "update",
    p_new: { name: parsed.data.name },
  });

  revalidate();
  revalidatePath(`/admin/suppliers/${id}`);
  return { ok: true, error: null, supplierId: id };
}

export async function deleteSupplier(id: string) {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.rpc("log_audit", { p_table: "suppliers", p_record: id, p_action: "delete" });
  revalidate();
}

export async function bulkDeleteSuppliers(ids: string[]) {
  await guard();
  if (!ids.length) return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("suppliers").delete().in("id", ids);
  await supabase.rpc("log_audit", {
    p_table: "suppliers",
    p_record: ids[0],
    p_action: "delete",
    p_new: { bulk: true, count: ids.length },
  });
  revalidate();
}
