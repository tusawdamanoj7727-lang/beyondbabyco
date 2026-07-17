import { NextResponse } from "next/server";

import { userOwnsOrder } from "@/lib/orders/customer-auth";
import { getOrder } from "@/lib/orders/queries";
import { requireCustomerSession } from "@/lib/orders/customer-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildOrderInvoicePdf } from "@/lib/invoices/build-order-invoice-pdf";
import { guestOwnsOrder } from "@/lib/checkout/guest-customer";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireCustomerSession();
  const guestCustomerId = user ? null : await guestOwnsOrder(id);

  if (user) {
    const owns = await userOwnsOrder(id, user.id);
    if (!owns) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (!guestCustomerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const supabase = await createSupabaseServerClient();
  let customerName = "Customer";
  let customerEmail: string | null = null;
  let customerPhone: string | null = null;

  if (user) {
    const { data: customer } = await supabase
      .from("customers")
      .select("full_name, email, phone")
      .eq("profile_id", user.id)
      .maybeSingle();
    customerName = customer?.full_name ?? customer?.email ?? "Customer";
    customerEmail = customer?.email ?? null;
    customerPhone = customer?.phone ?? null;
  } else if (order.shippingAddress) {
    customerName = order.shippingAddress.fullName;
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN");
  const pdf = buildOrderInvoicePdf({
    title: `Invoice — ${order.orderNumber}`,
    orderNumber: order.orderNumber,
    orderDate,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress: order.shippingAddress
      ? {
          fullName: order.shippingAddress.fullName,
          line1: order.shippingAddress.line1,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          pincode: order.shippingAddress.pincode,
        }
      : null,
    items: order.items.map((item) => ({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    })),
    subtotal: order.subtotal,
    discountTotal: order.discountTotal,
    shippingTotal: order.shippingTotal,
    taxTotal: order.taxTotal,
    grandTotal: order.grandTotal,
    currency: order.currency,
    paymentMethod: order.paymentStatus,
    docLabel: "TAX INVOICE",
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.orderNumber}-invoice.pdf"`,
    },
  });
}
