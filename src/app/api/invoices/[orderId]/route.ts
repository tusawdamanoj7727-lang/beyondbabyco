import { NextResponse } from "next/server";

import { generateOrderInvoice } from "@/lib/invoices/generate-order-invoice";
import { verifyInvoiceToken } from "@/lib/invoices/token";

/**
 * Guest / public secure invoice download via signed token.
 * Production: https://beyondbabyco.in/api/invoices/{orderId}?token=…
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const download = url.searchParams.get("download") === "1";

  if (!token || !verifyInvoiceToken(token, orderId)) {
    return NextResponse.json({ error: "Invalid or expired invoice token" }, { status: 401 });
  }

  const generated = await generateOrderInvoice(orderId, "invoice");
  if (!generated) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const disposition = download ? "attachment" : "inline";
  return new NextResponse(Buffer.from(generated.bytes), {
    headers: {
      "Content-Type": generated.contentType,
      "Content-Disposition": `${disposition}; filename="${generated.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
