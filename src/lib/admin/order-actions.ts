"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import type { OrderStatus, Json } from "@/lib/supabase/database.types";
import { getPaymentGatewayAdapter } from "./gateway-adapters";
import type { GatewayProvider } from "./payment-types";
import {
  calcLineTotal,
  calcOrderTotals,
  createOrderSchema,
  fieldErrorsFrom,
  generateOrderNumber,
  refundSchema,
  type CreateOrderInput,
} from "./order-schema";
import { handleOrderStatusInventory } from "./order-inventory";
import {
  onOrderCancelled,
  onOrderStatusChanged,
  onRefundCompleted,
  onRefundInitiated,
} from "@/lib/email/events/orders";

export interface OrderActionResult {
  ok: boolean;
  error: string | null;
  id?: string;
  fieldErrors?: Record<string, string>;
}

async function guard() {
  await requirePermission(PERMISSIONS.ORDERS_MANAGE);
}

function revalidateOrders(id?: string) {
  revalidatePath("/admin/orders");
  revalidatePath("/admin/shipments");
  if (id) revalidatePath(`/admin/orders/${id}`);
}

async function logOrderEvent(
  orderId: string,
  type: string,
  message: string,
  metadata: Record<string, unknown> = {},
) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  await supabase.from("order_events").insert({
    order_id: orderId,
    type,
    message,
    metadata: metadata as Json,
    created_by: user?.id ?? null,
  });
}

export async function createOrder(raw: CreateOrderInput): Promise<OrderActionResult> {
  await guard();
  const parsed = createOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  const d = parsed.data;

  const lineItems = d.items.map((item) => ({
    ...item,
    total: calcLineTotal(item.unit_price, item.quantity, item.tax_rate),
  }));
  const totals = calcOrderTotals(lineItems, d.shipping_total, d.discount_total);

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: generateOrderNumber(),
      customer_id: d.customer_id,
      warehouse_id: d.warehouse_id,
      shipping_method_id: d.shipping_method_id,
      status: d.status,
      subtotal: totals.subtotal,
      discount_total: totals.discountTotal,
      tax_total: totals.taxTotal,
      shipping_total: totals.shippingTotal,
      grand_total: totals.grandTotal,
      notes: d.notes,
      internal_notes: d.internal_notes,
      placed_at: d.status === "pending" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (orderErr || !order) return { ok: false, error: orderErr?.message ?? "Failed to create order." };

  const { error: itemsErr } = await supabase.from("order_items").insert(
    lineItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_variant_id: item.product_variant_id,
      name: item.name,
      sku: item.sku,
      unit_price: item.unit_price,
      quantity: item.quantity,
      tax_rate: item.tax_rate,
      total: item.total,
    })),
  );
  if (itemsErr) return { ok: false, error: itemsErr.message };

  const { error: addrErr } = await supabase.from("shipping_addresses").insert({
    order_id: order.id,
    ...d.shipping_address,
  });
  if (addrErr) return { ok: false, error: addrErr.message };

  await supabase.from("payments").insert({
    order_id: order.id,
    amount: totals.grandTotal,
    status: "pending",
  });

  await logOrderEvent(order.id, "created", `Order created as ${d.status}.`);
  await supabase.rpc("log_audit", {
    p_table: "orders",
    p_record: order.id,
    p_action: "create",
    p_new: { status: d.status, grand_total: totals.grandTotal },
  });

  revalidateOrders(order.id);
  return { ok: true, error: null, id: order.id };
}

