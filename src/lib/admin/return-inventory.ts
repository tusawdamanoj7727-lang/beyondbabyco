import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureInventoryRecord, getInventoryRow } from "./inventory";

export interface ReturnLineRestock {
  product_variant_id: string;
  quantity: number;
  restock_decision: string | null;
  restocked: boolean;
  return_item_id: string;
}

/** Restock return items marked as "good" and not yet restocked. Skips damaged/destroy/vendor. */
export async function restockApprovedReturnItems(
  returnId: string,
  warehouseId: string,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();

  const { data: items } = await supabase
    .from("return_items")
    .select("id, product_variant_id, quantity, restock_decision, restocked")
    .eq("return_id", returnId);

  for (const line of items ?? []) {
    if (line.restocked || line.restock_decision !== "good" || !line.product_variant_id) continue;

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
      reference: `rma:${returnId}`,
      note: "RMA restock — good condition",
      created_by: user?.id ?? null,
    });

    await supabase.from("return_items").update({ restocked: true, updated_at: new Date().toISOString() }).eq("id", line.id);
  }

  await supabase.from("returns").update({ restock_completed: true, updated_at: new Date().toISOString() }).eq("id", returnId);
  return null;
}

/** Re-export order-level return helper for full-order returns (read-only import path). */
export { returnStockForOrder } from "./order-inventory";
