import "server-only";

import type { User } from "@supabase/supabase-js";

import { isServiceRoleConfigured } from "@/lib/env";
import { claimGuestCustomerForUser } from "@/lib/checkout/guest-customer";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isStaffRole, normalizeRole } from "@/lib/auth/roles";

function resolveFullName(user: User): string {
  return (
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    user.email?.split("@")[0] ||
    "Customer"
  );
}

async function ensureViaRpc(user: User): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("ensure_customer_account", {
    p_full_name: resolveFullName(user),
  });

  if (error) {
    console.warn("[customer-bootstrap] RPC ensure_customer_account failed:", error.message);
    return null;
  }

  return data ?? null;
}

async function ensureViaServiceRole(user: User): Promise<string | null> {
  const fullName = resolveFullName(user);
  const email = user.email ?? "";

  const service = createSupabaseServiceClient();

  const { data: customerRole } = await service
    .from("roles")
    .select("id")
    .eq("name", "customer")
    .maybeSingle();

  const { data: existingProfile } = await service
    .from("profiles")
    .select("id, role_id")
    .eq("id", user.id)
    .maybeSingle();

  let existingRoleName = null as ReturnType<typeof normalizeRole>;
  if (existingProfile?.role_id) {
    const { data: roleRow } = await service
      .from("roles")
      .select("name")
      .eq("id", existingProfile.role_id)
      .maybeSingle();
    existingRoleName = normalizeRole(roleRow?.name);
  }

  if (!existingProfile) {
    await service.from("profiles").insert({
      id: user.id,
      role_id: customerRole?.id ?? null,
      full_name: fullName,
      is_active: true,
    });
  } else if (!isStaffRole(existingRoleName)) {
    await service
      .from("profiles")
      .update({
        full_name: fullName,
        ...(existingProfile.role_id ? {} : { role_id: customerRole?.id ?? null }),
      })
      .eq("id", user.id);
  } else {
    await service
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);
  }

  const { data: existingCustomer } = await service
    .from("customers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!existingCustomer) {
    const claimed = await claimGuestCustomerForUser(user);
    if (claimed) return claimed;

    const { data: created } = await service
      .from("customers")
      .insert({
        profile_id: user.id,
        email,
        full_name: fullName,
      })
      .select("id")
      .single();
    return created?.id ?? null;
  }

  // Profile already linked — still merge any orphan guest rows with the same email.
  await claimGuestCustomerForUser(user);
  return existingCustomer.id;
}

/**
 * Ensures profile + customer rows exist for a signed-in user.
 * Claims guest checkout customers (same email, profile_id null) first.
 * Primary path: authenticated RPC (no service role required).
 * Falls back to service role when configured and RPC is unavailable.
 * Never overwrites an existing staff role_id.
 */
export async function ensureCustomerRecordsForUser(user: User): Promise<string | null> {
  if (isServiceRoleConfigured()) {
    const claimed = await claimGuestCustomerForUser(user);
    if (claimed) {
      // Ensure profile exists via service path without inserting a second customer.
      await ensureViaServiceRole(user);
      return claimed;
    }
  }

  const viaRpc = await ensureViaRpc(user);
  if (viaRpc) {
    if (isServiceRoleConfigured()) {
      await claimGuestCustomerForUser(user);
    }
    return viaRpc;
  }

  if (isServiceRoleConfigured()) {
    return ensureViaServiceRole(user);
  }

  return null;
}
