import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getReturnDetail } from "@/lib/admin/returns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import type { Json } from "@/lib/supabase/database.types";

const LABELS: Record<string, string> = {
  rma_label: "RMA Label",
  return_slip: "Return Slip",
  refund_receipt: "Refund Receipt",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; type: string }> },
) {
  await requirePermission(PERMISSIONS.RETURNS_MANAGE);
  const { id, type } = await params;

  if (!LABELS[type]) {
    return NextResponse.json({ error: "Unknown document type" }, { status: 404 });
  }

  const ret = await getReturnDetail(id);
  if (!ret) return NextResponse.json({ error: "Return not found" }, { status: 404 });

  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  await supabase.from("return_events").insert({
    return_id: id,
    type: "document",
    message: `${LABELS[type]} generated.`,
    metadata: { document_type: type } as Json,
    created_by: user?.id ?? null,
  });

  const title = `${LABELS[type]} — ${ret.rmaNumber}`;
  const lines = [
    `%PDF-1.4`,
    `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`,
    `2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`,
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj`,
    `4 0 obj << /Length 120 >> stream`,
    `BT /F1 18 Tf 72 720 Td (${title.replace(/[()\\]/g, "")}) Tj ET`,
    `BT /F1 12 Tf 72 680 Td (Order: ${ret.orderNumber.replace(/[()\\]/g, "")}) Tj ET`,
    `BT /F1 12 Tf 72 660 Td (Customer: ${ret.customerName.replace(/[()\\]/g, "")}) Tj ET`,
    `BT /F1 10 Tf 72 640 Td (Placeholder PDF - replace with production template) Tj ET`,
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
      "Content-Disposition": `inline; filename="${ret.rmaNumber}-${type}.pdf"`,
    },
  });
}