export async function updateOrderNotes(
  orderId: string,
  notes: string | null,
  internalNotes: string | null,
): Promise<OrderActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("orders")
    .update({ notes, internal_notes: internalNotes, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  await logOrderEvent(orderId, "notes_updated", "Order notes updated.");
  revalidateOrders(orderId);
  return { ok: true, error: null, id: orderId };
}

export async function updateOrderStatus(orderId: string, nextStatus: OrderStatus): Promise<OrderActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();

  const { data: order } = await supabase.from("orders").select("id, status, warehouse_id").eq("id", orderId).maybeSingle();
  if (!order) return { ok: false, error: "Order not found." };

  const prevStatus = order.status;
  if (prevStatus === nextStatus) return { ok: true, error: null, id: orderId };

  const invErr = await handleOrderStatusInventory(orderId, order.warehouse_id, prevStatus, nextStatus);
  if (invErr) return { ok: false, error: invErr };

  const patch: {
    status: OrderStatus;
    updated_at: string;
    cancelled_at?: string;
  } = { status: nextStatus, updated_at: new Date().toISOString() };
  if (nextStatus === "cancelled") {
    patch.cancelled_at = new Date().toISOString();
  }
  if (nextStatus === "shipped") {
    const { data: shipment } = await supabase.from("shipments").select("id").eq("order_id", orderId).maybeSingle();
    if (shipment) {
      await supabase
        .from("shipments")
        .update({ status: "in_transit", shipped_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", shipment.id);
    }
  }

  const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  await logOrderEvent(orderId, "status_change", `Status changed from ${prevStatus} to ${nextStatus}.`, {
    from: prevStatus,
    to: nextStatus,
  });
  await supabase.rpc("log_audit", {
    p_table: "orders",
    p_record: orderId,
    p_action: "status_change",
    p_new: { from: prevStatus, to: nextStatus },
  });

  revalidateOrders(orderId);
  onOrderStatusChanged(orderId, nextStatus);
  return { ok: true, error: null, id: orderId };
}

export async function cancelOrder(orderId: string, reason: string): Promise<OrderActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase.from("orders").select("status, warehouse_id").eq("id", orderId).maybeSingle();
  if (!order) return { ok: false, error: "Order not found." };
  if (order.status === "cancelled") return { ok: false, error: "Order is already cancelled." };

  const invErr = await handleOrderStatusInventory(orderId, order.warehouse_id, order.status, "cancelled");
  if (invErr) return { ok: false, error: invErr };

  const { error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      cancel_reason: reason,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  await logOrderEvent(orderId, "cancelled", `Order cancelled: ${reason}`, { reason });
  await supabase.rpc("log_audit", {
    p_table: "orders",
    p_record: orderId,
    p_action: "cancel",
    p_new: { reason },
  });

  revalidateOrders(orderId);
  onOrderCancelled(orderId);
  return { ok: true, error: null, id: orderId };
}

export async function duplicateOrder(orderId: string): Promise<OrderActionResult> {
  await guard();
  const supabase = await createSupabaseServerClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return { ok: false, error: "Order not found." };

  const [{ data: items }, { data: address }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", orderId),
    supabase.from("shipping_addresses").select("*").eq("order_id", orderId).maybeSingle(),
  ]);

  const { data: copy, error: copyErr } = await supabase
    .from("orders")
    .insert({
      order_number: generateOrderNumber(),
      customer_id: order.customer_id,
      warehouse_id: order.warehouse_id,
      shipping_method_id: order.shipping_method_id,
      status: "draft",
      subtotal: order.subtotal,
      discount_total: order.discount_total,
      tax_total: order.tax_total,
      shipping_total: order.shipping_total,
      grand_total: order.grand_total,
      currency: order.currency,
      notes: order.notes,
    })
    .select("id")
    .single();
  if (copyErr || !copy) return { ok: false, error: copyErr?.message ?? "Duplicate failed." };

  if (items?.length) {
    await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: copy.id,
        product_id: i.product_id,
        product_variant_id: i.product_variant_id,
        name: i.name,
        sku: i.sku,
        unit_price: i.unit_price,
        quantity: i.quantity,
        tax_rate: i.tax_rate,
        total: i.total,
      })),
    );
  }
  if (address) {
    await supabase.from("shipping_addresses").insert({
      order_id: copy.id,
      full_name: address.full_name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      country: address.country,
      pincode: address.pincode,
    });
  }

  await supabase.from("payments").insert({ order_id: copy.id, amount: order.grand_total, status: "pending" });
  await logOrderEvent(copy.id, "duplicated", `Duplicated from order ${order.order_number}.`, { source_order_id: orderId });
  await supabase.rpc("log_audit", {
    p_table: "orders",
    p_record: copy.id,
    p_action: "duplicate",
    p_new: { source_order_id: orderId },
  });

  revalidateOrders(copy.id);
  return { ok: true, error: null, id: copy.id };
}

