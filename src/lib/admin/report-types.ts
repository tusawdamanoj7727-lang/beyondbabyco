/**
 * Client-safe types and constants for Reports & Analytics.
 */

export const REPORT_FREQUENCIES = ["daily", "weekly", "monthly", "quarterly", "yearly"] as const;
export type ReportFrequency = (typeof REPORT_FREQUENCIES)[number];

export const EXPORT_FORMATS = ["csv", "excel", "pdf", "print"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const DASHBOARD_WIDGET_KEYS = [
  "todays_revenue",
  "monthly_revenue",
  "orders_today",
  "average_order_value",
  "new_customers",
  "returning_customers",
  "inventory_value",
  "low_stock",
  "pending_orders",
  "returns",
  "refunds",
  "pending_reviews",
  "active_coupons",
  "top_carrier",
  "payment_success_rate",
] as const;
export type DashboardWidgetKey = (typeof DASHBOARD_WIDGET_KEYS)[number];

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidgetKey, string> = {
  todays_revenue: "Today's Revenue",
  monthly_revenue: "Monthly Revenue",
  orders_today: "Orders Today",
  average_order_value: "Average Order Value",
  new_customers: "New Customers",
  returning_customers: "Returning Customers",
  inventory_value: "Inventory Value",
  low_stock: "Low Stock",
  pending_orders: "Pending Orders",
  returns: "Returns",
  refunds: "Refunds",
  pending_reviews: "Pending Reviews",
  active_coupons: "Active Coupons",
  top_carrier: "Top Carrier",
  payment_success_rate: "Payment Success Rate",
};

export const CHART_KEYS = [
  "sales_trend",
  "revenue_trend",
  "orders_trend",
  "top_categories",
  "top_products",
  "top_customers",
  "return_reasons",
  "coupon_usage",
  "payment_gateway_split",
  "carrier_performance",
  "inventory_movement",
  "customer_growth",
  "review_rating_distribution",
] as const;
export type ChartKey = (typeof CHART_KEYS)[number];

export const CHART_LABELS: Record<ChartKey, string> = {
  sales_trend: "Sales Trend",
  revenue_trend: "Revenue Trend",
  orders_trend: "Orders Trend",
  top_categories: "Top Categories",
  top_products: "Top Products",
  top_customers: "Top Customers",
  return_reasons: "Return Reasons",
  coupon_usage: "Coupon Usage",
  payment_gateway_split: "Payment Gateway Split",
  carrier_performance: "Carrier Performance",
  inventory_movement: "Inventory Movement",
  customer_growth: "Customer Growth",
  review_rating_distribution: "Review Rating Distribution",
};

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  warehouseId?: string;
  categoryId?: string;
  brandId?: string;
  productId?: string;
  customerId?: string;
  carrierId?: string;
  gatewayId?: string;
  couponId?: string;
  country?: string;
  state?: string;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ReportTableRow {
  [key: string]: string | number | null;
}

export interface ReportSection {
  id: string;
  title: string;
  description?: string;
  metrics?: { label: string; value: string }[];
  chart?: ChartPoint[];
  chartType?: "bar" | "line" | "donut";
  rows?: ReportTableRow[];
  columns?: { key: string; header: string }[];
}

export interface ExecutiveDashboard {
  widgets: Record<DashboardWidgetKey, string>;
  charts: Record<ChartKey, ChartPoint[]>;
  widgetLayout: DashboardWidgetLayout[];
}

export interface DashboardWidgetLayout {
  widgetKey: DashboardWidgetKey;
  visible: boolean;
  sortOrder: number;
}

export interface SavedReportRow {
  id: string;
  name: string;
  reportType: string;
  filters: ReportFilters;
  updatedAt: string;
}

export interface ScheduledReportRow {
  id: string;
  name: string;
  reportType: string;
  frequency: ReportFrequency;
  email: string;
  format: ExportFormat;
  isEnabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

export interface ReportExportRow {
  id: string;
  reportType: string;
  format: ExportFormat;
  status: string;
  rowCount: number;
  fileName: string | null;
  createdAt: string;
}

export interface SalesReport {
  sections: ReportSection[];
}

export interface OrdersReport {
  sections: ReportSection[];
}

export interface ProductsReport {
  sections: ReportSection[];
}

export interface InventoryReport {
  sections: ReportSection[];
}

export interface CustomersReport {
  sections: ReportSection[];
}

export interface PaymentsReport {
  sections: ReportSection[];
}

export interface ShippingReport {
  sections: ReportSection[];
}

export interface ReturnsReport {
  sections: ReportSection[];
}

export interface ReviewsReport {
  sections: ReportSection[];
}

export interface MarketingReport {
  sections: ReportSection[];
}

export interface FinanceReport {
  sections: ReportSection[];
}

export interface FilterOptions {
  warehouses: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  products: { id: string; name: string }[];
  customers: { id: string; name: string }[];
  carriers: { id: string; name: string }[];
  gateways: { id: string; name: string }[];
  coupons: { id: string; name: string }[];
  countries: string[];
  states: string[];
}

export function formatReportMoney(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatReportNumber(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function formatReportPercent(n: number) {
  return `${n.toFixed(1)}%`;
}

export const REPORT_NAV = [
  { href: "/admin/reports", label: "Overview" },
  { href: "/admin/reports/sales", label: "Sales" },
  { href: "/admin/reports/orders", label: "Orders" },
  { href: "/admin/reports/products", label: "Products" },
  { href: "/admin/reports/customers", label: "Customers" },
  { href: "/admin/reports/inventory", label: "Inventory" },
  { href: "/admin/reports/payments", label: "Payments" },
  { href: "/admin/reports/shipping", label: "Shipping" },
  { href: "/admin/reports/returns", label: "Returns" },
  { href: "/admin/reports/reviews", label: "Reviews" },
  { href: "/admin/reports/marketing", label: "Marketing" },
  { href: "/admin/reports/finance", label: "Finance" },
] as const;
