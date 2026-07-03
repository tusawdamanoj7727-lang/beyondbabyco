"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { fieldErrorsFrom, warehouseInputSchema, type WarehouseInput } from "./inventory-schema";
import type { TablesInsert } from "@/lib/supabase/database.types";

export interface WarehouseActionState {
  ok: boolean;
  error: string | null;
  fieldErrors?: Record<string, string>;
  warehouseId?: string;
}

async function guard() {
  await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
}

function revalidate() {
  revalidatePath("/admin/warehouses");
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

function rawFromForm(fd: FormData) {
  return {
    name: str(fd, "name") ?? "",
    code: (str(fd, "code") ?? "").toUpperCase(),
    address: str(fd, "address"),
    city: str(fd, "city"),
    state: str(fd, "state"),
    country: str(fd, "country") ?? "India",
    pincode: str(fd, "pincode"),
    contact_person: str(fd, "contact_person"),
    phone: str(fd, "phone"),
    email: str(fd, "email"),
    status: (str(fd, "status") ?? "active") as WarehouseInput["status"],
    is_default: bool(fd, "is_default"),
  };
}

function toRow(input: WarehouseInput): TablesInsert<"warehouses"> {
  return {
    name: input.name,
    code: input.code,
    address: input.address,
    city: input.city,
    state: input.state,
    country: input.country,
    pincode: input.pincode,
    contact_person: input.contact_person,
    phone: input.phone,
    email: input.email,
    is_default: input.is_default,
    is_active: input.status === "active",
  };
}

async function clearOtherDefaults(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, exceptId?: string) {
  let q = supabase.from("warehouses").update({ is_default: false });
  if (exceptId) q = q.neq("id", exceptId);
  await q.eq("is_default", true);
}

export async function createWarehouseAction(
  _prev: WarehouseActionState,
  formData: FormData,
): Promise<WarehouseActionState> {
  await guard();
  const parsed = warehouseInputSchema.safeParse(rawFromForm(formData));
  if (!parsed.success) {
    return { ok: false, error: "Fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  if (parsed.data.is_default) await clearOtherDefaults(supabase);

  const { data, error } = await supabase.from("warehouses").insert(toRow(parsed.data)).select("id").single();
  if (error || !data) return { ok: false, error: error?.message ?? "Could not create warehouse." };

  await supabase.rpc("log_audit", {
    p_table: "warehouses",
    p_record: data.id,
    p_action: "insert",
    p_new: { name: parsed.data.name, code: parsed.data.code },
  });

  revalidate();
  redirect(`/admin/warehouses/${data.id}`);
}

export async function updateWarehouseAction(
  _prev: WarehouseActionState,
  formData: FormData,
): Promise<WarehouseActionState> {
  await guard();
  const id = str(formData, "id");
  if (!id) return { ok: false, error: "Missing warehouse id." };

  const parsed = warehouseInputSchema.safeParse(rawFromForm(formData));
  if (!parsed.success) {
    return { ok: false, error: "Fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  if (parsed.data.is_default) await clearOtherDefaults(supabase, id);

  const { error } = await supabase
    .from("warehouses")
    .update({ ...toRow(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await supabase.rpc("log_audit", {
    p_table: "warehouses",
    p_record: id,
    p_action: "update",
    p_new: { name: parsed.data.name, code: parsed.data.code },
  });

  revalidate();
  revalidatePath(`/admin/warehouses/${id}`);
  return { ok: true, error: null, warehouseId: id };
}

export async function deleteWarehouse(id: string) {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("warehouses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.rpc("log_audit", { p_table: "warehouses", p_record: id, p_action: "delete" });
  revalidate();
}

export async function bulkDeleteWarehouses(ids: string[]) {
  await guard();
  if (!ids.length) return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("warehouses").delete().in("id", ids);
  await supabase.rpc("log_audit", {
    p_table: "warehouses",
    p_record: ids[0],
    p_action: "delete",
    p_new: { bulk: true, count: ids.length },
  });
  revalidate();
}
