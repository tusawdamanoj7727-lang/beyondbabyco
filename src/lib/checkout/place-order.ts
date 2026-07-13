import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { applyCoupon } from "@/lib/coupons/queries";
import { generateOrderNumber, calcLineTotal } from "@/lib/admin/order-schema";
import { fulfillOrderWithDelhivery } from "@/lib/checkout/fulfillment";
import {
  commitOrderStockReservations,
  releaseOrderStockReservations,
  reserveOrderStock,
  type OrderStockLine,
} from "@/lib/inventory/order-reservations";
import { placeOrderSchema, type PlaceOrderInput } from "@/lib/checkout/schema";
import { resolveCheckoutCart } from "@/lib/checkout/resolve-order-cart";
import { createRazorpayOrder } from "@/lib/checkout/razorpay-client";
import {
  getEnabledRazorpayGateway,
  PAYMENT_GATEWAY_NOT_CONFIGURED_MESSAGE,
} from "@/lib/checkout/gateways";
import { onOrderCreated } from "@/lib/email/events/orders";
import { runOrderShippingEmail } from "@/lib/email/lifecycle";

export interface PlaceOrderResult {
  ok: boolean;
  error: string | null;
  orderId?: string;
  orderNumber?: string;
  grandTotal?: number;
  razorpayOrderId?: string;
  razorpayKeyId?: string;
  paymentMethod?: "razorpay" | "cod";
}

