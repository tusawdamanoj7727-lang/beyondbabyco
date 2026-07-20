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
  logRazorpayCheckout,
  PAYMENT_GATEWAY_NOT_CONFIGURED_MESSAGE,
} from "@/lib/checkout/gateways";
import { onCodOrderConfirmed } from "@/lib/email/events/orders";
import { runOrderShippingEmail } from "@/lib/email/lifecycle";
import { releaseCouponForOrder } from "@/lib/coupons/redemption";
import {
  canResumeRazorpayCheckout,
  razorpayInitFailureCleanup,
} from "@/lib/checkout/commerce-stability";

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
    .select("id, order_number, grand_total, status")
    .eq("customer_id", customerId)
    .eq("notes", `idempotency:${idempotencyKey}`)
    .not("status", "in", "(cancelled,failed)")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const { data: payment } = await supabase
    .from("payments")
    .select("status, method, gateway_txn_id, provider")
    .eq("order_id", data.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Incomplete cancelled-before-payment leftovers must not resume as success.
  if (!payment) return null;

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

async function ensureRazorpayOrderForExistingPayment(input: {
  orderId: string;
  orderNumber: string;
  grandTotal: number;
  customerEmail?: string | null;
  customerPhone?: string | null;
}): Promise<{
  ok: boolean;
  error: string | null;
  razorpayOrderId?: string;
  razorpayKeyId?: string;
}> {
  logRazorpayCheckout("ensureRazorpayOrderForExistingPayment.entered", {
    orderId: input.orderId,
    amount: input.grandTotal,
    currency: "INR",
  });

  const supabase = createSupabaseServiceClient();
  const { data: orderRow } = await supabase
    .from("orders")
    .select("status")
    .eq("id", input.orderId)
    .maybeSingle();

  if (!orderRow || !canResumeRazorpayCheckout(orderRow.status)) {
    logRazorpayCheckout("ensureRazorpayOrderForExistingPayment.early_return", {
      why: "order_not_payable",
      orderId: input.orderId,
      status: orderRow?.status ?? null,
    });
    return { ok: false, error: "Order is no longer payable." };
  }

  const gateway = await getEnabledRazorpayGateway();
  logRazorpayCheckout("ensureRazorpayOrderForExistingPayment.gateway", {
    orderId: input.orderId,
    gatewaySelected: gateway?.provider ?? null,
    gatewayUuid: gateway?.id ?? null,
    gatewayEnabled: Boolean(gateway),
    paymentMode: gateway?.sandbox ? "sandbox" : gateway ? "live" : null,
    amount: input.grandTotal,
    currency: "INR",
    keyIdExists: Boolean(gateway?.keyId),
    keySecretExists: Boolean(gateway?.keySecret),
  });

  if (!gateway?.keyId || !gateway.keySecret) {
    logRazorpayCheckout("ensureRazorpayOrderForExistingPayment.early_return", {
      why: "gateway_missing_credentials",
      orderId: input.orderId,
      keyIdExists: Boolean(gateway?.keyId),
      keySecretExists: Boolean(gateway?.keySecret),
    });
    return { ok: false, error: PAYMENT_GATEWAY_NOT_CONFIGURED_MESSAGE };
  }

  const rz = await createRazorpayOrder({
    amountInr: input.grandTotal,
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
  });

  if (!rz.ok || !rz.razorpayOrderId) {
    logRazorpayCheckout("ensureRazorpayOrderForExistingPayment.early_return", {
      why: "createRazorpayOrder_failed",
      orderId: input.orderId,
      error: rz.error,
      gatewayUuid: gateway.id,
      keyIdExists: true,
      keySecretExists: true,
    });
    return { ok: false, error: rz.error ?? "Payment initialization failed." };
  }

  await supabase
    .from("payments")
    .update({
      gateway_txn_id: rz.razorpayOrderId,
      payment_ref: rz.razorpayOrderId,
      gateway_id: gateway.id,
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", input.orderId)
    .eq("provider", "razorpay")
    .eq("status", "pending");

  return {
    ok: true,
    error: null,
    razorpayOrderId: rz.razorpayOrderId,
    razorpayKeyId: gateway.keyId,
  };
}

export async function placeStorefrontOrder(
  customerId: string,
  raw: PlaceOrderInput,
  options?: { isLoggedIn?: boolean },
): Promise<PlaceOrderResult> {
  logRazorpayCheckout("placeStorefrontOrder.entered", {
    paymentMethod: raw.paymentMethod,
  });

  const parsed = placeOrderSchema.safeParse(raw);
  if (!parsed.success) {
    logRazorpayCheckout("placeStorefrontOrder.early_return", {
      why: "schema_validation_failed",
      error: parsed.error.issues[0]?.message ?? "Invalid checkout data.",
    });
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid checkout data." };
  }

  const input = parsed.data;

  if (input.paymentMethod === "razorpay") {
    const gateway = await getEnabledRazorpayGateway();
    logRazorpayCheckout("placeStorefrontOrder.gateway_lookup", {
      gatewaySelected: gateway?.provider ?? null,
      gatewayUuid: gateway?.id ?? null,
      gatewayEnabled: Boolean(gateway),
      paymentMode: gateway?.sandbox ? "sandbox" : gateway ? "live" : null,
      keyIdExists: Boolean(gateway?.keyId),
      keySecretExists: Boolean(gateway?.keySecret),
    });
    if (!gateway?.keyId || !gateway.keySecret) {
      logRazorpayCheckout("placeStorefrontOrder.early_return", {
        why: "gateway_not_configured",
        keyIdExists: Boolean(gateway?.keyId),
        keySecretExists: Boolean(gateway?.keySecret),
      });
      return { ok: false, error: PAYMENT_GATEWAY_NOT_CONFIGURED_MESSAGE };
    }
  }

  const existing = await findOrderByIdempotencyKey(customerId, input.idempotencyKey);
  if (existing) {
    const paymentMethod = existing.paymentMethod ?? input.paymentMethod;
    logRazorpayCheckout("placeStorefrontOrder.idempotency_hit", {
      orderId: existing.id,
      paymentMethod,
      razorpayOrderId: existing.razorpayOrderId ?? null,
      keyIdExists: Boolean(existing.razorpayKeyId),
      keySecretExists: Boolean(existing.razorpayKeyId),
      amount: existing.grand_total,
      currency: "INR",
    });

    if (paymentMethod === "razorpay" && !existing.razorpayOrderId) {
      logRazorpayCheckout("placeStorefrontOrder.idempotency_reinit", {
        why: "pending_payment_missing_gateway_txn_id",
        orderId: existing.id,
        amount: existing.grand_total,
        currency: "INR",
      });
      const reinited = await ensureRazorpayOrderForExistingPayment({
        orderId: existing.id,
        orderNumber: existing.order_number,
        grandTotal: existing.grand_total,
        customerEmail: input.customer.email,
        customerPhone: input.customer.phone,
      });
      if (!reinited.ok) {
        return { ok: false, error: reinited.error };
      }
      return {
        ok: true,
        error: null,
        orderId: existing.id,
        orderNumber: existing.order_number,
        grandTotal: Number(existing.grand_total),
        razorpayOrderId: reinited.razorpayOrderId,
        razorpayKeyId: reinited.razorpayKeyId,
        paymentMethod: "razorpay",
      };
    }

    return {
      ok: true,
      error: null,
      orderId: existing.id,
      orderNumber: existing.order_number,
      grandTotal: Number(existing.grand_total),
      razorpayOrderId: existing.razorpayOrderId,
      razorpayKeyId: existing.razorpayKeyId,
      paymentMethod,
    };
  }

  // Server-authoritative pricing — never trust client-submitted amounts.
  const resolved = await resolveCheckoutCart({
    customerId,
    cartItems: input.cartItems,
    couponCode: input.couponCode,
    buyerState: input.shipping.state,
    isLoggedIn: options?.isLoggedIn !== false,
  });
  if (!resolved.ok) {
    return { ok: false, error: resolved.error };
  }

  const { lines, coupon, gstBreakdown, totals } = resolved.cart;
  const subtotal = resolved.cart.subtotal;

  const supabase = createSupabaseServiceClient();
  const warehouseId = await getDefaultWarehouseId(supabase);
  const orderNumber = generateOrderNumber();

  const stockLines: OrderStockLine[] = [];
  const stockByVariant = new Map<string, number>();
  for (const line of lines) {
    stockByVariant.set(line.variantId, (stockByVariant.get(line.variantId) ?? 0) + line.quantity);
  }
  for (const [variantId, quantity] of stockByVariant) {
    stockLines.push({ variantId, quantity });
  }

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
      gateway_id: gateway?.id ?? null,
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

    // Await shared completion pipeline before fulfillment (Vercel freezes detached work).
    await onCodOrderConfirmed(order.id);

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

  logRazorpayCheckout("placeStorefrontOrder.payment_initialization", {
    orderId: order.id,
    amount: totals.grandTotal,
    currency: "INR",
    gatewaySelected: gateway?.provider ?? null,
    gatewayUuid: gateway?.id ?? null,
    gatewayEnabled: Boolean(gateway),
    paymentMode: gateway?.sandbox ? "sandbox" : gateway ? "live" : null,
    keyIdExists: Boolean(gateway?.keyId),
    keySecretExists: Boolean(gateway?.keySecret),
  });

  const rz = await createRazorpayOrder({
    amountInr: totals.grandTotal,
    orderId: order.id,
    orderNumber: order.order_number,
    customerEmail: input.customer.email,
    customerPhone: input.customer.phone,
  });

  if (!rz.ok || !rz.razorpayOrderId) {
    logRazorpayCheckout("placeStorefrontOrder.early_return", {
      why: "createRazorpayOrder_failed",
      orderId: order.id,
      amount: totals.grandTotal,
      currency: "INR",
      error: rz.error,
      gatewayUuid: gateway?.id ?? null,
      keyIdExists: Boolean(gateway?.keyId),
      keySecretExists: Boolean(gateway?.keySecret),
    });
    const cleanup = razorpayInitFailureCleanup();
    await supabase
      .from("orders")
      .update({ status: cleanup.orderStatus, updated_at: new Date().toISOString() })
      .eq("id", order.id)
      .eq("status", "pending");
    await supabase
      .from("payments")
      .update({ status: cleanup.paymentStatus, updated_at: new Date().toISOString() })
      .eq("id", payment.id)
      .eq("status", "pending");
    if (cleanup.releaseCoupon) {
      await releaseCouponForOrder(order.id);
    }
    await supabase.from("order_events").insert({
      order_id: order.id,
      type: "payment",
      message: "Razorpay order creation failed — order cancelled; stock/coupon released.",
      metadata: { reason: "razorpay_init_failed", error: rz.error ?? null },
    });
    // keepReservation stays false → finally releases stock
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
  logRazorpayCheckout("placeStorefrontOrder.success", {
    orderId: order.id,
    razorpayOrderId: rz.razorpayOrderId,
    amount: totals.grandTotal,
    currency: "INR",
    gatewayUuid: gateway?.id ?? null,
    keyIdExists: Boolean(gateway?.keyId),
    keySecretExists: Boolean(gateway?.keySecret),
  });
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

  const [{ data: shipment }, { data: customer }] = await Promise.all([
    supabase
      .from("shipments")
      .select("tracking_number, estimated_delivery")
      .eq("order_id", orderId)
      .maybeSingle(),
    supabase.from("customers").select("email, full_name, profile_id").eq("id", customerId).maybeSingle(),
  ]);

  return {
    orderNumber: order.order_number,
    grandTotal: Number(order.grand_total),
    status: order.status,
    trackingNumber: shipment?.tracking_number ?? null,
    estimatedDelivery: shipment?.estimated_delivery ?? null,
    email: customer?.email ?? null,
    customerName: customer?.full_name ?? null,
    isGuestCustomer: customer?.profile_id == null,
  };
}
