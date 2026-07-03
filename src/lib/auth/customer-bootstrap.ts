import "server-only";

import type { User } from "@supabase/supabase-js";

import { isServiceRoleConfigured } from "@/lib/env";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Ensures profile + customer rows exist for a signed-in user.
 * Requires service role — safe no-op when not configured.
 */
export async function ensureCustomerRecordsForUser(user: User): Promise<void> {
  if (!isServiceRoleConfigured()) return;

  const fullName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    user.email?.split("@")[0] ||
    "Customer";
  const email = user.email ?? "";

  const service = createSupabaseServiceClient();

  const { data: customerRole } = await service
    .from("roles")
    .select("id")
    .eq("name", "customer")
    .maybeSingle();

  await service.from("profiles").upsert(
    {
      id: user.id,
      role_id: customerRole?.id ?? null,
      full_name: fullName,
      is_active: true,
    },
    { onConflict: "id" },
  );

  const { data: existingCustomer } = await service
    .from("customers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!existingCustomer && email) {
    await service.from("customers").insert({
      profile_id: user.id,
      email,
      full_name: fullName,
    });
  }
}
