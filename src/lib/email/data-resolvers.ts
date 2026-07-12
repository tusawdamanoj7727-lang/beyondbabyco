import "server-only";

import { absoluteUrl } from "@/lib/seo/site";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { mergeSampleData } from "@/lib/communications/sample-data";

function formatMoney(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatAddress(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(", ");
}

/** Build template variables from an order record and related tables. */
export async function resolveOrderEmailData(
  orderId: string,
  overrides?: Record<string, string>,
): Promise<Record<string, string> | null> {
  const supabase = createSupabaseServiceClient();

  const [{ data: order }, { data: items }, { data: address }, { data: shipment }, { data: payment }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id, order_number, grand_total, currency, placed_at, status, customer_id")
        .eq("id", orderId)
        .maybeSingle(),
      supabase.from("order_items").select("name, quantity, unit_price, sku").eq("order_id", orderId),
      supabase
        .from("shipping_addresses")
        .select("full_name, line1, line2, city, state, pincode")
        .eq("order_id", orderId)
        .maybeSingle(),
      supabase
        .from("shipments")
        .select("tracking_number, carrier, estimated_delivery, status")
        .eq("order_id", orderId)
        .maybeSingle(),
      supabase
        .from("payments")
        .select("method, status, amount")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (!order) return null;

  let customerName = address?.full_name ?? "";
  let customerEmail = "";

  if (order.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("full_name, email")
      .eq("id", order.customer_id)
      .maybeSingle();
    customerName = customerName || customer?.full_name || "";
    customerEmail = customer?.email ?? "";
  }

  const firstItem = items?.[0];
  const productSummary = (items ?? [])
    .map((i) => `${i.name}${i.sku ? ` (${i.sku})` : ""} × ${i.quantity}`)
    .join(", ");

  return mergeSampleData({
    customer_name: customerName || "Customer",
    customer_email: customerEmail,
    order_number: order.order_number,
    order_date: formatDate(order.placed_at),
    order_total: formatMoney(Number(order.grand_total), order.currency ?? "INR"),
    order_url: absoluteUrl(`/account/orders/${order.id}`),
    invoice_url: absoluteUrl(`/account/orders/${order.id}/documents/invoice`),
    payment_method: payment?.method ?? "Online",
    payment_status: payment?.status ?? order.status,
    product_name: firstItem?.name ?? "Baby care products",
    product_summary: productSummary || firstItem?.name || "Baby care products",
    quantity: String(firstItem?.quantity ?? 1),
    price: firstItem ? formatMoney(Number(firstItem.unit_price)) : "",
    tracking_number: shipment?.tracking_number ?? "",
    carrier_name: shipment?.carrier ?? "Delhivery",
    shipment_status: shipment?.status ?? order.status,
    estimated_delivery: shipment?.estimated_delivery
      ? formatDate(shipment.estimated_delivery)
      : "3–5 business days",
    delivery_address: formatAddress([
      address?.line1,
      address?.line2,
      address?.city,
      address?.state,
      address?.pincode,
    ]),
    ...overrides,
  });
}

export async function resolveCustomerEmailData(
  customerId: string,
  overrides?: Record<string, string>,
): Promise<Record<string, string> | null> {
  const supabase = createSupabaseServiceClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("full_name, email")
    .eq("id", customerId)
    .maybeSingle();

  if (!customer?.email) return null;

  return mergeSampleData({
    customer_name: customer.full_name ?? customer.email.split("@")[0] ?? "Customer",
    customer_email: customer.email,
    ...overrides,
  });
}

export function resolveContactEmailData(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Record<string, string> {
  return mergeSampleData({
    customer_name: input.name,
    customer_email: input.email,
    contact_subject: input.subject,
    contact_message: input.message,
  });
}
