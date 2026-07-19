import { NextResponse } from "next/server";

import {
  exportCouponsAdmin,
  exportInventoryAdmin,
  exportOrdersAdmin,
  exportProductsAdmin,
  type AdminExportFormat,
} from "@/lib/admin/admin-exports";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await requirePermission(PERMISSIONS.REPORTS_EXPORT);
  const url = new URL(req.url);
  const resource = url.searchParams.get("resource") ?? "";
  const format = (url.searchParams.get("format") === "excel" ? "excel" : "csv") as AdminExportFormat;

  let result;
  switch (resource) {
    case "orders":
      result = await exportOrdersAdmin(format);
      break;
    case "products":
      result = await exportProductsAdmin(format);
      break;
    case "inventory":
      result = await exportInventoryAdmin(format);
      break;
    case "coupons":
      result = await exportCouponsAdmin(format);
      break;
    default:
      return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  }

  return new NextResponse(result.content, {
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
