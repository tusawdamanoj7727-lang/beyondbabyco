"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import type { Json } from "@/lib/supabase/database.types";
import {
  createReturnSchema,
  inspectionSchema,
  refundSchema,
  statusChangeSchema,
  bulkReturnIdsSchema,
} from "./return-schema";
import { restockApprovedReturnItems } from "./return-inventory";
import { generateRmaNumber, type ReturnStatus, type RefundStatus } from "./return-types";

export interface ReturnActionResult {
  ok: boolean;
  error: string | null;
  id?: string;
}

async function guard() {
  await requirePermission(PERMISSIONS.RETURNS_MANAGE);
}

function revalidate(id?: string) {
  revalidatePath("/admin/returns");
  if (id) revalidatePath(`/admin/returns/${id}`);
}

async function logReturnEvent(
  returnId: string,
  type: string,
  message: string,
  metadata: Record<string, unknown> = {},
) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  await supabase.from("return_events").insert({
    return_id: returnId,
    type,
    message,
    metadata: metadata as Json,
    created_by: user?.id ?? null,
  });
}

export async function createReturn(input: {
  order_id: string;
  warehouse_id?: string | null;
  reason: string;
  notes?: string | null;
  items: {
    order_item_id?: string | null;
    product_id?: string | null;
    product_variant_id?: string | null;
    name: string;
    sku?: string | null;
    quantity: number;
    unit_price: number;
  }[];
}): Promise<ReturnActionResult> {
  await guard();
  const parsed = createReturnSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("customer_id, warehouse_id")
    .eq("id", parsed.data.order_id)
    .maybeSingle();
  if (!order) return { ok: false, error: "Order not found." };

  const warehouseId = parsed.data.warehouse_id ?? order.warehouse_id;

  const { data: ret, error: retErr } = await supabase
    .from("returns")
    .insert({
      rma_number: generateRmaNumber(),
      order_id: parsed.data.order_id,
      customer_id: order.customer_id,
      warehouse_id: warehouseId,
      reason: parsed.data.reason,
      internal_notes: parsed.data.notes,
      status: "requested",
      refund_status: "pending",
    })
    .select("id")
    .single();
  if (retErr || !ret) return { ok: false, error: retErr?.message ?? "Failed to create return." };

  await supabase.from("return_items").insert(
    parsed.data.items.map((item) => ({
      return_id: ret.id,
      order_item_id: item.order_item_id,
      product_id: item.product_id,
      product_variant_id: item.product_variant_id,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
  );

  await logReturnEvent(ret.id, "requested", "Return request created.");
  await supabase.rpc("log_audit", {
    p_table: "returns",
    p_record: ret.id,
    p_action: "create",
    p_new: { order_id: parsed.data.order_id, reason: parsed.data.reason },
  });

  revalidate(ret.id);
  return { ok: true, error: null, id: ret.id };
}

export async function updateReturnStatus(
  returnId: string,
  status: ReturnStatus,
  reason?: string | null,
): Promise<ReturnActionResult> {
  await guard();
  const parsed = statusChangeSchema.safeParse({ return_id: returnId, status, reason });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid status." };

  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();

  const { data: ret } = await supabase.from("returns").select("warehouse_id, restock_completed").eq("id", returnId).maybeSingle();
  if (!ret) return { ok: false, error: "Return not found." };

  const patch: {
    status: ReturnStatus;
    updated_at: string;
    closed_at?: string;
    inspector_id?: string;
  } = { status: parsed.data.status, updated_at: new Date().toISOString() };

  if (parsed.data.status === "closed") patch.closed_at = new Date().toISOString();
  if (parsed.data.status === "inspection" && user?.id) patch.inspector_id = user.id;

  const { error } = await supabase.from("returns").update(patch).eq("id", returnId);
  if (error) return { ok: false, error: error.message };

  if (parsed.data.status === "refund_approved" && ret.warehouse_id && !ret.restock_completed) {
    const invErr = await restockApprovedReturnItems(returnId, ret.warehouse_id);
    if (invErr) return { ok: false, error: invErr };
    await logReturnEvent(returnId, "restock", "Approved items restocked to inventory.");
    await supabase.rpc("log_audit", { p_table: "returns", p_record: returnId, p_action: "restock" });
  }

  await logReturnEvent(returnId, parsed.data.status, `Status changed to ${parsed.data.status}.`, { reason: parsed.data.reason });
  await supabase.rpc("log_audit", {
    p_table: "returns",
    p_record: returnId,
    p_action: "status_change",
    p_new: { status: parsed.data.status, reason: parsed.data.reason },
  });

  revalidate(returnId);
  return { ok: true, error: null, id: returnId };
}

export async function saveInspection(input: {
  return_id: string;
  item_id: string;
  condition?: string | null;
  restock_decision?: string | null;
  damage_level?: string | null;
  inspector_notes?: string | null;
  inspection_photos?: string[];
}): Promise<ReturnActionResult> {
  await guard();
  const parsed = inspectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid inspection." };

  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();

  const { error } = await supabase
    .from("return_items")
    .update({
      condition: parsed.data.condition,
      restock_decision: parsed.data.restock_decision,
      damage_level: parsed.data.damage_level,
      inspector_notes: parsed.data.inspector_notes,
      inspection_photos: parsed.data.inspection_photos as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.item_id);
  if (error) return { ok: false, error: error.message };

  await supabase
    .from("returns")
    .update({
      status: "inspection",
      inspector_id: user?.id ?? null,
      inspection_notes: parsed.data.inspector_notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.return_id);

  await logReturnEvent(parsed.data.return_id, "inspection", `Inspection updated for item.`, {
    item_id: parsed.data.item_id,
    restock_decision: parsed.data.restock_decision,
  });
  await supabase.rpc("log_audit", {
    p_table: "return_items",
    p_record: parsed.data.item_id,
    p_action: "inspection",
    p_new: { restock_decision: parsed.data.restock_decision },
  });

  revalidate(parsed.data.return_id);
  return { ok: true, error: null, id: parsed.data.item_id };
}

export async function processRefund(input: {
  return_id: string;
  refund_type: string;
  amount: number;
  notes?: string | null;
}): Promise<ReturnActionResult> {
  await guard();
  const parsed = refundSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid refund." };

  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();

  const { data: ret } = await supabase.from("returns").select("order_id, refund_amount").eq("id", parsed.data.return_id).maybeSingle();
  if (!ret) return { ok: false, error: "Return not found." };

  const refundStatusMap: Record<string, RefundStatus> = {
    partial: "partial",
    full: "full",
    store_credit: "store_credit",
    gift_card: "gift_card",
  };
  const refundStatus = refundStatusMap[parsed.data.refund_type] ?? "partial";

  const { data: payment } = await supabase
    .from("payments")
    .select("id")
    .eq("order_id", ret.order_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (payment && parsed.data.refund_type !== "store_credit" && parsed.data.refund_type !== "gift_card") {
    await supabase.from("order_refunds").insert({
      order_id: ret.order_id,
      payment_id: payment.id,
      amount: parsed.data.amount,
      reason: `RMA refund (${parsed.data.refund_type})`,
      notes: parsed.data.notes,
      status: parsed.data.refund_type === "full" ? "refunded" : "partially_refunded",
      created_by: user?.id ?? null,
    });
  }

  const { error } = await supabase
    .from("returns")
    .update({
      refund_type: parsed.data.refund_type,
      refund_amount: parsed.data.amount,
      refund_status: refundStatus,
      status: "refunded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.return_id);
  if (error) return { ok: false, error: error.message };

  await logReturnEvent(parsed.data.return_id, "refund", `Refund processed: ${parsed.data.refund_type} ₹${parsed.data.amount}.`, {
    type: parsed.data.refund_type,
    amount: parsed.data.amount,
  });
  await supabase.rpc("log_audit", {
    p_table: "returns",
    p_record: parsed.data.return_id,
    p_action: "refund",
    p_new: { refund_type: parsed.data.refund_type, amount: parsed.data.amount },
  });

  revalidate(parsed.data.return_id);
  return { ok: true, error: null, id: parsed.data.return_id };
}

export async function closeReturn(returnId: string): Promise<ReturnActionResult> {
  return updateReturnStatus(returnId, "closed");
}

export async function approveReturn(returnId: string): Promise<ReturnActionResult> {
  return updateReturnStatus(returnId, "approved");
}

export async function rejectReturn(returnId: string, reason?: string): Promise<ReturnActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  await supabase.from("returns").update({ refund_status: "none", updated_at: new Date().toISOString() }).eq("id", returnId);
  return updateReturnStatus(returnId, "rejected", reason);
}

export async function bulkApproveReturns(ids: string[]): Promise<ReturnActionResult> {
  const parsed = bulkReturnIdsSchema.safeParse({ ids });
  if (!parsed.success) return { ok: false, error: "No returns selected." };
  for (const id of parsed.data.ids) {
    const res = await approveReturn(id);
    if (!res.ok) return res;
  }
  revalidate();
  return { ok: true, error: null };
}

export async function bulkRejectReturns(ids: string[], reason?: string): Promise<ReturnActionResult> {
  const parsed = bulkReturnIdsSchema.safeParse({ ids, reason });
  if (!parsed.success) return { ok: false, error: "No returns selected." };
  for (const id of parsed.data.ids) {
    const res = await rejectReturn(id, reason);
    if (!res.ok) return res;
  }
  revalidate();
  return { ok: true, error: null };
}

export async function bulkCloseReturns(ids: string[]): Promise<ReturnActionResult> {
  const parsed = bulkReturnIdsSchema.safeParse({ ids });
  if (!parsed.success) return { ok: false, error: "No returns selected." };
  for (const id of parsed.data.ids) {
    const res = await closeReturn(id);
    if (!res.ok) return res;
  }
  revalidate();
  return { ok: true, error: null };
}

export async function updateReturnNotes(returnId: string, notes: string | null): Promise<ReturnActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("returns").update({ internal_notes: notes, updated_at: new Date().toISOString() }).eq("id", returnId);
  if (error) return { ok: false, error: error.message };
  revalidate(returnId);
  return { ok: true, error: null, id: returnId };
}
