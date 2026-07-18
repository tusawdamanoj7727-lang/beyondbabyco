import { NextResponse } from "next/server";

import { guestOwnsOrder } from "@/lib/checkout/guest-customer";
import { generateOrderInvoice } from "@/lib/invoices/generate-order-invoice";
import { requireCustomerSession, userOwnsOrder } from "@/lib/orders/customer-auth";
import { verifyInvoiceToken } from "@/lib/invoices/token";

/**
 * Production tax invoice download.
 * Auth: logged-in owner, guest checkout cookie, or signed ?token=.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let id = "";
  try {
    ({ id } = await params);
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const download = url.searchParams.get("download") === "1";

    let authorized = false;
    if (token && verifyInvoiceToken(token, id)) {
      authorized = true;
    } else {
      const user = await requireCustomerSession();
      if (user) {
        authorized = await userOwnsOrder(id, user.id);
      } else {
        authorized = Boolean(await guestOwnsOrder(id));
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const generated = await generateOrderInvoice(id, "invoice");
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
    console.error("[account/invoice] generation failed", { orderId: id, message, error });
    return NextResponse.json(
      { error: "Invoice generation failed", detail: message },
      { status: 500 },
    );
  }
}
