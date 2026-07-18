import "server-only";

import { gstFromInclusiveLine } from "@/lib/catalog/gst-rates";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { absoluteUrl } from "@/lib/seo/site";
import { isIntrastateBuyer } from "@/lib/utils/gst";

import { resolveInvoiceHsn } from "./hsn";
import { getSellerLegal, type SellerLegal } from "./seller";
import { issueInvoiceToken } from "./token";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type InvoiceLineItem = {
  name: string;
  sku: string | null;
  hsn: string;
  quantity: number;
  mrp: number;
  unitPrice: number;
  discount: number;
  taxableValue: number;
  gstRate: number;
  gstAmount: number;
  lineTotal: number;
  imageUrl: string | null;
};

export type InvoiceAddress = {
  fullName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type OrderInvoiceData = {
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  orderDate: string;
  currency: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  buyerGstin: string | null;
  billing: InvoiceAddress | null;
  shipping: InvoiceAddress | null;
  items: InvoiceLineItem[];
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  couponCode: string | null;
  cgst: number;
  sgst: number;
  igst: number;
  taxTotal: number;
  grandTotal: number;
  isIntrastate: boolean;
  paymentMethod: string | null;
  transactionId: string | null;
  seller: SellerLegal;
  verifyUrl: string;
  downloadToken: string;
};

function formatDateIn(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function mapAddress(row: {
  full_name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
} | null): InvoiceAddress | null {
  if (!row) return null;
  return {
    fullName: row.full_name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    country: row.country || "India",
  };
}

/**
 * Load full tax-invoice payload for an order (service role).
 * Used by customer/admin routes, guest token API, and email attachments.
 */
export async function loadOrderInvoiceData(
  orderId: string,
): Promise<OrderInvoiceData | null> {
  const supabase = createSupabaseServiceClient();
  const seller = getSellerLegal();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, placed_at, created_at, currency, customer_id, buyer_gstin, coupon_id, subtotal, discount_total, shipping_total, tax_total, grand_total, cgst_amount, sgst_amount, igst_amount, shipping_state",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;

  const [
    { data: items },
    { data: address },
    { data: payment },
    { data: customer },
    { data: coupon },
  ] = await Promise.all([
    supabase
      .from("order_items")
      .select(
        "id, name, sku, quantity, unit_price, total, tax_rate, product_id, product_variant_id",
      )
      .eq("order_id", orderId)
      .order("created_at"),
    supabase
      .from("shipping_addresses")
      .select("full_name, phone, line1, line2, city, state, pincode, country")
      .eq("order_id", orderId)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("method, provider, status, gateway_txn_id, payment_ref")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    order.customer_id
      ? supabase
          .from("customers")
          .select("full_name, email, phone")
          .eq("id", order.customer_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    order.coupon_id
      ? supabase.from("coupons").select("code").eq("id", order.coupon_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const productIds = [
    ...new Set((items ?? []).map((i) => i.product_id).filter(Boolean)),
  ] as string[];
  const variantIds = [
    ...new Set((items ?? []).map((i) => i.product_variant_id).filter(Boolean)),
  ] as string[];

  const productMap = new Map<
    string,
    { slug: string; gst_rate: number | null; compare_at_price?: number | null }
  >();
  const variantMap = new Map<string, { compare_at_price: number | null; sku: string | null }>();
  const imageMap = new Map<string, string>();

  if (productIds.length) {
    const [{ data: products }, { data: images }] = await Promise.all([
      supabase
        .from("products")
        .select("id, slug, gst_rate, compare_at_price")
        .in("id", productIds),
      supabase
        .from("product_images")
        .select("product_id, url, is_primary, position")
        .in("product_id", productIds)
        .order("position", { ascending: true }),
    ]);
    for (const p of products ?? []) {
      productMap.set(p.id, {
        slug: p.slug,
        gst_rate: p.gst_rate,
        compare_at_price: p.compare_at_price,
      });
    }
    for (const img of images ?? []) {
      if (!imageMap.has(img.product_id) || img.is_primary) {
        imageMap.set(img.product_id, img.url);
      }
    }
  }

  if (variantIds.length) {
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id, compare_at_price, sku")
      .in("id", variantIds);
    for (const v of variants ?? []) {
      variantMap.set(v.id, { compare_at_price: v.compare_at_price, sku: v.sku });
    }
  }

  const orderSubtotal = Number(order.subtotal) || 0;
  const orderDiscount = Number(order.discount_total) || 0;

  const lineItems: InvoiceLineItem[] = (items ?? []).map((item) => {
    const product = item.product_id ? productMap.get(item.product_id) : undefined;
    const variant = item.product_variant_id
      ? variantMap.get(item.product_variant_id)
      : undefined;
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const lineTotal = Number(item.total) || round2(unitPrice * qty);
    const gstRate =
      Number(item.tax_rate) > 0
        ? Number(item.tax_rate)
        : Number(product?.gst_rate) > 0
          ? Number(product?.gst_rate)
          : 12;
    const share =
      orderSubtotal > 0 ? Math.min(1, Math.max(0, lineTotal / orderSubtotal)) : 0;
    const discount = round2(orderDiscount * share);
    const afterDiscount = round2(Math.max(0, lineTotal - discount));
    const gstAmount = gstFromInclusiveLine(afterDiscount, gstRate);
    const taxableValue = round2(afterDiscount - gstAmount);
    const mrp =
      Number(variant?.compare_at_price) > 0
        ? Number(variant?.compare_at_price)
        : Number(product?.compare_at_price) > 0
          ? Number(product?.compare_at_price)
          : unitPrice;

    let imageUrl = item.product_id ? imageMap.get(item.product_id) ?? null : null;
    if (imageUrl && imageUrl.startsWith("/")) {
      imageUrl = absoluteUrl(imageUrl);
    }

    return {
      name: item.name,
      sku: item.sku || variant?.sku || null,
      hsn: resolveInvoiceHsn({
        taxRate: gstRate,
        productSlug: product?.slug,
        productName: item.name,
      }),
      quantity: qty,
      mrp,
      unitPrice,
      discount,
      taxableValue,
      gstRate,
      gstAmount,
      lineTotal: afterDiscount,
      imageUrl,
    };
  });

  const shippingState =
    order.shipping_state?.trim() || address?.state?.trim() || seller.state;
  const isIntrastate = isIntrastateBuyer(shippingState);

  let cgst = Number(order.cgst_amount) || 0;
  let sgst = Number(order.sgst_amount) || 0;
  let igst = Number(order.igst_amount) || 0;
  const taxTotal = Number(order.tax_total) || round2(cgst + sgst + igst);

  if (cgst === 0 && sgst === 0 && igst === 0 && taxTotal > 0) {
    if (isIntrastate) {
      cgst = round2(taxTotal / 2);
      sgst = round2(taxTotal - cgst);
    } else {
      igst = taxTotal;
    }
  }

  const shipping = mapAddress(address);
  const customerName =
    customer?.full_name?.trim() ||
    shipping?.fullName ||
    customer?.email ||
    "Customer";

  const downloadToken = issueInvoiceToken(order.id);
  const verifyUrl = absoluteUrl(
    `/api/invoices/${order.id}?token=${encodeURIComponent(downloadToken)}`,
  );

  const paymentMethod =
    payment?.method === "cod"
      ? "Cash on Delivery"
      : payment?.method || payment?.provider || null;

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    invoiceNumber: `INV-${order.order_number}`,
    invoiceDate: formatDateIn(order.placed_at ?? order.created_at),
    orderDate: formatDateIn(order.placed_at ?? order.created_at),
    currency: order.currency || "INR",
    customerName,
    customerEmail: customer?.email ?? null,
    customerPhone: customer?.phone ?? shipping?.phone ?? null,
    buyerGstin: order.buyer_gstin,
    billing: shipping,
    shipping,
    items: lineItems,
    subtotal: orderSubtotal,
    discountTotal: orderDiscount,
    shippingTotal: Number(order.shipping_total) || 0,
    couponCode: coupon?.code ?? null,
    cgst,
    sgst,
    igst,
    taxTotal,
    grandTotal: Number(order.grand_total) || 0,
    isIntrastate,
    paymentMethod,
    transactionId: payment?.gateway_txn_id || payment?.payment_ref || null,
    seller,
    verifyUrl,
    downloadToken,
  };
}
