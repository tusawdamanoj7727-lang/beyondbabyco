import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export async function GET(req: Request) {
  await requirePermission(PERMISSIONS.SHIPPING_MANAGE);
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider") ?? "custom";
  const awb = searchParams.get("awb") ?? "UNKNOWN";

  const title = `Shipping Label — ${provider} — ${awb}`;
  const pdf = [
    `%PDF-1.4`,
    `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`,
    `2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`,
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj`,
    `4 0 obj << /Length 100 >> stream`,
    `BT /F1 16 Tf 72 720 Td (${title.replace(/[()\\]/g, "")}) Tj ET`,
    `BT /F1 10 Tf 72 680 Td (Placeholder label - connect carrier API) Tj ET`,
    `endstream endobj`,
    `5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`,
    `trailer << /Size 6 /Root 1 0 R >>`,
    `startxref`,
    `0`,
    `%%EOF`,
  ].join("\n");

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${awb}-label.pdf"`,
    },
  });
}
