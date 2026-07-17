import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getOrderDetail } from "@/lib/admin/orders";
import { recordDocumentGenerated } from "@/lib/admin/order-actions";
import type { DocumentType } from "@/lib/admin/order-types";
import { buildOrderInvoicePdf } from "@/lib/invoices/build-order-invoice-pdf";

const LABELS: Record<DocumentType, string> = {
  invoice: "TAX INVOICE",
  packing_slip: "PACKING SLIP",
  shipping_label: "SHIPPING LABEL",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; type: string }> },
) {
  await requirePermission(PERMISSIONS.ORDERS_MANAGE);
  const { id, type } = await params;

  const docType = type as DocumentType;
  if (!["invoice", "packing_slip", "shipping_label"].includes(docType)) {
    return NextResponse.json({ error: "Unknown document type" }, { status: 404 });
  }

  const order = await getOrderDetail(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  await recordDocumentGenerated(id, docType);

  const orderDate = new Date(order.placedAt ?? order.createdAt).toLocaleDateString("en-IN");
  const pdf = buildOrderInvoicePdf({
    title: `${LABELS[docType]} — ${order.orderNumber}`,
    orderNumber: order.orderNumber,
    orderDate,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingAddress: order.shippingAddress
      ? {
          fullName: order.shippingAddress.fullName,
          line1: order.shippingAddress.line1,
          line2: order.shippingAddress.line2,
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
    paymentMethod: order.payment?.method ?? order.payment?.provider ?? null,
    docLabel: LABELS[docType],
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.orderNumber}-${docType}.pdf"`,
    },
  });
}
