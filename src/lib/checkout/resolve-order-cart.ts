import "server-only";

import { canPurchaseProduct } from "@/lib/catalog/availability";
import { effectivePrice } from "@/lib/catalog/format";
import { resolveProductGstRate } from "@/lib/catalog/gst-rates";
import { validateCoupon } from "@/lib/coupons/queries";
import type { CartLineItem } from "@/lib/admin/coupon-types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getVariantAvailableStock, OUT_OF_STOCK_MESSAGE } from "@/lib/inventory/storefront-stock";
import { clampCartQuantity } from "@/lib/storefront/cart-types";
import { estimateShippingFee } from "@/lib/storefront/shipping";
import { calcCheckoutTotals } from "@/lib/checkout/tax";
import { calculateGSTFromCart } from "@/lib/utils/gst";
import type { CheckoutCartLineInput } from "@/lib/checkout/schema";

export type ResolvedCheckoutLine = {
  productId: string;
  variantId: string;
  quantity: number;
  name: string;
  variantName: string | null;
  unitPrice: number;
  gstRate: number;
  sku: string | null;
};

export type ResolvedCheckoutCoupon = {
  couponId: string;
  code: string;
  discountAmount: number;
  freeShipping: boolean;
};

export type ResolvedCheckoutCart = {
  lines: ResolvedCheckoutLine[];
  subtotal: number;
  coupon: ResolvedCheckoutCoupon | null;
  discountTotal: number;
  shippingTotal: number;
  gstBreakdown: ReturnType<typeof calculateGSTFromCart>;
  totals: ReturnType<typeof calcCheckoutTotals>;
};

export type ResolveCheckoutCartResult =
  | { ok: true; cart: ResolvedCheckoutCart }
  | { ok: false; error: string };

const UNAVAILABLE_MESSAGE = "One or more items are no longer available.";

async function isFirstOrder(customerId: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .in("status", ["confirmed", "processing", "shipped", "delivered"]);
  return (count ?? 0) === 0;
}

async function resolveVariant(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  productId: string,
  variantId: string | null,
): Promise<{
  id: string;
  sku: string | null;
  name: string;
  price: number | null;
  product_id: string;
} | null> {
  if (variantId) {
    const { data } = await supabase
      .from("product_variants")
      .select("id, sku, name, price, product_id, is_active")
      .eq("id", variantId)
      .eq("product_id", productId)
      .eq("is_active", true)
      .maybeSingle();
    return data;
  }

  const { data } = await supabase
    .from("product_variants")
    .select("id, sku, name, price, product_id, is_active")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}

/** Authoritative cart resolution — prices, GST, coupon, shipping computed from DB only. */
export async function resolveCheckoutCart(input: {
  customerId: string;
  cartItems: CheckoutCartLineInput[];
  couponCode?: string | null;
  buyerState: string;
}): Promise<ResolveCheckoutCartResult> {
  if (input.cartItems.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  const supabase = createSupabaseServiceClient();
  const productIds = [...new Set(input.cartItems.map((i) => i.productId))];

  const { data: products, error: productsErr } = await supabase
    .from("products")
    .select(
      "id, name, slug, status, price, sale_price, compare_at_price, gst_rate, category_id, brand_id, deleted_at",
    )
    .in("id", productIds)
    .is("deleted_at", null);

  if (productsErr) {
    return { ok: false, error: productsErr.message };
  }

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const lines: ResolvedCheckoutLine[] = [];
  const couponLineItems: CartLineItem[] = [];
  const variantIds: string[] = [];

  for (const item of input.cartItems) {
    const product = productMap.get(item.productId);
    if (!product || product.deleted_at != null) {
      return { ok: false, error: UNAVAILABLE_MESSAGE };
    }

    if (!canPurchaseProduct({ status: product.status, inStock: true })) {
      return { ok: false, error: UNAVAILABLE_MESSAGE };
    }

    const variant = await resolveVariant(supabase, item.productId, item.variantId);
    if (!variant) {
      return { ok: false, error: UNAVAILABLE_MESSAGE };
    }

    const quantity = clampCartQuantity(item.quantity);
    const listPrice = Number(product.price);
    const salePrice = product.sale_price != null ? Number(product.sale_price) : null;
    const unitPrice =
      variant.price != null && variant.price > 0
        ? Number(variant.price)
        : effectivePrice(listPrice, salePrice);

    if (unitPrice <= 0) {
      return { ok: false, error: UNAVAILABLE_MESSAGE };
    }

    const gstRate = resolveProductGstRate(
      product.gst_rate != null ? Number(product.gst_rate) : null,
      null,
      product.slug,
    );

    lines.push({
      productId: item.productId,
      variantId: variant.id,
      quantity,
      name: product.name,
      variantName: variant.name !== product.name ? variant.name : null,
      unitPrice,
      gstRate,
      sku: variant.sku,
    });

    couponLineItems.push({
      productId: item.productId,
      categoryId: product.category_id,
      brandId: product.brand_id,
      quantity,
      unitPrice,
    });

    variantIds.push(variant.id);
  }

  const stockMap = await getVariantAvailableStock(variantIds);
  for (const line of lines) {
    const available = stockMap.get(line.variantId) ?? 0;
    if (available < line.quantity) {
      return { ok: false, error: OUT_OF_STOCK_MESSAGE };
    }
  }

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  let coupon: ResolvedCheckoutCoupon | null = null;
  let discountTotal = 0;
  let freeShipping = false;

  const code = input.couponCode?.trim().toUpperCase();
  if (code) {
    const shippingForCoupon = estimateShippingFee(subtotal, false);
    const couponResult = await validateCoupon(code, {
      customerId: input.customerId,
      isLoggedIn: true,
      isFirstOrder: await isFirstOrder(input.customerId),
      subtotal,
      shippingTotal: shippingForCoupon,
      items: couponLineItems,
    });

    if (!couponResult.valid || !couponResult.couponId) {
      return { ok: false, error: couponResult.error ?? "Invalid coupon." };
    }

    discountTotal = couponResult.discountAmount ?? 0;
    freeShipping = couponResult.freeShipping ?? false;
    coupon = {
      couponId: couponResult.couponId,
      code,
      discountAmount: discountTotal,
      freeShipping,
    };
  }

  const afterDiscount = Math.max(0, subtotal - discountTotal);
  const shippingTotal = estimateShippingFee(afterDiscount, freeShipping);

  const gstBreakdown = calculateGSTFromCart(
    lines.map((line) => ({
      price: line.unitPrice,
      quantity: line.quantity,
      gstRate: line.gstRate,
    })),
    input.buyerState,
    discountTotal,
  );

  const totals = calcCheckoutTotals({
    subtotal,
    discountTotal,
    shippingTotal,
    taxTotal: gstBreakdown.total,
  });

  return {
    ok: true,
    cart: {
      lines,
      subtotal,
      coupon,
      discountTotal,
      shippingTotal,
      gstBreakdown,
      totals,
    },
  };
}
