"use server";

import { revalidatePath } from "next/cache";

import { ensureCustomerRecordsForUser } from "@/lib/auth/customer-bootstrap";
import { getCurrentUser } from "@/lib/auth/session";
import { getCustomerIdForUser } from "@/lib/orders/customer-auth";
import { getStorefrontProductsByIds } from "@/lib/catalog/storefront";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface WishlistActionResult {
  ok: boolean;
  error: string | null;
  inWishlist?: boolean;
}

async function resolveCustomerId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const existing = await getCustomerIdForUser(user.id);
  if (existing) return existing;
  try {
    return await ensureCustomerRecordsForUser(user);
  } catch {
    return null;
  }
}

export async function toggleWishlistAction(productId: string): Promise<WishlistActionResult> {
  if (!productId?.trim()) {
    return { ok: false, error: "Invalid product." };
  }

  const customerId = await resolveCustomerId();
  if (!customerId) {
    return { ok: false, error: "Sign in to save items to your wishlist." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing, error: lookupError } = await supabase
    .from("wishlist")
    .select("id")
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .maybeSingle();

  if (lookupError) return { ok: false, error: lookupError.message };

  if (existing) {
    const { error } = await supabase.from("wishlist").delete().eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/wishlist");
    return { ok: true, error: null, inWishlist: false };
  }

  const { error } = await supabase.from("wishlist").insert({
    customer_id: customerId,
    product_id: productId,
  });

  if (error) {
    // Unique race: treat as already wishlisted.
    if (error.code === "23505") {
      revalidatePath("/wishlist");
      return { ok: true, error: null, inWishlist: true };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/wishlist");
  return { ok: true, error: null, inWishlist: true };
}

export async function removeFromWishlistAction(productId: string): Promise<WishlistActionResult> {
  const customerId = await resolveCustomerId();
  if (!customerId) return { ok: false, error: "Not signed in." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("wishlist")
    .delete()
    .eq("customer_id", customerId)
    .eq("product_id", productId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/wishlist");
  return { ok: true, error: null, inWishlist: false };
}

export async function getWishlistProductIds(): Promise<string[]> {
  const customerId = await resolveCustomerId();
  if (!customerId) return [];

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("wishlist")
    .select("product_id")
    .eq("customer_id", customerId);

  return (data ?? []).map((r) => r.product_id);
}

export async function getWishlistProducts() {
  const ids = await getWishlistProductIds();
  return getStorefrontProductsByIds(ids);
}

export async function getPublicProductsByIds(ids: string[]) {
  return getStorefrontProductsByIds(ids);
}
