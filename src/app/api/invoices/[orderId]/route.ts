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
  let orderId = "";
  try {
    ({ orderId } = await params);
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const download = url.searchParams.get("download") === "1";

    if (!orderId) {
      return NextResponse.json({ error: "Order id is required" }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ error: "Invoice token is required" }, { status: 401 });
    }

    if (!verifyInvoiceToken(token, orderId)) {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[api/invoices] generation failed", { orderId, message, error });
    return NextResponse.json(
      { error: "Invoice generation failed", detail: message },
      { status: 500 },
    );
  }
}