export async function createRefund(input: {
  order_id: string;
  amount: number;
  reason?: string | null;
  notes?: string | null;
  full?: boolean;
}): Promise<OrderActionResult> {
  await guard();
  const parsed = refundSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid refund." };

  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  const { data: order } = await supabase.from("orders").select("grand_total, status").eq("id", parsed.data.order_id).maybeSingle();
  if (!order) return { ok: false, error: "Order not found." };

  const { data: payment } = await supabase
    .from("payments")
    .select("id, amount, status, method, provider, gateway_id, gateway_txn_id, payment_ref, currency")
    .eq("order_id", parsed.data.order_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const refundAmount = parsed.data.full ? Number(order.grand_total) : parsed.data.amount;
  const refundStatus = parsed.data.full || refundAmount >= Number(order.grand_total) ? "refunded" : "partially_refunded";

  let gatewayRefundId: string | null = null;
  let providerPayload: Json | null = null;

  const isRazorpay =
    payment &&
    (payment.method === "razorpay" || payment.provider === "razorpay") &&
    ["paid", "captured", "partially_refunded"].includes(payment.status);

  if (isRazorpay && payment) {
    let gatewayProvider: GatewayProvider = "razorpay";
    if (payment.gateway_id) {
      const { data: g } = await supabase
        .from("payment_gateways")
        .select("provider")
        .eq("id", payment.gateway_id)
        .maybeSingle();
      if (g) gatewayProvider = g.provider as GatewayProvider;
    }

    const adapter = getPaymentGatewayAdapter(gatewayProvider);
    const gatewayResult = await adapter.refundPayment({
      gatewayTxnId: payment.gateway_txn_id ?? payment.id,
      paymentRef: payment.payment_ref,
      amount: refundAmount,
      currency: payment.currency ?? "INR",
      reason: parsed.data.reason,
      notes: { order_id: parsed.data.order_id },
    });

    if (!gatewayResult.success || !gatewayResult.data?.refundId) {
      return { ok: false, error: gatewayResult.message ?? "Razorpay refund failed." };
    }
    gatewayRefundId = gatewayResult.data.refundId;
    providerPayload = { provider: gatewayProvider, refund_id: gatewayRefundId } as Json;
  }

  const { data: refund, error: refundErr } = await supabase
    .from("order_refunds")
    .insert({
      order_id: parsed.data.order_id,
      payment_id: payment?.id ?? null,
      amount: refundAmount,
      reason: parsed.data.reason,
      notes: parsed.data.notes,
      status: refundStatus,
      created_by: user?.id ?? null,
      gateway_refund_id: gatewayRefundId,
      provider_payload: providerPayload,
    })
    .select("id")
    .single();
  if (refundErr) return { ok: false, error: refundErr.message };

  if (payment) {
    await supabase.from("payments").update({ status: refundStatus, updated_at: new Date().toISOString() }).eq("id", payment.id);
    await supabase.from("payment_transactions").insert({
      payment_id: payment.id,
      amount: -refundAmount,
      status: refundStatus,
      txn_ref: gatewayRefundId ? `refund:${gatewayRefundId}` : `refund:${refund?.id}`,
      gateway_txn_id: gatewayRefundId,
    });
  }

  const nextOrderStatus: OrderStatus = parsed.data.full ? "refunded" : order.status;
  if (parsed.data.full) {
    await supabase.from("orders").update({ status: "refunded", updated_at: new Date().toISOString() }).eq("id", parsed.data.order_id);
  }

  await logOrderEvent(parsed.data.order_id, "refund", `Refund of ₹${refundAmount} processed.`, {
    amount: refundAmount,
    full: parsed.data.full,
    gateway_refund_id: gatewayRefundId,
  });
  await supabase.rpc("log_audit", {
    p_table: "order_refunds",
    p_record: refund?.id,
    p_action: "create",
    p_new: {
      order_id: parsed.data.order_id,
      amount: refundAmount,
      status: nextOrderStatus,
      gateway_refund_id: gatewayRefundId,
    },
  });

  revalidateOrders(parsed.data.order_id);
  onRefundInitiated(parsed.data.order_id, `₹${refundAmount}`);
  if (parsed.data.full) {
    onRefundCompleted(parsed.data.order_id, `₹${refundAmount}`);
  }
  return { ok: true, error: null, id: refund?.id };
}

export async function bulkCancelOrders(ids: string[], reason: string): Promise<OrderActionResult> {
  await guard();
  for (const id of ids) {
    const result = await cancelOrder(id, reason);
    if (!result.ok) return result;
  }
  revalidateOrders();
  return { ok: true, error: null };
}

export async function recordDocumentGenerated(orderId: string, docType: string): Promise<void> {
  await guard();
  const supabase = await createSupabaseServerClient();
  await logOrderEvent(orderId, "document", `${docType} generated.`, { docType });
  await supabase.rpc("log_audit", {
    p_table: "orders",
    p_record: orderId,
    p_action: "document",
    p_new: { docType },
  });
}

/** Force-resend customer tax invoice email with PDF attachment. */
export async function resendOrderInvoice(orderId: string): Promise<OrderActionResult> {
  await guard();
  const { dispatchOrderEmail } = await import("@/lib/email/dispatch");
  const result = await dispatchOrderEmail(orderId, "invoice", { force: true });
  if (!result.sent) {
    return {
      ok: false,
      error: result.error ?? (result.skipped ? "Invoice email was skipped." : "Failed to resend invoice."),
    };
  }
  await logOrderEvent(orderId, "email", "Tax invoice resent to customer.", {
    templateId: "invoice",
  });
  revalidateOrders(orderId);
  return { ok: true, error: null };
}

/**
 * Regenerate tax invoice (stateless PDF rebuild) and record an audit event.
 * Opens via documents route; this action only logs regeneration.
 */
export async function regenerateOrderInvoice(orderId: string): Promise<OrderActionResult> {
  await guard();
  const { generateOrderInvoice } = await import("@/lib/invoices/generate-order-invoice");
  const generated = await generateOrderInvoice(orderId, "invoice");
  if (!generated) {
    return { ok: false, error: "Order not found." };
  }
  await recordDocumentGenerated(orderId, "invoice");
  await logOrderEvent(orderId, "document", "Tax invoice regenerated.", {
    invoiceNumber: generated.data.invoiceNumber,
    bytes: generated.bytes.byteLength,
  });
  revalidateOrders(orderId);
  return { ok: true, error: null };
}

