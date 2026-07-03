import "server-only";

export type {
  ExecutiveDashboard,
  SalesReport,
  OrdersReport,
  ProductsReport,
  InventoryReport,
  CustomersReport,
  PaymentsReport,
  ShippingReport,
  ReturnsReport,
  ReviewsReport,
  MarketingReport,
  FinanceReport,
  ReportFilters,
  FilterOptions,
} from "@/lib/admin/report-types";

export {
  getSalesReport,
  getOrdersReport,
  getInventoryReport,
  getCustomerReport,
  getPaymentReport,
  getShippingReport,
  getMarketingReport,
  getFinanceReport,
  getProductsReport,
  getReturnsReportData as getReturnsReport,
  getReviewsReport,
  getExecutiveDashboard,
  getReportFilterOptions,
  listSavedReports,
  listScheduledReports,
  listReportExports,
} from "@/lib/admin/reports";

export async function getReportsOverview(userId?: string) {
  const { getExecutiveDashboard } = await import("@/lib/admin/reports");
  return getExecutiveDashboard({}, userId);
}
