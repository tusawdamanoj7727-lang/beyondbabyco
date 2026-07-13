import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type OrderStockLine = {
  variantId: string;
  quantity: number;
};

export const OUT_OF_STOCK_MESSAGE = "Sorry, this item just went out of stock!";

/** Checkout reservations expire after 15 minutes if payment is not completed. */
export const CHECKOUT_RESERVATION_TTL_MINUTES = 15;

function linesToJson(lines: OrderStockLine[]) {
  return lines
    .filter((l) => l.variantId && l.quantity > 0)
    .map((l) => ({ variant_id: l.variantId, quantity: l.quantity }));
}

/** Hold stock for a pending order (increments inventory.reserved, does not decrement quantity). */
export async function reserveOrderStock(
  orderId: string,
  lines: OrderStockLine[],
  ttlMinutes = CHECKOUT_RESERVATION_TTL_MINUTES,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const payload = linesToJson(lines);
  if (!orderId || payload.length === 0) {
    return { ok: false, error: "No valid line items for stock reservation." };
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("reserve_order_inventory", {
    p_order_id: orderId,
    p_lines: payload,
    p_ttl_minutes: ttlMinutes,
  });

  if (error || !data) {
    return { ok: false, error: OUT_OF_STOCK_MESSAGE };
  }
  return { ok: true };
}

/** Convert active reservations into a sale after successful payment (or COD placement). */
export async function commitOrderStockReservations(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!orderId) {
    return { ok: false, error: "Order not found." };
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("commit_order_inventory", {
    p_order_id: orderId,
  });

  if (error || !data) {
    return { ok: false, error: "Could not commit inventory for this order." };
  }
  return { ok: true };
}

/** Release active reservations without selling (payment failed, dismissed, or expired). */
export async function releaseOrderStockReservations(
  orderId: string,
  reason: "released" | "expired" = "released",
): Promise<void> {
  if (!orderId) return;

  const supabase = createSupabaseServiceClient();
  await supabase.rpc("release_order_inventory", {
    p_order_id: orderId,
    p_status: reason,
  });
}

/** Restore quantity for committed-but-cancelled orders (admin cancel before shipment). */
export async function restoreCommittedOrderStock(orderId: string): Promise<string | null> {
  if (!orderId) return "Order not found.";

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("restore_committed_order_inventory", {
    p_order_id: orderId,
  });

  if (error) return error.message;
  if (!data) return "Could not restore committed inventory.";
  return null;
}

/**
 * Cron helper — expire reservations past TTL and cancel stale pending orders.
 * Idempotent: only `active` reservations with `expires_at < now()` are processed;
 * safe to call repeatedly (returns 0 when nothing is stale).
 */
export async function expireStaleInventoryReservations(): Promise<number> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("expire_stale_inventory_reservations");

  if (error) {
    console.error("[inventory] expire_stale_inventory_reservations failed:", error.message);
    return 0;
  }
  return typeof data === "number" ? data : 0;
}
