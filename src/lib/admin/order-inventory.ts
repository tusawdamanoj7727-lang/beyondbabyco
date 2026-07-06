import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureInventoryRecord, getInventoryRow } from "./inventory";
import type { OrderStatus } from "@/lib/supabase/database.types";
import { FULFILLMENT_STATUSES } from "./order-types";

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

/** Restore sellable stock when a pre-shipment order is cancelled. */
export async function restoreStockForOrder(orderId: string): Promise<string | null> {
  const lines = await getOrderLines(orderId);
  const supabase = createSupabaseServiceClient();

  for (const line of lines) {
    if (!line.product_variant_id) continue;
    const { data, error } = await supabase.rpc("restore_stock", {
      p_variant_id: line.product_variant_id,
      p_quantity: line.quantity,
    });
    if (error) return error.message;
    if (!data) return `Could not restore stock for variant ${line.product_variant_id}.`;
  }
  return null;
}

/** Log sale movement when order ships (quantity already deducted at checkout). */
export async function logSaleMovementsForOrder(
  orderId: string,
  warehouseId: string,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  const lines = await getOrderLines(orderId);

  for (const line of lines) {
    if (!line.product_variant_id) continue;
    const invId = await ensureInventoryRecord(line.product_variant_id, warehouseId);
    const inv = await getInventoryRow(invId);
    if (!inv) return "Inventory record missing.";

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

  const wasFulfilled = (FULFILLMENT_STATUSES as readonly string[]).includes(prevStatus);
  const willFulfill = nextStatus === "shipped" && !wasFulfilled;

  // Storefront checkout decrements inventory at order placement.
  if (nextStatus === "cancelled" && !wasFulfilled) return restoreStockForOrder(orderId);
  if (willFulfill) return logSaleMovementsForOrder(orderId, warehouseId);
  if (nextStatus === "returned" && wasFulfilled) return returnStockForOrder(orderId, warehouseId);

  return null;
}
