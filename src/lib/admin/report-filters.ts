import type { ReportFilters } from "@/lib/admin/report-types";

export function parseReportFilters(sp: Record<string, string | undefined>): ReportFilters {
  return {
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
    warehouseId: sp.warehouseId,
    categoryId: sp.categoryId,
    brandId: sp.brandId,
    productId: sp.productId,
    customerId: sp.customerId,
    carrierId: sp.carrierId,
    gatewayId: sp.gatewayId,
    couponId: sp.couponId,
    country: sp.country,
    state: sp.state,
  };
}
