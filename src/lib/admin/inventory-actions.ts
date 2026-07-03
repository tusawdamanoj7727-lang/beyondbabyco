"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import {
  adjustStockSchema,
  generatePoNumber,
  purchaseOrderInputSchema,
  receiveGoodsSchema,
} from "./inventory-schema";
import { ensureInventoryRecord, getInventoryRow } from "./inventory";
import type { PoStatus } from "@/lib/supabase/database.types";

export interface InventoryActionResult {
  ok: boolean;
  error: string | null;
  id?: string;
}

async function guard() {
  await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
}

function revalidate() {
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/adjustments");
}

export async function adjustStock(input: {
  inventoryId: string;
  direction: "increase" | "decrease";
  quantity: number;
  reason: string;
  note?: string | null;
}): Promise<InventoryActionResult> {
  await guard();
  const parsed = adjustStockSchema.safeParse({
    inventory_id: input.inventoryId,
    direction: input.direction,
    quantity: input.quantity,
    reason: input.reason,
    note: input.note ?? null,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  const row = await getInventoryRow(parsed.data.inventory_id);
  if (!row) return { ok: false, error: "Inventory record not found." };

  const delta = parsed.data.direction === "increase" ? parsed.data.quantity : -parsed.data.quantity;
  const nextQty = row.quantity + delta;
  if (nextQty < 0) return { ok: false, error: "Adjustment would result in negative stock." };

  const { error: updErr } = await supabase
    .from("inventory")
    .update({ quantity: nextQty, updated_at: new Date().toISOString() })
    .eq("id", row.id);
  if (updErr) return { ok: false, error: updErr.message };

  const { data: movement, error: movErr } = await supabase
    .from("stock_movements")
    .insert({
      inventory_id: row.id,
      type: "adjustment",
      quantity: Math.abs(parsed.data.quantity),
      reason: parsed.data.reason,
      note: parsed.data.note,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (movErr) return { ok: false, error: movErr.message };

  await supabase.rpc("log_audit", {
    p_table: "inventory",
    p_record: row.id,
    p_action: "update",
    p_new: { adjustment: delta, reason: parsed.data.reason, movement_id: movement?.id },
  });

  revalidate();
  return { ok: true, error: null, id: movement?.id };
}

export async function bulkUpdateReorderLevel(ids: string[], reorderLevel: number) {
  await guard();
  if (!ids.length) return;
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("inventory")
    .update({ reorder_level: Math.max(0, reorderLevel), updated_at: new Date().toISOString() })
    .in("id", ids);

  await supabase.rpc("log_audit", {
    p_table: "inventory",
    p_record: ids[0],
    p_action: "update",
    p_new: { bulk_reorder_level: reorderLevel, count: ids.length },
  });
  revalidate();
}

export async function createPurchaseOrder(input: {
  supplierId: string | null;
  warehouseId: string | null;
  expectedAt: string | null;
  notes: string | null;
  items: { productVariantId: string; quantity: number; unitCost: number }[];
}): Promise<InventoryActionResult> {
  await guard();
  const parsed = purchaseOrderInputSchema.safeParse({
    supplier_id: input.supplierId,
    warehouse_id: input.warehouseId,
    expected_at: input.expectedAt,
    notes: input.notes,
    items: input.items.map((i) => ({
      product_variant_id: i.productVariantId,
      quantity: i.quantity,
      unit_cost: i.unitCost,
    })),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid PO." };
  if (!parsed.data.warehouse_id) return { ok: false, error: "Select a warehouse." };

  const supabase = await createSupabaseServerClient();
  const total = parsed.data.items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

  const { data: po, error } = await supabase
    .from("purchase_orders")
    .insert({
      po_number: generatePoNumber(),
      supplier_id: parsed.data.supplier_id,
      warehouse_id: parsed.data.warehouse_id,
      status: "draft",
      total,
      expected_at: parsed.data.expected_at,
      notes: parsed.data.notes,
    })
    .select("id")
    .single();

  if (error || !po) return { ok: false, error: error?.message ?? "Could not create PO." };

  const { error: itemsErr } = await supabase.from("purchase_order_items").insert(
    parsed.data.items.map((i) => ({
      purchase_order_id: po.id,
      product_variant_id: i.product_variant_id,
      quantity: i.quantity,
      unit_cost: i.unit_cost,
    })),
  );
  if (itemsErr) {
    await supabase.from("purchase_orders").delete().eq("id", po.id);
    return { ok: false, error: itemsErr.message };
  }

  await supabase.rpc("log_audit", {
    p_table: "purchase_orders",
    p_record: po.id,
    p_action: "insert",
    p_new: { total, items: parsed.data.items.length },
  });

  revalidate();
  return { ok: true, error: null, id: po.id };
}

export async function updatePurchaseOrderStatus(id: string, status: PoStatus): Promise<InventoryActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const patch: { status: PoStatus; updated_at: string; ordered_at?: string } = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "sent") patch.ordered_at = new Date().toISOString();

  const { error } = await supabase.from("purchase_orders").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await supabase.rpc("log_audit", {
    p_table: "purchase_orders",
    p_record: id,
    p_action: "update",
    p_new: { status },
  });
  revalidate();
  return { ok: true, error: null };
}

export async function cancelPurchaseOrder(id: string): Promise<InventoryActionResult> {
  return updatePurchaseOrderStatus(id, "cancelled");
}

export async function receivePurchaseOrder(input: {
  purchaseOrderId: string;
  lines: { itemId: string; quantity: number }[];
}): Promise<InventoryActionResult> {
  await guard();
  const parsed = receiveGoodsSchema.safeParse({
    purchase_order_id: input.purchaseOrderId,
    lines: input.lines.map((l) => ({ item_id: l.itemId, quantity: l.quantity })),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid receive data." };

  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();

  const { data: po } = await supabase
    .from("purchase_orders")
    .select("id, warehouse_id, status")
    .eq("id", parsed.data.purchase_order_id)
    .maybeSingle();

  if (!po) return { ok: false, error: "Purchase order not found." };
  if (po.status === "cancelled" || po.status === "received") {
    return { ok: false, error: "This purchase order cannot be received." };
  }
  if (!po.warehouse_id) return { ok: false, error: "PO has no warehouse." };

  const { data: allItems } = await supabase
    .from("purchase_order_items")
    .select("*")
    .eq("purchase_order_id", po.id);

  const itemMap = new Map((allItems ?? []).map((i) => [i.id, i]));
  let receivedAny = false;

  for (const line of parsed.data.lines) {
    if (line.quantity <= 0) continue;
    const item = itemMap.get(line.item_id);
    if (!item) continue;

    const remaining = item.quantity - (item.quantity_received ?? 0);
    const qty = Math.min(line.quantity, remaining);
    if (qty <= 0) continue;

    const inventoryId = await ensureInventoryRecord(item.product_variant_id, po.warehouse_id);
    const inv = await getInventoryRow(inventoryId);
    if (!inv) continue;

    const nextQty = inv.quantity + qty;
    await supabase
      .from("inventory")
      .update({ quantity: nextQty, updated_at: new Date().toISOString() })
      .eq("id", inventoryId);

    await supabase.from("stock_movements").insert({
      inventory_id: inventoryId,
      type: "purchase",
      quantity: qty,
      reference: `po:${po.id}`,
      note: `Received from ${po.id}`,
      created_by: user?.id ?? null,
    });

    await supabase
      .from("purchase_order_items")
      .update({ quantity_received: (item.quantity_received ?? 0) + qty })
      .eq("id", item.id);

    item.quantity_received = (item.quantity_received ?? 0) + qty;
    receivedAny = true;
  }

  if (!receivedAny) return { ok: false, error: "No quantities to receive." };

  const fullyReceived = [...itemMap.values()].every(
    (i) => (i.quantity_received ?? 0) >= i.quantity,
  );

  await supabase
    .from("purchase_orders")
    .update({
      status: fullyReceived ? "received" : "sent",
      received_at: fullyReceived ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", po.id);

  await supabase.rpc("log_audit", {
    p_table: "purchase_orders",
    p_record: po.id,
    p_action: "update",
    p_new: { received: true, fully_received: fullyReceived },
  });

  revalidate();
  return { ok: true, error: null, id: po.id };
}

/** Create inventory row for variant + warehouse (used when first stocking). */
export async function initInventoryRecord(
  variantId: string,
  warehouseId: string,
  reorderLevel = 0,
): Promise<InventoryActionResult> {
  await guard();
  try {
    const id = await ensureInventoryRecord(variantId, warehouseId);
    if (reorderLevel > 0) {
      const supabase = await createSupabaseServerClient();
      await supabase.from("inventory").update({ reorder_level: reorderLevel }).eq("id", id);
    }
    revalidate();
    return { ok: true, error: null, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function searchVariants(query: string) {
  await guard();
  const { getVariantOptions } = await import("./inventory");
  return getVariantOptions(query);
}

export async function previewAdjustment(inventoryId: string, direction: "increase" | "decrease", quantity: number) {
  await guard();
  const row = await getInventoryRow(inventoryId);
  if (!row) return null;
  const delta = direction === "increase" ? quantity : -quantity;
  const available = Math.max(0, row.quantity - row.reserved);
  return {
    currentQuantity: row.quantity,
    available,
    delta,
    nextQuantity: row.quantity + delta,
    valid: row.quantity + delta >= 0,
  };
}

export async function fetchPurchaseOrder(id: string) {
  await guard();
  const { getPurchaseOrder } = await import("./inventory");
  return getPurchaseOrder(id);
}
