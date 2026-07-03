import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureInventoryRecord, getInventoryRow } from "./inventory";
import type { OrderStatus } from "@/lib/supabase/database.types";
import { FULFILLMENT_STATUSES, RESERVATION_STATUSES } from "./order-types";

interface OrderLine {
  product_variant_id: string | null;
  quantity: number;
}

async function getOrderLines(orderId: string): Promise<OrderLine[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("order_items")
    .select("product_variant_id, quantity")
    .eq("order_id", orderId);
  return (data ?? []).filter((i) => i.product_variant_id) as OrderLine[];
}

/** Reserve stock when an order is confirmed. */
export async function reserveStockForOrder(orderId: string, warehouseId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const lines = await getOrderLines(orderId);

  for (const line of lines) {
    if (!line.product_variant_id) continue;
    const invId = await ensureInventoryRecord(line.product_variant_id, warehouseId);
    const inv = await getInventoryRow(invId);
    if (!inv) return "Inventory record missing.";
    const available = inv.quantity - inv.reserved;
    if (available < line.quantity) return `Insufficient stock for variant ${line.product_variant_id}.`;

    const { error } = await supabase
      .from("inventory")
      .update({ reserved: inv.reserved + line.quantity, updated_at: new Date().toISOString() })
      .eq("id", invId);
    if (error) return error.message;
  }
  return null;
}

/** Release reservations when cancelled before shipment. */
export async function releaseStockForOrder(orderId: string, warehouseId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const lines = await getOrderLines(orderId);

  for (const line of lines) {
    if (!line.product_variant_id) continue;
    const { data: inv } = await supabase
      .from("inventory")
      .select("id, reserved")
      .eq("product_variant_id", line.product_variant_id)
      .eq("warehouse_id", warehouseId)
      .maybeSingle();
    if (!inv) continue;

    const { error } = await supabase
      .from("inventory")
      .update({
        reserved: Math.max(0, inv.reserved - line.quantity),
        updated_at: new Date().toISOString(),
      })
      .eq("id", inv.id);
    if (error) return error.message;
  }
  return null;
}

/** Deduct stock and log sale movement when order ships. */
export async function fulfillStockForOrder(orderId: string, warehouseId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  const lines = await getOrderLines(orderId);

  for (const line of lines) {
    if (!line.product_variant_id) continue;
    const { data: inv } = await supabase
      .from("inventory")
      .select("id, quantity, reserved")
      .eq("product_variant_id", line.product_variant_id)
      .eq("warehouse_id", warehouseId)
      .maybeSingle();
    if (!inv) return "Inventory record missing.";

    const nextQty = inv.quantity - line.quantity;
    const nextReserved = Math.max(0, inv.reserved - line.quantity);
    if (nextQty < 0) return "Cannot ship — insufficient on-hand stock.";

    const { error } = await supabase
      .from("inventory")
      .update({ quantity: nextQty, reserved: nextReserved, updated_at: new Date().toISOString() })
      .eq("id", inv.id);
    if (error) return error.message;

    await supabase.from("stock_movements").insert({
      inventory_id: inv.id,
      type: "sale",
      quantity: line.quantity,
      reference: `order:${orderId}`,
      note: "Order shipped",
      created_by: user?.id ?? null,
    });
  }
  return null;
}

/** Restock inventory when an order is returned. */
export async function returnStockForOrder(orderId: string, warehouseId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  const lines = await getOrderLines(orderId);

  for (const line of lines) {
    if (!line.product_variant_id) continue;
    const invId = await ensureInventoryRecord(line.product_variant_id, warehouseId);
    const inv = await getInventoryRow(invId);
    if (!inv) return "Inventory record missing.";

    const { error } = await supabase
      .from("inventory")
      .update({ quantity: inv.quantity + line.quantity, updated_at: new Date().toISOString() })
      .eq("id", invId);
    if (error) return error.message;

    await supabase.from("stock_movements").insert({
      inventory_id: invId,
      type: "return",
      quantity: line.quantity,
      reference: `order:${orderId}`,
      note: "Order returned",
      created_by: user?.id ?? null,
    });
  }
  return null;
}

/** Apply inventory side-effects for an order status transition. */
export async function handleOrderStatusInventory(
  orderId: string,
  warehouseId: string | null,
  prevStatus: OrderStatus,
  nextStatus: OrderStatus,
): Promise<string | null> {
  if (!warehouseId) return null;

  const wasReserved = (RESERVATION_STATUSES as readonly string[]).includes(prevStatus);
  const willReserve = (RESERVATION_STATUSES as readonly string[]).includes(nextStatus);
  const wasFulfilled = (FULFILLMENT_STATUSES as readonly string[]).includes(prevStatus);
  const willFulfill = nextStatus === "shipped" && !wasFulfilled;

  if (nextStatus === "confirmed" && !wasReserved) return reserveStockForOrder(orderId, warehouseId);
  if (nextStatus === "cancelled" && wasReserved && !wasFulfilled) return releaseStockForOrder(orderId, warehouseId);
  if (willFulfill) return fulfillStockForOrder(orderId, warehouseId);
  if (nextStatus === "returned" && wasFulfilled) return returnStockForOrder(orderId, warehouseId);

  if (willReserve && !wasReserved && nextStatus !== "confirmed") return reserveStockForOrder(orderId, warehouseId);
  return null;
}
