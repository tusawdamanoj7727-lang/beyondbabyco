"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { getCustomerIdForUser } from "@/lib/orders/customer-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
    .optional()
    .or(z.literal("")),
  avatar_url: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
});

export type ProfileActionResult = {
  ok: boolean;
  error: string | null;
  fieldErrors?: Record<string, string>;
};

export async function getCustomerProfileAction() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const customerId = await getCustomerIdForUser(user.id);

  const [{ data: profile }, { data: customer }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, avatar_url").eq("id", user.id).maybeSingle(),
    customerId
      ? supabase.from("customers").select("email, full_name, phone, avatar_url").eq("id", customerId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    email: customer?.email ?? user.email ?? "",
    fullName: customer?.full_name ?? profile?.full_name ?? "",
    phone: customer?.phone ?? profile?.phone ?? "",
    avatarUrl: customer?.avatar_url ?? profile?.avatar_url ?? "",
  };
}

export async function updateCustomerProfileAction(input: {
  full_name: string;
  phone?: string;
  avatar_url?: string;
}): Promise<ProfileActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to update your profile." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Validation failed.", fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const customerId = await getCustomerIdForUser(user.id);
  const d = parsed.data;

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      full_name: d.full_name,
      phone: d.phone || null,
      avatar_url: d.avatar_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileErr) return { ok: false, error: profileErr.message };

  if (customerId) {
    await supabase
      .from("customers")
      .update({
        full_name: d.full_name,
        phone: d.phone || null,
        avatar_url: d.avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customerId);
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { ok: true, error: null };
}
