"use server";

import { revalidatePath } from "next/cache";

import { getStorefrontProductsByIds } from "@/lib/catalog/storefront";
import { getCurrentUser } from "@/lib/auth/session";
import { getCustomerIdForUser } from "@/lib/orders/customer-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  cartLineKey,
  clampCartQuantity,
  mergeGuestCartIntoServer,
  productToCartItem,
  type CartItem,
} from "@/lib/storefront/cart-types";

export interface CartActionResult {
  ok: boolean;
  error: string | null;
  items?: CartItem[];
}

async function resolveCustomerId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getCustomerIdForUser(user.id);
}

async function resolveVariantId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  productId: string,
  variantId: string | null,
): Promise<string | null> {
  if (variantId) return variantId;
  const { data } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function hydrateCartRows(
  rows: { product_variant_id: string; quantity: number }[],
): Promise<CartItem[]> {
  if (rows.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const variantIds = rows.map((r) => r.product_variant_id);
  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, name, product_id, price, compare_at_price")
    .in("id", variantIds);

  const productIds = [...new Set((variants ?? []).map((v) => v.product_id))];
  const products = await getStorefrontProductsByIds(productIds);
  const productMap = new Map(products.map((p) => [p.id, p]));
  const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));
  const qtyMap = new Map(rows.map((r) => [r.product_variant_id, r.quantity]));

  const items: CartItem[] = [];
  for (const row of rows) {
    const variant = variantMap.get(row.product_variant_id);
    if (!variant) continue;
    const product = productMap.get(variant.product_id);
    if (!product) continue;
    items.push({
      ...productToCartItem(product, variant.id, variant.name, qtyMap.get(row.product_variant_id) ?? 1),
      price: variant.price ?? product.effectivePrice ?? product.price,
      compareAtPrice: variant.compare_at_price ?? product.compareAtPrice,
    });
  }
  return items;
}

export async function getServerCartItems(): Promise<CartItem[]> {
  const customerId = await resolveCustomerId();
  if (!customerId) return [];

  const supabase = await createSupabaseServerClient();
  const { data: cart } = await supabase
    .from("cart")
    .select("id")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (!cart) return [];

  const { data: rows } = await supabase
    .from("cart_items")
    .select("product_variant_id, quantity")
    .eq("cart_id", cart.id);

  return hydrateCartRows(rows ?? []);
}

export async function syncServerCartItems(items: CartItem[]): Promise<CartActionResult> {
  const customerId = await resolveCustomerId();
  if (!customerId) return { ok: false, error: "Not signed in." };

  const supabase = await createSupabaseServerClient();

  let cartId: string;
  const { data: existing } = await supabase
    .from("cart")
    .select("id")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (existing) {
    cartId = existing.id;
  } else {
    const { data: created, error } = await supabase
      .from("cart")
      .insert({ customer_id: customerId })
      .select("id")
      .single();
    if (error || !created) return { ok: false, error: error?.message ?? "Could not create cart." };
    cartId = created.id;
  }

  await supabase.from("cart_items").delete().eq("cart_id", cartId);

  if (items.length > 0) {
    const inserts: { cart_id: string; product_variant_id: string; quantity: number }[] = [];
    for (const item of items) {
      const variantId = await resolveVariantId(supabase, item.productId, item.variantId);
      if (!variantId) continue;
      inserts.push({
        cart_id: cartId,
        product_variant_id: variantId,
        quantity: clampCartQuantity(item.quantity),
      });
    }
    if (inserts.length > 0) {
      const { error } = await supabase.from("cart_items").insert(inserts);
      if (error) return { ok: false, error: error.message };
    }
  }

  await supabase.from("cart").update({ updated_at: new Date().toISOString() }).eq("id", cartId);
  revalidatePath("/cart");
  return { ok: true, error: null, items };
}

export async function mergeGuestCartOnLogin(localItems: CartItem[]): Promise<CartActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const customerId = await getCustomerIdForUser(user.id);
  if (!customerId) return { ok: false, error: "Not signed in." };

  // Only merge explicit guest-session items; authenticated carts are loaded server-side.
  const remoteItems = await getServerCartItems();
  const merged = mergeGuestCartIntoServer(localItems, remoteItems);
  const result = await syncServerCartItems(merged);
  if (!result.ok) return result;
  return { ok: true, error: null, items: merged };
}

export async function mergeGuestWishlistOnLogin(localIds: string[]): Promise<{ ok: boolean; ids: string[] }> {
  const customerId = await resolveCustomerId();
  if (!customerId) return { ok: false, ids: localIds };

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("wishlist")
    .select("product_id")
    .eq("customer_id", customerId);

  const remoteIds = (existing ?? []).map((r) => r.product_id);
  const merged = [...new Set([...remoteIds, ...localIds])];

  for (const productId of localIds) {
    if (remoteIds.includes(productId)) continue;
    await supabase.from("wishlist").insert({ customer_id: customerId, product_id: productId });
  }

  revalidatePath("/wishlist");
  return { ok: true, ids: merged };
}

export { cartLineKey };