async function getDefaultWarehouseId(supabase: ReturnType<typeof createSupabaseServiceClient>) {
  const { data } = await supabase
    .from("warehouses")
    .select("id")
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function findOrderByIdempotencyKey(
  customerId: string,
  idempotencyKey: string,
): Promise<{
  id: string;
  order_number: string;
  grand_total: number;
  razorpayOrderId?: string;
  razorpayKeyId?: string;
  paymentMethod?: "razorpay" | "cod";
} | null> {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, grand_total")
    .eq("customer_id", customerId)
    .eq("notes", `idempotency:${idempotencyKey}`)
    .maybeSingle();

  if (!data) return null;

  const { data: payment } = await supabase
    .from("payments")
    .select("status, method, gateway_txn_id, provider")
    .eq("order_id", data.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const paymentMethod =
    payment?.method === "cod" || payment?.provider === "cod"
      ? ("cod" as const)
      : payment?.method === "razorpay" || payment?.provider === "razorpay"
        ? ("razorpay" as const)
        : undefined;

  let razorpayOrderId: string | undefined;
  let razorpayKeyId: string | undefined;

  if (
    paymentMethod === "razorpay" &&
    payment?.status === "pending" &&
    payment.gateway_txn_id
  ) {
    razorpayOrderId = payment.gateway_txn_id;
    const gateway = await getEnabledRazorpayGateway();
    razorpayKeyId = gateway?.keyId ?? undefined;
  }

  return {
    id: data.id,
    order_number: data.order_number,
    grand_total: Number(data.grand_total),
    razorpayOrderId,
    razorpayKeyId,
    paymentMethod,
  };
}

export async function placeStorefrontOrder(
  customerId: string,
  raw: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  const parsed = placeOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid checkout data." };
  }

  const input = parsed.data;

  if (input.paymentMethod === "razorpay") {
    const gateway = await getEnabledRazorpayGateway();
    if (!gateway?.keyId || !gateway.keySecret) {
      return { ok: false, error: PAYMENT_GATEWAY_NOT_CONFIGURED_MESSAGE };
    }
  }

  const existing = await findOrderByIdempotencyKey(customerId, input.idempotencyKey);
  if (existing) {
    return {
      ok: true,
      error: null,
      orderId: existing.id,
      orderNumber: existing.order_number,
      grandTotal: Number(existing.grand_total),
      razorpayOrderId: existing.razorpayOrderId,
      razorpayKeyId: existing.razorpayKeyId,
      paymentMethod: existing.paymentMethod ?? input.paymentMethod,
    };
  }

  // Server-authoritative pricing — never trust client-submitted amounts.
  const resolved = await resolveCheckoutCart({
    customerId,
    cartItems: input.cartItems,
    couponCode: input.couponCode,
    buyerState: input.shipping.state,
  });
  if (!resolved.ok) {
    return { ok: false, error: resolved.error };
  }

  const { lines, coupon, gstBreakdown, totals } = resolved.cart;
  const subtotal = resolved.cart.subtotal;

  const supabase = createSupabaseServiceClient();
  const warehouseId = await getDefaultWarehouseId(supabase);
  const orderNumber = generateOrderNumber();

  const stockLines: OrderStockLine[] = lines.map((line) => ({
    variantId: line.variantId,
    quantity: line.quantity,
  }));

  const lineItems = lines.map((line) => ({
    product_id: line.productId,
    product_variant_id: line.variantId,
    name: line.variantName ? `${line.name} — ${line.variantName}` : line.name,
    sku: line.sku,
    unit_price: line.unitPrice,
    quantity: line.quantity,
    tax_rate: line.gstRate,
    total: calcLineTotal(line.unitPrice, line.quantity, 0),
  }));

  let orderId: string | undefined;
  let stockReserved = false;
  let stockCommitted = false;
  let keepReservation = false;

  try {
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: customerId,
      warehouse_id: warehouseId,
      status: "pending",
      subtotal: totals.subtotal,
      discount_total: totals.discountTotal,
      tax_total: totals.taxTotal,
      shipping_total: totals.shippingTotal,
      grand_total: totals.grandTotal,
      cgst_amount: gstBreakdown.cgst,
      sgst_amount: gstBreakdown.sgst,
      igst_amount: gstBreakdown.igst,
      shipping_state: input.shipping.state,
      buyer_gstin: input.buyerGstin?.trim() || null,
      coupon_id: coupon?.couponId ?? null,
      placed_at: new Date().toISOString(),
      notes: `idempotency:${input.idempotencyKey}`,
    })
    .select("id, order_number, grand_total")
    .single();

  if (orderErr || !order) {
    return { ok: false, error: orderErr?.message ?? "Could not create order." };
  }
  orderId = order.id;

  const stockResult = await reserveOrderStock(order.id, stockLines);
  if (!stockResult.ok) {
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    return { ok: false, error: stockResult.error };
  }
  stockReserved = true;

  const { error: itemsErr } = await supabase.from("order_items").insert(
    lineItems.map((item) => ({ order_id: order.id, ...item })),
  );
  if (itemsErr) return { ok: false, error: itemsErr.message };

  const shipping = input.shipping;
  const { error: addrErr } = await supabase.from("shipping_addresses").insert({
    order_id: order.id,
    full_name: shipping.full_name,
    phone: shipping.phone,
    line1: shipping.line1,
    line2: shipping.line2 ?? null,
    city: shipping.city,
    state: shipping.state,
    pincode: shipping.pincode,
  });
  if (addrErr) return { ok: false, error: addrErr.message };

  if (coupon?.couponId) {
    const couponErr = await applyCoupon(
      order.id,
      coupon.couponId,
      customerId,
      coupon.discountAmount,
      subtotal,
    );
    if (couponErr) {
      await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
      return { ok: false, error: couponErr };
    }
  }

  const gateway =
    input.paymentMethod === "razorpay" ? await getEnabledRazorpayGateway() : null;

  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .insert({
      order_id: order.id,
      customer_id: customerId,
      amount: totals.grandTotal,
      currency: "INR",
      status: "pending",
      provider: input.paymentMethod === "cod" ? "cod" : "razorpay",
      method: input.paymentMethod,
      gateway_id: gateway?.id !== "env" ? gateway?.id ?? null : null,
    })
    .select("id")
    .single();

  if (payErr || !payment) return { ok: false, error: payErr?.message ?? "Payment record failed." };

  await supabase.from("order_events").insert({
    order_id: order.id,
    type: "created",
    message: "Order placed from storefront checkout.",
    metadata: { payment_method: input.paymentMethod } as Json,
  });

  onOrderCreated(order.id, input.paymentMethod);

  if (input.paymentMethod === "cod") {
    await supabase
      .from("payments")
      .update({
        status: "pending",
        method: "cod",
        provider: "cod",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    const fulfillment = await fulfillOrderWithDelhivery(order.id);
    const commitResult = await commitOrderStockReservations(order.id);
    if (!commitResult.ok) {
      return { ok: false, error: commitResult.error };
    }
    stockCommitted = true;
    keepReservation = true;
    if (fulfillment.ok && fulfillment.awb) {
      await runOrderShippingEmail(order.id);
    }
    if (!fulfillment.ok) {
      return {
        ok: true,
        error: null,
        orderId: order.id,
        orderNumber: order.order_number,
        grandTotal: Number(order.grand_total),
        paymentMethod: "cod",
      };
    }

    return {
      ok: true,
      error: null,
      orderId: order.id,
      orderNumber: order.order_number,
      grandTotal: Number(order.grand_total),
      paymentMethod: "cod",
    };
  }

  const rz = await createRazorpayOrder({
    amountInr: totals.grandTotal,
    orderId: order.id,
    orderNumber: order.order_number,
    customerEmail: input.customer.email,
    customerPhone: input.customer.phone,
  });

  if (!rz.ok || !rz.razorpayOrderId) {
    return { ok: false, error: rz.error ?? "Payment initialization failed." };
  }

  await supabase
    .from("payments")
    .update({
      gateway_txn_id: rz.razorpayOrderId,
      payment_ref: rz.razorpayOrderId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  keepReservation = true;
  return {
    ok: true,
    error: null,
    orderId: order.id,
    orderNumber: order.order_number,
    grandTotal: Number(order.grand_total),
    razorpayOrderId: rz.razorpayOrderId,
    razorpayKeyId: gateway?.keyId ?? undefined,
    paymentMethod: "razorpay",
  };
  } finally {
    if (orderId && stockReserved && !stockCommitted && !keepReservation) {
      await releaseOrderStockReservations(orderId);
    }
  }
}

/** Client fast-path — delegates to idempotent capture (webhook remains source of truth). */
export async function completeRazorpayOrder(input: {
  orderId: string;
  customerId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ ok: boolean; error: string | null; awb?: string }> {
  const { captureRazorpayPayment } = await import("@/lib/checkout/razorpay-capture");

  const result = await captureRazorpayPayment({
    orderId: input.orderId,
    customerId: input.customerId,
    razorpayOrderId: input.razorpayOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
    razorpaySignature: input.razorpaySignature,
    source: "client",
  });

  return { ok: result.ok, error: result.error, awb: result.awb };
}

export async function getCheckoutOrderSummary(orderId: string, customerId: string) {
  const supabase = createSupabaseServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, grand_total, status, placed_at")
    .eq("id", orderId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (!order) return null;

  const { data: shipment } = await supabase
    .from("shipments")
    .select("tracking_number, estimated_delivery")
    .eq("order_id", orderId)
    .maybeSingle();

  return {
    orderNumber: order.order_number,
    grandTotal: Number(order.grand_total),
    status: order.status,
    trackingNumber: shipment?.tracking_number ?? null,
    estimatedDelivery: shipment?.estimated_delivery ?? null,
  };
}
