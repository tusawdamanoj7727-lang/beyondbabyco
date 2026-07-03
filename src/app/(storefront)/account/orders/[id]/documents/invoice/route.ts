import { NextResponse } from "next/server";

import { userOwnsOrder } from "@/lib/orders/customer-auth";
import { getOrder } from "@/lib/orders/queries";
import { requireCustomerSession } from "@/lib/orders/customer-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function pdfEscape(value: string) {
  return value.replace(/[()\\]/g, " ");
}

function formatMoney(n: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(n);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireCustomerSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const owns = await userOwnsOrder(id, user.id);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("full_name, email")
    .eq("profile_id", user.id)
    .maybeSingle();

  const title = `Invoice — ${order.orderNumber}`;
  const customerName = customer?.full_name ?? customer?.email ?? "Customer";
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN");

  const contentLines = [
    `BT /F1 18 Tf 72 720 Td (${pdfEscape(title)}) Tj ET`,
    `BT /F1 12 Tf 72 690 Td (Date: ${pdfEscape(orderDate)}) Tj ET`,
    `BT /F1 12 Tf 72 670 Td (Customer: ${pdfEscape(customerName)}) Tj ET`,
    `BT /F1 12 Tf 72 650 Td (Order: ${pdfEscape(order.orderNumber)}) Tj ET`,
    `BT /F1 11 Tf 72 620 Td (Items:) Tj ET`,
  ];

  let y = 600;
  for (const item of order.items) {
    const line = `${item.name} x${item.quantity} — ${formatMoney(item.total, order.currency)}`;
    contentLines.push(`BT /F1 10 Tf 72 ${y} Td (${pdfEscape(line)}) Tj ET`);
    y -= 18;
  }

  contentLines.push(
    `BT /F1 11 Tf 72 ${Math.max(y - 10, 120)} Td (Subtotal: ${pdfEscape(formatMoney(order.subtotal, order.currency))}) Tj ET`,
    `BT /F1 11 Tf 72 ${Math.max(y - 28, 102)} Td (Shipping: ${pdfEscape(formatMoney(order.shippingTotal, order.currency))}) Tj ET`,
    `BT /F1 11 Tf 72 ${Math.max(y - 46, 84)} Td (Tax: ${pdfEscape(formatMoney(order.taxTotal, order.currency))}) Tj ET`,
    `BT /F1 12 Tf 72 ${Math.max(y - 68, 62)} Td (Grand Total: ${pdfEscape(formatMoney(order.grandTotal, order.currency))}) Tj ET`,
    `BT /F1 10 Tf 72 40 Td (BeyondBabyCo — Thank you for your order) Tj ET`,
  );

  const streamBody = contentLines.join("\n");
  const streamLength = streamBody.length + 1;

  const lines = [
    `%PDF-1.4`,
    `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`,
    `2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`,
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj`,
    `4 0 obj << /Length ${streamLength} >> stream`,
    streamBody,
    `endstream endobj`,
    `5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`,
    `xref`,
    `0 6`,
    `0000000000 65535 f `,
    `trailer << /Size 6 /Root 1 0 R >>`,
    `startxref`,
    `0`,
    `%%EOF`,
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.orderNumber}-invoice.pdf"`,
    },
  });
}
