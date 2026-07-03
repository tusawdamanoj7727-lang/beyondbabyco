import type { Metadata } from "next";

import PageHeader from "@/components/admin/PageHeader";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  RETURN_SORTABLE_COLUMNS,
  getReturnDashboard,
  getReturnFilterOptions,
  listReturns,
  type ReturnSortColumn,
} from "@/lib/admin/returns";
import {
  REFUND_STATUSES,
  RETURN_REASONS,
  RETURN_STATUSES,
  type RefundStatus,
  type ReturnReason,
  type ReturnStatus,
} from "@/lib/admin/return-types";
import ReturnsClient from "./ReturnsClient";

export const metadata: Metadata = { title: "Returns & RMA" };

function parseSort(v: string | undefined): ReturnSortColumn {
  return (RETURN_SORTABLE_COLUMNS as readonly string[]).includes(v ?? "") ? (v as ReturnSortColumn) : "created_at";
}

function parseStatus(v: string | undefined): ReturnStatus | "all" {
  return (RETURN_STATUSES as readonly string[]).includes(v ?? "") ? (v as ReturnStatus) : "all";
}

function parseReason(v: string | undefined): ReturnReason | "all" {
  return (RETURN_REASONS as readonly string[]).includes(v ?? "") ? (v as ReturnReason) : "all";
}

function parseRefundStatus(v: string | undefined): RefundStatus | "all" {
  return (REFUND_STATUSES as readonly string[]).includes(v ?? "") ? (v as RefundStatus) : "all";
}

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission(PERMISSIONS.RETURNS_MANAGE);

  const sp = await searchParams;
  const sort = parseSort(sp.sort);
  const dir = sp.dir === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(sp.page) || 1);

  const [result, dashboard, options] = await Promise.all([
    listReturns({
      search: sp.q ?? "",
      status: parseStatus(sp.status),
      reason: parseReason(sp.reason),
      refundStatus: parseRefundStatus(sp.refund),
      warehouseId: sp.warehouse,
      customerId: sp.customer,
      dateFrom: sp.from,
      dateTo: sp.to,
      sort,
      dir,
      page,
    }),
    getReturnDashboard(),
    getReturnFilterOptions(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Sales"
        title="Returns & RMA"
        description="Manage return requests, warehouse inspection, restocking, and refunds"
      />

      <ReturnsClient
        rows={result.rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        pageCount={result.pageCount}
        dashboard={dashboard}
        warehouses={options.warehouses}
        customers={options.customers}
        filters={{
          search: sp.q ?? "",
          status: parseStatus(sp.status),
          reason: parseReason(sp.reason),
          refundStatus: parseRefundStatus(sp.refund),
          warehouseId: sp.warehouse ?? "",
          customerId: sp.customer ?? "",
          dateFrom: sp.from ?? "",
          dateTo: sp.to ?? "",
        }}
        sort={sort}
        dir={dir}
      />
    </div>
  );
}
