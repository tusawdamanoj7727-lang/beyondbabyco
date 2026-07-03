import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

/** True when the signed-in user owns the order via customers.profile_id. */
export async function userOwnsOrder(orderId: string, userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase.from("orders").select("customer_id").eq("id", orderId).maybeSingle();
  if (!order?.customer_id) return false;

  const { data: customer } = await supabase
    .from("customers")
    .select("profile_id")
    .eq("id", order.customer_id)
    .maybeSingle();

  return customer?.profile_id === userId;
}

export async function requireCustomerSession() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

export async function getCustomerIdForUser(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("customers").select("id").eq("profile_id", userId).maybeSingle();
  return data?.id ?? null;
}
