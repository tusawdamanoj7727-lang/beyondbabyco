import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { recordDocumentGenerated } from "@/lib/admin/order-actions";
import type { DocumentType } from "@/lib/admin/order-types";
import { generateOrderInvoice } from "@/lib/invoices/generate-order-invoice";
import type { InvoiceDocKind } from "@/lib/invoices/build-enterprise-invoice-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; type: string }> },
) {
  let id = "";
  try {
    await requirePermission(PERMISSIONS.ORDERS_MANAGE);
    const resolved = await params;
    id = resolved.id;
    const { type } = resolved;

    const docType = type as DocumentType;
    if (!["invoice", "packing_slip", "shipping_label"].includes(docType)) {
      return NextResponse.json({ error: "Unknown document type" }, { status: 404 });
    }

    const generated = await generateOrderInvoice(id, docType as InvoiceDocKind);
    if (!generated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await recordDocumentGenerated(id, docType);

    return new NextResponse(Buffer.from(generated.bytes), {
      headers: {
        "Content-Type": generated.contentType,
        "Content-Disposition": `inline; filename="${generated.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const digest =
      error && typeof error === "object" && "digest" in error
        ? String((error as { digest?: unknown }).digest ?? "")
        : "";
    if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK")) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error("[admin/documents] generation failed", { orderId: id, message, error });
    return NextResponse.json(
      { error: "Document generation failed", detail: message },
      { status: 500 },
    );
  }
}
