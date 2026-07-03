import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { applyCoupon } from "@/lib/coupons/queries";
import { generateOrderNumber, calcLineTotal } from "@/lib/admin/order-schema";
import { fulfillOrderWithDelhivery } from "@/lib/checkout/fulfillment";
import { calcCheckoutTotals } from "@/lib/checkout/tax";
import { placeOrderSchema, type PlaceOrderInput } from "@/lib/checkout/schema";
import { createRazorpayOrder } from "@/lib/checkout/razorpay-client";
import { getEnabledRazorpayGateway } from "@/lib/checkout/gateways";

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

async function resolveVariantId(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  productId: string,
  variantId: string | null,
): Promise<{ id: string; sku: string | null } | null> {
  if (variantId) {
    const { data } = await supabase.from("product_variants").select("id, sku").eq("id", variantId).maybeSingle();
    return data;
  }
  const { data } = await supabase
    .from("product_variants")
    .select("id, sku")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function findOrderByIdempotencyKey(
  customerId: string,
  idempotencyKey: string,
): Promise<{ id: string; order_number: string; grand_total: number } | null> {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, grand_total")
    .eq("customer_id", customerId)
    .eq("notes", `idempotency:${idempotencyKey}`)
    .maybeSingle();
  return data;
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
  const existing = await findOrderByIdempotencyKey(customerId, input.idempotencyKey);
  if (existing) {
    return {
      ok: true,
      error: null,
      orderId: existing.id,
      orderNumber: existing.order_number,
      grandTotal: Number(existing.grand_total),
      paymentMethod: input.paymentMethod,
    };
  }

  const supabase = createSupabaseServiceClient();
  const subtotal = input.cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountTotal = input.coupon?.discountAmount ?? 0;
  const totals = calcCheckoutTotals({
    subtotal,
    discountTotal,
    shippingTotal: input.shippingTotal,
  });

  const warehouseId = await getDefaultWarehouseId(supabase);
  const orderNumber = generateOrderNumber();

  const lineItems = [];
  for (const item of input.cartItems) {
    const variant = await resolveVariantId(supabase, item.productId, item.variantId);
    lineItems.push({
      product_id: item.productId,
      product_variant_id: variant?.id ?? null,
      name: item.variantName ? `${item.name} — ${item.variantName}` : item.name,
      sku: variant?.sku ?? null,
      unit_price: item.price,
      quantity: item.quantity,
      tax_rate: 0,
      total: calcLineTotal(item.price, item.quantity, 0),
    });
  }

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
      coupon_id: input.coupon?.couponId ?? null,
      placed_at: new Date().toISOString(),
      notes: `idempotency:${input.idempotencyKey}`,
    })
    .select("id, order_number, grand_total")
    .single();

  if (orderErr || !order) {
    return { ok: false, error: orderErr?.message ?? "Could not create order." };
  }

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

  if (input.coupon?.couponId) {
    const couponErr = await applyCoupon(
      order.id,
      input.coupon.couponId,
      customerId,
      input.coupon.discountAmount,
      subtotal,
    );
    if (couponErr) {
      await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
      return { ok: false, error: couponErr };
    }
  }

  await supabase.from("order_events").insert({
    order_id: order.id,
    type: "created",
    message: "Order placed from storefront checkout.",
    metadata: { payment_method: input.paymentMethod } as Json,
  });

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
}

export async function completeRazorpayOrder(input: {
  orderId: string;
  customerId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ ok: boolean; error: string | null; awb?: string }> {
  const { verifyRazorpaySignature } = await import("@/lib/checkout/razorpay-client");
  const valid = await verifyRazorpaySignature(input);
  if (!valid) return { ok: false, error: "Payment verification failed." };

  const supabase = createSupabaseServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id, status")
    .eq("id", input.orderId)
    .maybeSingle();

  if (!order || order.customer_id !== input.customerId) {
    return { ok: false, error: "Order not found." };
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id, status")
    .eq("order_id", input.orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (payment?.status === "paid" || payment?.status === "captured") {
    const fulfillment = await fulfillOrderWithDelhivery(input.orderId);
    return { ok: true, error: null, awb: fulfillment.awb };
  }

  await supabase
    .from("payments")
    .update({
      status: "paid",
      method: "razorpay",
      provider: "razorpay",
      gateway_txn_id: input.razorpayPaymentId,
      payment_ref: input.razorpayPaymentId,
      captured_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", input.orderId);

  await supabase.from("order_events").insert({
    order_id: input.orderId,
    type: "payment",
    message: "Razorpay payment captured.",
    metadata: {
      razorpay_payment_id: input.razorpayPaymentId,
      razorpay_order_id: input.razorpayOrderId,
    } as Json,
  });

  const fulfillment = await fulfillOrderWithDelhivery(input.orderId);
  if (!fulfillment.ok) {
    return { ok: true, error: null };
  }

  return { ok: true, error: null, awb: fulfillment.awb };
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
