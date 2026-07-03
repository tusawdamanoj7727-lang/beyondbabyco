import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { exportCustomersCsv } from "@/lib/admin/customers";
import { CUSTOMER_STATUSES, type CustomerStatus } from "@/lib/admin/customer-types";

export async function GET(req: Request) {
  await requirePermission(PERMISSIONS.CUSTOMERS_MANAGE);
  const url = new URL(req.url);
  const status = (CUSTOMER_STATUSES as readonly string[]).includes(url.searchParams.get("status") ?? "")
    ? (url.searchParams.get("status") as CustomerStatus)
    : "all";

  const csv = await exportCustomersCsv({
    search: url.searchParams.get("q") ?? "",
    status,
    vip: url.searchParams.get("vip") === "1",
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
