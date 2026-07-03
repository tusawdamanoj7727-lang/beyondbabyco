"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { getCustomerIdForUser } from "@/lib/orders/customer-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addressFormSchema, fieldErrorsFrom, type AddressFormValues } from "@/lib/checkout/schema";

export interface CustomerAddressRow {
  id: string;
  type: "billing" | "shipping";
  full_name: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  is_default: boolean;
}

export interface AddressActionResult {
  ok: boolean;
  error: string | null;
  id?: string;
  fieldErrors?: Record<string, string>;
}

async function requireCustomerId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getCustomerIdForUser(user.id);
}

export async function getCustomerAddressesAction(): Promise<CustomerAddressRow[]> {
  const customerId = await requireCustomerId();
  if (!customerId) return [];

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });

  return (data ?? []) as CustomerAddressRow[];
}

export async function upsertCustomerAddressAction(
  input: AddressFormValues & { type: "billing" | "shipping"; id?: string },
): Promise<AddressActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return { ok: false, error: "Sign in to manage addresses." };

  const parsed = addressFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid address.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  const d = parsed.data;

  if (d.is_default) {
    await supabase
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("customer_id", customerId)
      .eq("type", input.type);
  }

  const row = {
    customer_id: customerId,
    type: input.type,
    full_name: d.full_name,
    phone: d.phone,
    line1: d.line1,
    line2: d.line2 ?? null,
    city: d.city,
    state: d.state,
    country: d.country ?? "India",
    pincode: d.pincode,
    is_default: d.is_default ?? false,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("customer_addresses").update(row).eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/account/addresses");
    return { ok: true, error: null, id: input.id };
  }

  const { data, error } = await supabase.from("customer_addresses").insert(row).select("id").single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/account/addresses");
  return { ok: true, error: null, id: data.id };
}

export async function deleteCustomerAddressAction(id: string): Promise<AddressActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return { ok: false, error: "Not signed in." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", id)
    .eq("customer_id", customerId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/account/addresses");
  return { ok: true, error: null };
}

export async function lookupPincodeAction(pincode: string): Promise<{
  ok: boolean;
  city?: string;
  state?: string;
  error?: string;
}> {
  const cleaned = pincode.replace(/\D/g, "").slice(0, 6);
  if (cleaned.length !== 6) return { ok: false, error: "Invalid PIN" };

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    const data = (await res.json()) as {
      Status?: string;
      PostOffice?: { District?: string; State?: string }[];
    }[];
    const entry = data?.[0];
    if (entry?.Status !== "Success" || !entry.PostOffice?.[0]) {
      return { ok: false, error: "PIN not found" };
    }
    const office = entry.PostOffice[0];
    return {
      ok: true,
      city: office.District ?? undefined,
      state: office.State ?? undefined,
    };
  } catch {
    return { ok: false, error: "Lookup failed" };
  }
}
