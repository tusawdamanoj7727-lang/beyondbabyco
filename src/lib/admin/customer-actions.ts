"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import type { Json } from "@/lib/supabase/database.types";
import {
  customerAddressSchema,
  customerInputSchema,
  fieldErrorsFrom,
  mergeCustomersSchema,
  type CustomerInput,
} from "./customer-schema";

export interface CustomerActionResult {
  ok: boolean;
  error: string | null;
  id?: string;
  fieldErrors?: Record<string, string>;
}

async function guard() {
  await requirePermission(PERMISSIONS.CUSTOMERS_MANAGE);
}

function revalidate(id?: string) {
  revalidatePath("/admin/customers");
  if (id) revalidatePath(`/admin/customers/${id}`);
}

async function logCustomerEvent(
  customerId: string,
  type: string,
  message: string,
  metadata: Record<string, unknown> = {},
) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  await supabase.from("customer_events").insert({
    customer_id: customerId,
    type,
    message,
    metadata: metadata as Json,
    created_by: user?.id ?? null,
  });
}

export async function createCustomer(input: CustomerInput): Promise<CustomerActionResult> {
  await guard();
  const parsed = customerInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  const d = parsed.data;
  const { data, error } = await supabase
    .from("customers")
    .insert({
      full_name: d.full_name,
      email: d.email,
      phone: d.phone,
      avatar_url: d.avatar_url,
      status: d.status,
      is_vip: d.is_vip,
      notes: d.notes,
      internal_notes: d.internal_notes,
      tags: d.tags as Json,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Failed to create customer." };

  await logCustomerEvent(data.id, "created", "Customer profile created.");
  await supabase.rpc("log_audit", {
    p_table: "customers",
    p_record: data.id,
    p_action: "create",
    p_new: { full_name: d.full_name, email: d.email },
  });

  revalidate(data.id);
  return { ok: true, error: null, id: data.id };
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<CustomerActionResult> {
  await guard();
  const parsed = customerInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  const d = parsed.data;
  const { error } = await supabase
    .from("customers")
    .update({
      full_name: d.full_name,
      email: d.email,
      phone: d.phone,
      avatar_url: d.avatar_url,
      status: d.status,
      is_vip: d.is_vip,
      notes: d.notes,
      internal_notes: d.internal_notes,
      tags: d.tags as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logCustomerEvent(id, "profile_update", "Customer profile updated.");
  await supabase.rpc("log_audit", {
    p_table: "customers",
    p_record: id,
    p_action: "update",
    p_new: { full_name: d.full_name, status: d.status, is_vip: d.is_vip },
  });

  revalidate(id);
  return { ok: true, error: null, id };
}

export async function deactivateCustomer(id: string): Promise<CustomerActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("customers")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logCustomerEvent(id, "deactivated", "Customer deactivated.");
  await supabase.rpc("log_audit", { p_table: "customers", p_record: id, p_action: "deactivate" });
  revalidate(id);
  return { ok: true, error: null, id };
}

export async function deleteCustomer(id: string): Promise<CustomerActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("customers")
    .update({ status: "deleted", deleted_at: now, updated_at: now })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logCustomerEvent(id, "deleted", "Customer soft-deleted.");
  await supabase.rpc("log_audit", { p_table: "customers", p_record: id, p_action: "delete" });
  revalidate();
  return { ok: true, error: null, id };
}

export async function restoreCustomer(id: string): Promise<CustomerActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("customers")
    .update({ status: "active", deleted_at: null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logCustomerEvent(id, "restored", "Customer restored.");
  await supabase.rpc("log_audit", { p_table: "customers", p_record: id, p_action: "restore" });
  revalidate(id);
  return { ok: true, error: null, id };
}

export async function mergeCustomers(primaryId: string, secondaryId: string): Promise<CustomerActionResult> {
  await guard();
  const parsed = mergeCustomersSchema.safeParse({ primary_id: primaryId, secondary_id: secondaryId });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid merge." };
  if (primaryId === secondaryId) return { ok: false, error: "Cannot merge a customer with itself." };

  const supabase = await createSupabaseServerClient();

  await supabase.from("orders").update({ customer_id: primaryId }).eq("customer_id", secondaryId);
  await supabase.from("customer_addresses").update({ customer_id: primaryId }).eq("customer_id", secondaryId);
  await supabase.from("wishlist").update({ customer_id: primaryId }).eq("customer_id", secondaryId);
  await supabase.from("cart").update({ customer_id: primaryId }).eq("customer_id", secondaryId);
  await supabase.from("reviews").update({ customer_id: primaryId }).eq("customer_id", secondaryId);
  await supabase.from("support_tickets").update({ customer_id: primaryId }).eq("customer_id", secondaryId);
  await supabase.from("loyalty_points").update({ customer_id: primaryId }).eq("customer_id", secondaryId);
  await supabase.from("referrals").update({ referrer_customer_id: primaryId }).eq("referrer_customer_id", secondaryId);
  await supabase.from("referrals").update({ referred_customer_id: primaryId }).eq("referred_customer_id", secondaryId);

  await supabase
    .from("customers")
    .update({ status: "deleted", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", secondaryId);

  await logCustomerEvent(primaryId, "merge", `Merged customer ${secondaryId} into this profile.`, { merged_id: secondaryId });
  await supabase.rpc("log_audit", {
    p_table: "customers",
    p_record: primaryId,
    p_action: "merge",
    p_new: { merged_customer_id: secondaryId },
  });

  revalidate(primaryId);
  return { ok: true, error: null, id: primaryId };
}

export async function upsertCustomerAddress(input: {
  id?: string;
  customer_id: string;
  type: "billing" | "shipping";
  full_name?: string | null;
  phone?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  is_default?: boolean;
}): Promise<CustomerActionResult> {
  await guard();
  const parsed = customerAddressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid address." };

  const supabase = await createSupabaseServerClient();
  const d = parsed.data;

  if (d.is_default) {
    await supabase
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("customer_id", d.customer_id)
      .eq("type", d.type);
  }

  if (d.id) {
    const { error } = await supabase
      .from("customer_addresses")
      .update({
        type: d.type,
        full_name: d.full_name,
        phone: d.phone,
        line1: d.line1,
        line2: d.line2,
        city: d.city,
        state: d.state,
        country: d.country,
        pincode: d.pincode,
        is_default: d.is_default,
        updated_at: new Date().toISOString(),
      })
      .eq("id", d.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data, error } = await supabase
      .from("customer_addresses")
      .insert({
        customer_id: d.customer_id,
        type: d.type,
        full_name: d.full_name,
        phone: d.phone,
        line1: d.line1,
        line2: d.line2,
        city: d.city,
        state: d.state,
        country: d.country,
        pincode: d.pincode,
        is_default: d.is_default,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    d.id = data?.id;
  }

  await logCustomerEvent(d.customer_id, "address_update", `${d.type} address updated.`);
  await supabase.rpc("log_audit", {
    p_table: "customer_addresses",
    p_record: d.id,
    p_action: d.id ? "update" : "create",
    p_new: { customer_id: d.customer_id, type: d.type },
  });

  revalidate(d.customer_id);
  return { ok: true, error: null, id: d.id };
}

export async function bulkDeactivateCustomers(ids: string[]): Promise<CustomerActionResult> {
  await guard();
  for (const id of ids) {
    const res = await deactivateCustomer(id);
    if (!res.ok) return res;
  }
  revalidate();
  return { ok: true, error: null };
}

export async function createCustomerAction(
  _prev: CustomerActionResult,
  formData: FormData,
): Promise<CustomerActionResult> {
  await guard();
  const tagsRaw = formData.get("tags");
  const tags = typeof tagsRaw === "string" ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const input: CustomerInput = {
    full_name: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? "") || null,
    phone: String(formData.get("phone") ?? "") || null,
    avatar_url: String(formData.get("avatar_url") ?? "") || null,
    status: (formData.get("status") === "inactive" ? "inactive" : "active") as CustomerInput["status"],
    is_vip: formData.get("is_vip") === "on",
    notes: String(formData.get("notes") ?? "") || null,
    internal_notes: String(formData.get("internal_notes") ?? "") || null,
    tags,
  };

  const result = await createCustomer(input);
  if (result.ok && result.id) redirect(`/admin/customers/${result.id}`);
  return result;
}

export async function updateCustomerAction(
  _prev: CustomerActionResult,
  formData: FormData,
): Promise<CustomerActionResult> {
  await guard();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing customer id." };

  const tagsRaw = formData.get("tags");
  const tags = typeof tagsRaw === "string" ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const input: CustomerInput = {
    full_name: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? "") || null,
    phone: String(formData.get("phone") ?? "") || null,
    avatar_url: String(formData.get("avatar_url") ?? "") || null,
    status: (formData.get("status") === "inactive" ? "inactive" : "active") as CustomerInput["status"],
    is_vip: formData.get("is_vip") === "on",
    notes: String(formData.get("notes") ?? "") || null,
    internal_notes: String(formData.get("internal_notes") ?? "") || null,
    tags,
  };

  return updateCustomer(id, input);
}
