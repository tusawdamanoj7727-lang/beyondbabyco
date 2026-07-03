import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ChartKey,
  ChartPoint,
  CustomersReport,
  DashboardWidgetKey,
  DashboardWidgetLayout,
  ExecutiveDashboard,
  FilterOptions,
  FinanceReport,
  InventoryReport,
  MarketingReport,
  OrdersReport,
  PaymentsReport,
  ProductsReport,
  ReportExportRow,
  ReportFilters,
  ReportSection,
  ReturnsReport,
  ReviewsReport,
  SalesReport,
  SavedReportRow,
  ScheduledReportRow,
  ShippingReport,
} from "./report-types";
import {
  CHART_KEYS,
  DASHBOARD_WIDGET_KEYS,
  formatReportMoney,
  formatReportNumber,
  formatReportPercent,
} from "./report-types";

// ---------------------------------------------------------------------------
// Date / filter helpers
// ---------------------------------------------------------------------------

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function inDateRange(iso: string, from?: string, to?: string) {
  if (from && iso < from) return false;
  if (to && iso > `${to}T23:59:59.999Z`) return false;
  return true;
}

function lastNDaysLabels(n: number) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }));
  }
  return out;
}

function bucketByDay(items: { created_at: string; value: number }[], days = 14): ChartPoint[] {
  const labels = lastNDaysLabels(days);
  const buckets = new Map<string, number>();
  for (const label of labels) buckets.set(label, 0);

  for (const item of items) {
    const label = new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    if (buckets.has(label)) buckets.set(label, (buckets.get(label) ?? 0) + item.value);
  }
  return labels.map((label) => ({ label, value: buckets.get(label) ?? 0 }));
}

function topN(map: Map<string, number>, n = 8): ChartPoint[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, value]) => ({ label, value }));
}

function applyOrderFilters<T extends { created_at: string; warehouse_id?: string | null; customer_id?: string | null; coupon_id?: string | null; status?: string }>(
  rows: T[],
  f: ReportFilters,
  customerCountry?: Map<string, { country?: string | null; state?: string | null }>,
): T[] {
  return rows.filter((o) => {
    if (!inDateRange(o.created_at, f.dateFrom, f.dateTo)) return false;
    if (f.warehouseId && o.warehouse_id !== f.warehouseId) return false;
    if (f.customerId && o.customer_id !== f.customerId) return false;
    if (f.couponId && o.coupon_id !== f.couponId) return false;
    if (f.country || f.state) {
      const addr = o.customer_id ? customerCountry?.get(o.customer_id) : undefined;
      if (f.country && addr?.country !== f.country) return false;
      if (f.state && addr?.state !== f.state) return false;
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

export async function getReportFilterOptions(): Promise<FilterOptions> {
  const supabase = await createSupabaseServerClient();
  const [
    { data: warehouses },
    { data: categories },
    { data: brands },
    { data: products },
    { data: customers },
    { data: carriers },
    { data: gateways },
    { data: coupons },
    { data: addresses },
  ] = await Promise.all([
    supabase.from("warehouses").select("id, name").eq("is_active", true).order("name"),
    supabase.from("categories").select("id, name").eq("status", "active").order("name").limit(200),
    supabase.from("brands").select("id, name").eq("status", "active").order("name").limit(200),
    supabase.from("products").select("id, name").eq("status", "active").order("name").limit(200),
    supabase.from("customers").select("id, full_name, email").is("deleted_at", null).order("full_name").limit(200),
    supabase.from("shipping_carriers").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("payment_gateways").select("id, display_name").is("deleted_at", null).order("display_name"),
    supabase.from("coupons").select("id, code, name").is("deleted_at", null).order("code").limit(200),
    supabase.from("customer_addresses").select("country, state"),
  ]);

  const countries = [...new Set((addresses ?? []).map((a) => a.country).filter(Boolean))] as string[];
  const states = [...new Set((addresses ?? []).map((a) => a.state).filter(Boolean))] as string[];

  return {
    warehouses: warehouses ?? [],
    categories: (categories ?? []).map((c) => ({ id: c.id, name: c.name })),
    brands: (brands ?? []).map((b) => ({ id: b.id, name: b.name })),
    products: (products ?? []).map((p) => ({ id: p.id, name: p.name })),
    customers: (customers ?? []).map((c) => ({ id: c.id, name: c.full_name ?? c.email ?? c.id.slice(0, 8) })),
    carriers: (carriers ?? []).map((c) => ({ id: c.id, name: c.name })),
    gateways: (gateways ?? []).map((g) => ({ id: g.id, name: g.display_name })),
    coupons: (coupons ?? []).map((c) => ({ id: c.id, name: c.name ?? c.code })),
    countries,
    states,
  };
}

// ---------------------------------------------------------------------------
// Executive dashboard
// ---------------------------------------------------------------------------

export async function getExecutiveDashboard(filters: ReportFilters = {}, userId?: string): Promise<ExecutiveDashboard> {
  const supabase = await createSupabaseServerClient();
  const todayStart = startOfToday().toISOString();
  const monthStart = startOfMonth().toISOString();

  const [
    { data: orders },
    { data: payments },
    { data: customers },
    { data: inventory },
    { data: variants },
    { data: returns },
    { data: refunds },
    { data: reviews },
    { data: coupons },
    { data: shipments },
    { data: carriers },
    { data: gateways },
    { data: orderItems },
    { data: products },
    { data: categories },
    { data: movements },
    { data: couponUsage },
    { data: addresses },
    { data: savedWidgets },
  ] = await Promise.all([
    supabase.from("orders").select("id, customer_id, warehouse_id, coupon_id, status, grand_total, created_at"),
    supabase.from("payments").select("id, gateway_id, provider, amount, status, created_at"),
    supabase.from("customers").select("id, created_at").is("deleted_at", null),
    supabase.from("inventory").select("id, product_variant_id, warehouse_id, quantity, reserved, reorder_level"),
    supabase.from("product_variants").select("id, product_id, price"),
    supabase.from("returns").select("id, reason, status, created_at"),
    supabase.from("order_refunds").select("id, amount, created_at"),
    supabase.from("reviews").select("id, rating, moderation_status, created_at"),
    supabase.from("coupons").select("id, code, is_active, used_count, lifecycle_status").is("deleted_at", null),
    supabase.from("shipments").select("id, carrier_id, carrier, status, created_at, delivered_at, shipped_at"),
    supabase.from("shipping_carriers").select("id, name"),
    supabase.from("payment_gateways").select("id, display_name, provider"),
    supabase.from("order_items").select("order_id, product_id, name, quantity, total"),
    supabase.from("products").select("id, name, category_id, brand_id"),
    supabase.from("categories").select("id, name"),
    supabase.from("stock_movements").select("id, type, quantity, created_at"),
    supabase.from("coupon_usage").select("coupon_id, discount_amount, used_at"),
    supabase.from("customer_addresses").select("customer_id, country, state, is_default"),
    userId
      ? supabase.from("dashboard_widgets").select("widget_key, visible, sort_order").eq("user_id", userId).order("sort_order")
      : Promise.resolve({ data: [] }),
  ]);

  const customerGeo = new Map<string, { country?: string | null; state?: string | null }>();
  for (const a of addresses ?? []) {
    if (a.is_default || !customerGeo.has(a.customer_id)) {
      customerGeo.set(a.customer_id, { country: a.country, state: a.state });
    }
  }

  const filteredOrders = applyOrderFilters(orders ?? [], filters, customerGeo);
  const paidStatuses = new Set(["paid", "captured", "authorized"]);
  const cancelledStatuses = new Set(["cancelled", "refunded"]);

  const todayOrders = filteredOrders.filter((o) => o.created_at >= todayStart && !cancelledStatuses.has(o.status));
  const monthOrders = filteredOrders.filter((o) => o.created_at >= monthStart && !cancelledStatuses.has(o.status));
  const pendingOrders = filteredOrders.filter((o) => ["pending", "confirmed", "processing"].includes(o.status));

  const todaysRevenue = todayOrders.reduce((s, o) => s + Number(o.grand_total), 0);
  const monthlyRevenue = monthOrders.reduce((s, o) => s + Number(o.grand_total), 0);
  const aov = todayOrders.length ? todaysRevenue / todayOrders.length : 0;

  const monthCustomers = (customers ?? []).filter((c) => inDateRange(c.created_at, filters.dateFrom ?? monthStart, filters.dateTo));
  const newCustomers = monthCustomers.filter((c) => c.created_at >= monthStart).length;

  const orderCounts = new Map<string, number>();
  for (const o of filteredOrders) {
    if (o.customer_id) orderCounts.set(o.customer_id, (orderCounts.get(o.customer_id) ?? 0) + 1);
  }
  const returningCustomers = [...orderCounts.values()].filter((n) => n > 1).length;

  const priceMap = new Map((variants ?? []).map((v) => [v.id, Number(v.price ?? 0)]));
  let inventoryValue = 0;
  let lowStock = 0;
  for (const inv of inventory ?? []) {
    if (filters.warehouseId && inv.warehouse_id !== filters.warehouseId) continue;
    const available = inv.quantity - inv.reserved;
    inventoryValue += available * (priceMap.get(inv.product_variant_id) ?? 0);
    if (available <= inv.reorder_level) lowStock++;
  }

  const filteredReturns = (returns ?? []).filter((r) => inDateRange(r.created_at, filters.dateFrom, filters.dateTo));
  const filteredRefunds = (refunds ?? []).filter((r) => inDateRange(r.created_at, filters.dateFrom, filters.dateTo));
  const pendingReviews = (reviews ?? []).filter((r) => r.moderation_status === "pending").length;
  const activeCoupons = (coupons ?? []).filter((c) => c.is_active && c.lifecycle_status === "active").length;

  const carrierCounts = new Map<string, number>();
  for (const s of shipments ?? []) {
    if (!inDateRange(s.created_at, filters.dateFrom, filters.dateTo)) continue;
    const name = s.carrier ?? carriers?.find((c) => c.id === s.carrier_id)?.name ?? "Unknown";
    carrierCounts.set(name, (carrierCounts.get(name) ?? 0) + 1);
  }
  const topCarrier = topN(carrierCounts, 1)[0]?.label ?? "—";

  const filteredPayments = (payments ?? []).filter((p) => inDateRange(p.created_at, filters.dateFrom, filters.dateTo));
  const successPayments = filteredPayments.filter((p) => paidStatuses.has(p.status)).length;
  const paymentSuccessRate = filteredPayments.length ? (successPayments / filteredPayments.length) * 100 : 0;

  const orderIdSet = new Set(filteredOrders.map((o) => o.id));
  const filteredItems = (orderItems ?? []).filter((i) => orderIdSet.has(i.order_id));

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const productSales = new Map<string, number>();
  const categorySales = new Map<string, number>();
  const customerSpend = new Map<string, number>();

  for (const item of filteredItems) {
    if (filters.productId && item.product_id !== filters.productId) continue;
    const prod = item.product_id ? productMap.get(item.product_id) : undefined;
    if (filters.categoryId && prod?.category_id !== filters.categoryId) continue;
    if (filters.brandId && prod?.brand_id !== filters.brandId) continue;
    productSales.set(item.name, (productSales.get(item.name) ?? 0) + Number(item.total));
    if (prod?.category_id) {
      const catName = categoryMap.get(prod.category_id) ?? "Uncategorized";
      categorySales.set(catName, (categorySales.get(catName) ?? 0) + Number(item.total));
    }
  }

  for (const o of filteredOrders) {
    if (o.customer_id) customerSpend.set(o.customer_id, (customerSpend.get(o.customer_id) ?? 0) + Number(o.grand_total));
  }

  const customerNameMap = new Map<string, string>();
  const topEntries = [...customerSpend.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (topEntries.length) {
    const { data: topCust } = await supabase.from("customers").select("id, full_name, email").in("id", topEntries.map(([id]) => id));
    for (const c of topCust ?? []) customerNameMap.set(c.id, c.full_name ?? c.email ?? c.id.slice(0, 8));
  }

  const returnReasons = new Map<string, number>();
  for (const r of filteredReturns) returnReasons.set(r.reason, (returnReasons.get(r.reason) ?? 0) + 1);

  const couponUsageMap = new Map<string, number>();
  for (const u of couponUsage ?? []) {
    if (!inDateRange(u.used_at, filters.dateFrom, filters.dateTo)) continue;
    const coupon = coupons?.find((c) => c.id === u.coupon_id);
    couponUsageMap.set(coupon?.code ?? u.coupon_id.slice(0, 8), (couponUsageMap.get(coupon?.code ?? u.coupon_id.slice(0, 8)) ?? 0) + 1);
  }

  const gatewaySplit = new Map<string, number>();
  for (const p of filteredPayments) {
    if (filters.gatewayId && p.gateway_id !== filters.gatewayId) continue;
    const name = gateways?.find((g) => g.id === p.gateway_id)?.display_name ?? p.provider ?? "Unknown";
    gatewaySplit.set(name, (gatewaySplit.get(name) ?? 0) + Number(p.amount));
  }

  const ratingDist = new Map<string, number>();
  for (const r of reviews ?? []) {
    if (!inDateRange(r.created_at, filters.dateFrom, filters.dateTo)) continue;
    const key = `${r.rating}★`;
    ratingDist.set(key, (ratingDist.get(key) ?? 0) + 1);
  }

  const movementTrend = bucketByDay(
    (movements ?? [])
      .filter((m) => inDateRange(m.created_at, filters.dateFrom, filters.dateTo))
      .map((m) => ({ created_at: m.created_at, value: Math.abs(m.quantity) })),
  );

  const salesTrend = bucketByDay(filteredOrders.filter((o) => !cancelledStatuses.has(o.status)).map((o) => ({ created_at: o.created_at, value: Number(o.grand_total) })));
  const revenueTrend = salesTrend;
  const ordersTrend = bucketByDay(filteredOrders.map((o) => ({ created_at: o.created_at, value: 1 })));
  const customerGrowth = bucketByDay((customers ?? []).map((c) => ({ created_at: c.created_at, value: 1 })));

  const widgets: Record<DashboardWidgetKey, string> = {
    todays_revenue: formatReportMoney(todaysRevenue),
    monthly_revenue: formatReportMoney(monthlyRevenue),
    orders_today: formatReportNumber(todayOrders.length),
    average_order_value: formatReportMoney(aov),
    new_customers: formatReportNumber(newCustomers),
    returning_customers: formatReportNumber(returningCustomers),
    inventory_value: formatReportMoney(inventoryValue),
    low_stock: formatReportNumber(lowStock),
    pending_orders: formatReportNumber(pendingOrders.length),
    returns: formatReportNumber(filteredReturns.length),
    refunds: formatReportMoney(filteredRefunds.reduce((s, r) => s + Number(r.amount), 0)),
    pending_reviews: formatReportNumber(pendingReviews),
    active_coupons: formatReportNumber(activeCoupons),
    top_carrier: topCarrier,
    payment_success_rate: formatReportPercent(paymentSuccessRate),
  };

  const charts: Record<ChartKey, ChartPoint[]> = {
    sales_trend: salesTrend,
    revenue_trend: revenueTrend,
    orders_trend: ordersTrend,
    top_categories: topN(categorySales),
    top_products: topN(productSales),
    top_customers: topN(
      new Map([...customerSpend.entries()].map(([id, v]) => [customerNameMap.get(id) ?? id.slice(0, 8), v])),
    ),
    return_reasons: topN(returnReasons),
    coupon_usage: topN(couponUsageMap),
    payment_gateway_split: topN(gatewaySplit),
    carrier_performance: topN(carrierCounts),
    inventory_movement: movementTrend,
    customer_growth: customerGrowth,
    review_rating_distribution: [...ratingDist.entries()]
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([label, value]) => ({ label, value })),
  };

  const savedLayout = (savedWidgets ?? []) as { widget_key: string; visible: boolean; sort_order: number }[];
  const widgetLayout: DashboardWidgetLayout[] = DASHBOARD_WIDGET_KEYS.map((key, i) => {
    const saved = savedLayout.find((w) => w.widget_key === key);
    return { widgetKey: key, visible: saved?.visible ?? true, sortOrder: saved?.sort_order ?? i };
  }).sort((a, b) => a.sortOrder - b.sortOrder);

  return { widgets, charts, widgetLayout };
}

export async function getDashboardWidgetLayout(userId: string): Promise<DashboardWidgetLayout[]> {
  const dash = await getExecutiveDashboard({}, userId);
  return dash.widgetLayout;
}

// ---------------------------------------------------------------------------
// Category reports
// ---------------------------------------------------------------------------

function section(id: string, title: string, partial: Partial<ReportSection>): ReportSection {
  return { id, title, ...partial };
}

export async function getSalesReport(filters: ReportFilters = {}): Promise<SalesReport> {
  const dash = await getExecutiveDashboard(filters);
  const supabase = await createSupabaseServerClient();
  const { data: orders } = await supabase.from("orders").select("grand_total, tax_total, discount_total, status, created_at");
  const { data: refunds } = await supabase.from("order_refunds").select("amount, created_at");

  const filtered = (orders ?? []).filter((o) => inDateRange(o.created_at, filters.dateFrom, filters.dateTo) && o.status !== "cancelled");
  const revenue = filtered.reduce((s, o) => s + Number(o.grand_total), 0);
  const tax = filtered.reduce((s, o) => s + Number(o.tax_total), 0);
  const discounts = filtered.reduce((s, o) => s + Number(o.discount_total), 0);
  const refundTotal = (refunds ?? []).filter((r) => inDateRange(r.created_at, filters.dateFrom, filters.dateTo)).reduce((s, r) => s + Number(r.amount), 0);
  const margin = revenue - refundTotal;

  return {
    sections: [
      section("revenue", "Revenue", { metrics: [{ label: "Total Revenue", value: formatReportMoney(revenue) }], chart: dash.charts.revenue_trend, chartType: "line" }),
      section("tax", "Tax", { metrics: [{ label: "Tax Collected", value: formatReportMoney(tax) }] }),
      section("refunds", "Refunds", { metrics: [{ label: "Refunds", value: formatReportMoney(refundTotal) }] }),
      section("margins", "Margins", { metrics: [{ label: "Net after Refunds", value: formatReportMoney(margin) }, { label: "Discounts", value: formatReportMoney(discounts) }] }),
      section("sales_trend", "Sales Trend", { chart: dash.charts.sales_trend, chartType: "bar" }),
    ],
  };
}

export async function getOrdersReport(filters: ReportFilters = {}): Promise<OrdersReport> {
  const supabase = await createSupabaseServerClient();
  const { data: orders } = await supabase.from("orders").select("status, created_at, warehouse_id, customer_id, coupon_id");
  const { data: addresses } = await supabase.from("customer_addresses").select("customer_id, country, state, is_default");
  const geo = new Map<string, { country?: string | null; state?: string | null }>();
  for (const a of addresses ?? []) {
    if (a.is_default || !geo.has(a.customer_id)) geo.set(a.customer_id, { country: a.country, state: a.state });
  }
  const filtered = applyOrderFilters(orders ?? [], filters, geo);

  const statusBreakdown = new Map<string, number>();
  for (const o of filtered) statusBreakdown.set(o.status, (statusBreakdown.get(o.status) ?? 0) + 1);

  const fulfillment = filtered.filter((o) => ["packed", "shipped", "delivered", "completed"].includes(o.status)).length;
  const cancelled = filtered.filter((o) => o.status === "cancelled").length;

  return {
    sections: [
      section("status", "Status Breakdown", {
        chart: topN(statusBreakdown),
        chartType: "donut",
        rows: [...statusBreakdown.entries()].map(([status, count]) => ({ status, count })),
        columns: [{ key: "status", header: "Status" }, { key: "count", header: "Orders" }],
      }),
      section("fulfillment", "Fulfillment", { metrics: [{ label: "Fulfilled Orders", value: formatReportNumber(fulfillment) }] }),
      section("cancellation", "Cancellation", { metrics: [{ label: "Cancelled", value: formatReportNumber(cancelled) }] }),
    ],
  };
}

export async function getProductsReport(filters: ReportFilters = {}): Promise<ProductsReport> {
  const dash = await getExecutiveDashboard(filters);
  const supabase = await createSupabaseServerClient();
  const { data: items } = await supabase.from("order_items").select("product_id, name, quantity, total, order_id");
  const { data: orders } = await supabase.from("orders").select("id, created_at, status");
  const orderDates = new Map((orders ?? []).map((o) => [o.id, o]));

  const sales = new Map<string, { qty: number; revenue: number }>();
  for (const item of items ?? []) {
    const order = orderDates.get(item.order_id);
    if (!order || order.status === "cancelled") continue;
    if (!inDateRange(order.created_at, filters.dateFrom, filters.dateTo)) continue;
    if (filters.productId && item.product_id !== filters.productId) continue;
    const cur = sales.get(item.name) ?? { qty: 0, revenue: 0 };
    cur.qty += item.quantity;
    cur.revenue += Number(item.total);
    sales.set(item.name, cur);
  }

  const sorted = [...sales.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
  const best = sorted.slice(0, 10);
  const worst = [...sorted].reverse().slice(0, 10);

  const { data: inventory } = await supabase.from("inventory").select("quantity, reserved, reorder_level");
  const outOfStock = (inventory ?? []).filter((i) => i.quantity - i.reserved <= 0).length;

  return {
    sections: [
      section("best", "Best Sellers", {
        rows: best.map(([name, d]) => ({ product: name, quantity: d.qty, revenue: formatReportMoney(d.revenue) })),
        columns: [{ key: "product", header: "Product" }, { key: "quantity", header: "Qty" }, { key: "revenue", header: "Revenue" }],
      }),
      section("worst", "Worst Sellers", {
        rows: worst.map(([name, d]) => ({ product: name, quantity: d.qty, revenue: formatReportMoney(d.revenue) })),
        columns: [{ key: "product", header: "Product" }, { key: "quantity", header: "Qty" }, { key: "revenue", header: "Revenue" }],
      }),
      section("oos", "Out of Stock", { metrics: [{ label: "SKUs at zero", value: formatReportNumber(outOfStock) }] }),
      section("top_products", "Top Products Chart", { chart: dash.charts.top_products, chartType: "bar" }),
    ],
  };
}

export async function getInventoryReport(filters: ReportFilters = {}): Promise<InventoryReport> {
  const dash = await getExecutiveDashboard(filters);
  const supabase = await createSupabaseServerClient();
  const [{ data: inventory }, { data: variants }] = await Promise.all([
    supabase.from("inventory").select("product_variant_id, warehouse_id, quantity, reserved, reorder_level"),
    supabase.from("product_variants").select("id, sku, price"),
  ]);
  const priceMap = new Map((variants ?? []).map((v) => [v.id, { price: Number(v.price ?? 0), sku: v.sku }]));

  let totalValue = 0;
  let lowStock = 0;
  const rows: { sku: string; available: number; value: string }[] = [];

  for (const inv of inventory ?? []) {
    if (filters.warehouseId && inv.warehouse_id !== filters.warehouseId) continue;
    const available = inv.quantity - inv.reserved;
    const meta = priceMap.get(inv.product_variant_id);
    const value = available * (meta?.price ?? 0);
    totalValue += value;
    if (available <= inv.reorder_level) lowStock++;
    if (rows.length < 50) rows.push({ sku: meta?.sku ?? inv.product_variant_id.slice(0, 8), available, value: formatReportMoney(value) });
  }

  return {
    sections: [
      section("value", "Inventory Value", { metrics: [{ label: "Total Value", value: formatReportMoney(totalValue) }, { label: "Low Stock SKUs", value: formatReportNumber(lowStock) }] }),
      section("movement", "Inventory Movement", { chart: dash.charts.inventory_movement, chartType: "line" }),
      section("detail", "Stock Detail", { rows, columns: [{ key: "sku", header: "SKU" }, { key: "available", header: "Available" }, { key: "value", header: "Value" }] }),
    ],
  };
}

export async function getCustomerReport(filters: ReportFilters = {}): Promise<CustomersReport> {
  const dash = await getExecutiveDashboard(filters);
  const supabase = await createSupabaseServerClient();
  const [{ data: customers }, { data: orders }, { data: addresses }] = await Promise.all([
    supabase.from("customers").select("id, full_name, email, created_at").is("deleted_at", null),
    supabase.from("orders").select("customer_id, grand_total, created_at, status"),
    supabase.from("customer_addresses").select("customer_id, country, state, city, is_default"),
  ]);

  const spend = new Map<string, { total: number; orders: number }>();
  for (const o of orders ?? []) {
    if (!o.customer_id || o.status === "cancelled") continue;
    if (!inDateRange(o.created_at, filters.dateFrom, filters.dateTo)) continue;
    const cur = spend.get(o.customer_id) ?? { total: 0, orders: 0 };
    cur.total += Number(o.grand_total);
    cur.orders++;
    spend.set(o.customer_id, cur);
  }

  const repeat = [...spend.values()].filter((s) => s.orders > 1).length;
  const avgLtv = spend.size ? [...spend.values()].reduce((s, v) => s + v.total, 0) / spend.size : 0;

  const nameMap = new Map((customers ?? []).map((c) => [c.id, c.full_name ?? c.email ?? "Guest"]));
  const topCustomers = topN(new Map([...spend.entries()].map(([id, v]) => [nameMap.get(id) ?? id.slice(0, 8), v.total])));

  const geo = new Map<string, number>();
  for (const a of addresses ?? []) {
    if (filters.country && a.country !== filters.country) continue;
    if (filters.state && a.state !== filters.state) continue;
    const key = a.state ? `${a.state}, ${a.country}` : (a.country ?? "Unknown");
    geo.set(key, (geo.get(key) ?? 0) + 1);
  }

  return {
    sections: [
      section("ltv", "Customer LTV", { metrics: [{ label: "Average LTV", value: formatReportMoney(avgLtv) }] }),
      section("repeat", "Repeat Rate", { metrics: [{ label: "Repeat Customers", value: formatReportNumber(repeat) }] }),
      section("top", "Top Customers", { chart: topCustomers, chartType: "bar" }),
      section("geo", "Geographic Distribution", { chart: topN(geo), chartType: "bar" }),
      section("growth", "Customer Growth", { chart: dash.charts.customer_growth, chartType: "line" }),
    ],
  };
}

export async function getPaymentReport(filters: ReportFilters = {}): Promise<PaymentsReport> {
  const dash = await getExecutiveDashboard(filters);
  const supabase = await createSupabaseServerClient();
  const [{ data: payments }, { data: settlements }] = await Promise.all([
    supabase.from("payments").select("status, amount, gateway_id, provider, created_at"),
    supabase.from("settlements").select("settlement_date, expected_amount, received_amount, difference, status"),
  ]);

  const filtered = (payments ?? []).filter((p) => {
    if (!inDateRange(p.created_at, filters.dateFrom, filters.dateTo)) return false;
    if (filters.gatewayId && p.gateway_id !== filters.gatewayId) return false;
    return true;
  });

  const success = filtered.filter((p) => ["paid", "captured"].includes(p.status)).length;
  const failed = filtered.filter((p) => p.status === "failed").length;
  const refunded = filtered.filter((p) => ["refunded", "partially_refunded"].includes(p.status)).length;
  const rate = filtered.length ? (success / filtered.length) * 100 : 0;

  return {
    sections: [
      section("gateway", "Gateway Success", { metrics: [{ label: "Success Rate", value: formatReportPercent(rate) }], chart: dash.charts.payment_gateway_split, chartType: "donut" }),
      section("failed", "Failed Payments", { metrics: [{ label: "Failed", value: formatReportNumber(failed) }] }),
      section("refunds", "Refunds", { metrics: [{ label: "Refunded Txns", value: formatReportNumber(refunded) }] }),
      section("settlements", "Settlements", {
        rows: (settlements ?? []).slice(0, 20).map((s) => ({
          date: s.settlement_date,
          expected: formatReportMoney(Number(s.expected_amount)),
          received: formatReportMoney(Number(s.received_amount)),
          diff: formatReportMoney(Number(s.difference)),
          status: s.status,
        })),
        columns: [
          { key: "date", header: "Date" },
          { key: "expected", header: "Expected" },
          { key: "received", header: "Received" },
          { key: "diff", header: "Difference" },
          { key: "status", header: "Status" },
        ],
      }),
    ],
  };
}

export async function getShippingReport(filters: ReportFilters = {}): Promise<ShippingReport> {
  const dash = await getExecutiveDashboard(filters);
  const supabase = await createSupabaseServerClient();
  const [{ data: shipments }, { data: ndrs }] = await Promise.all([
    supabase.from("shipments").select("carrier_id, carrier, status, created_at, shipped_at, delivered_at"),
    supabase.from("ndr_events").select("status, reason, created_at"),
  ]);

  const filtered = (shipments ?? []).filter((s) => {
    if (!inDateRange(s.created_at, filters.dateFrom, filters.dateTo)) return false;
    if (filters.carrierId && s.carrier_id !== filters.carrierId) return false;
    return true;
  });

  const ndrCount = (ndrs ?? []).filter((n) => inDateRange(n.created_at, filters.dateFrom, filters.dateTo)).length;
  const rto = filtered.filter((s) => s.status === "returned").length;

  let totalDeliveryDays = 0;
  let deliveredCount = 0;
  for (const s of filtered) {
    if (s.shipped_at && s.delivered_at) {
      totalDeliveryDays += (new Date(s.delivered_at).getTime() - new Date(s.shipped_at).getTime()) / 86400000;
      deliveredCount++;
    }
  }
  const avgDelivery = deliveredCount ? totalDeliveryDays / deliveredCount : 0;

  return {
    sections: [
      section("carrier", "Carrier Performance", { chart: dash.charts.carrier_performance, chartType: "bar" }),
      section("ndr", "NDR", { metrics: [{ label: "NDR Events", value: formatReportNumber(ndrCount) }] }),
      section("rto", "RTO", { metrics: [{ label: "RTO Shipments", value: formatReportNumber(rto) }] }),
      section("delivery", "Delivery Time", { metrics: [{ label: "Avg Delivery Days", value: avgDelivery.toFixed(1) }] }),
    ],
  };
}

export async function getReturnsReportData(filters: ReportFilters = {}): Promise<ReturnsReport> {
  const supabase = await createSupabaseServerClient();
  const [{ data: returns }, { data: orders }] = await Promise.all([
    supabase.from("returns").select("reason, refund_amount, restock_completed, status, created_at"),
    supabase.from("orders").select("id, created_at"),
  ]);

  const filtered = (returns ?? []).filter((r) => inDateRange(r.created_at, filters.dateFrom, filters.dateTo));
  const orderCount = (orders ?? []).filter((o) => inDateRange(o.created_at, filters.dateFrom, filters.dateTo)).length;
  const returnRate = orderCount ? (filtered.length / orderCount) * 100 : 0;

  const reasons = new Map<string, number>();
  for (const r of filtered) reasons.set(r.reason, (reasons.get(r.reason) ?? 0) + 1);

  const restocked = filtered.filter((r) => r.restock_completed).length;
  const restockRate = filtered.length ? (restocked / filtered.length) * 100 : 0;

  return {
    sections: [
      section("rate", "Return Rate", { metrics: [{ label: "Return Rate", value: formatReportPercent(returnRate) }] }),
      section("reasons", "Refund Reasons", { chart: topN(reasons), chartType: "bar" }),
      section("restock", "Restock Rate", { metrics: [{ label: "Restock Rate", value: formatReportPercent(restockRate) }] }),
    ],
  };
}

export async function getReviewsReport(filters: ReportFilters = {}): Promise<ReviewsReport> {
  const dash = await getExecutiveDashboard(filters);
  const supabase = await createSupabaseServerClient();
  const { data: reviews } = await supabase.from("reviews").select("rating, moderation_status, created_at");

  const filtered = (reviews ?? []).filter((r) => inDateRange(r.created_at, filters.dateFrom, filters.dateTo));
  const avg = filtered.length ? filtered.reduce((s, r) => s + r.rating, 0) / filtered.length : 0;
  const pending = filtered.filter((r) => r.moderation_status === "pending").length;

  return {
    sections: [
      section("rating", "Average Rating", { metrics: [{ label: "Average", value: avg.toFixed(2) }] }),
      section("moderation", "Moderation Queue", { metrics: [{ label: "Pending", value: formatReportNumber(pending) }] }),
      section("distribution", "Rating Distribution", { chart: dash.charts.review_rating_distribution, chartType: "bar" }),
    ],
  };
}

export async function getMarketingReport(filters: ReportFilters = {}): Promise<MarketingReport> {
  const dash = await getExecutiveDashboard(filters);
  const supabase = await createSupabaseServerClient();
  const [{ data: coupons }, { data: usage }, { data: orders }] = await Promise.all([
    supabase.from("coupons").select("id, code, used_count, total_revenue, is_active").is("deleted_at", null),
    supabase.from("coupon_usage").select("coupon_id, discount_amount, order_id, used_at"),
    supabase.from("orders").select("id, coupon_id, grand_total, created_at"),
  ]);

  const filteredUsage = (usage ?? []).filter((u) => inDateRange(u.used_at, filters.dateFrom, filters.dateTo));
  const ordersWithCoupon = (orders ?? []).filter((o) => o.coupon_id && inDateRange(o.created_at, filters.dateFrom, filters.dateTo));
  const totalOrders = (orders ?? []).filter((o) => inDateRange(o.created_at, filters.dateFrom, filters.dateTo)).length;
  const conversion = totalOrders ? (ordersWithCoupon.length / totalOrders) * 100 : 0;

  const campaignRows = (coupons ?? [])
    .filter((c) => !filters.couponId || c.id === filters.couponId)
    .slice(0, 15)
    .map((c) => ({
      code: c.code,
      uses: c.used_count,
      revenue: formatReportMoney(Number(c.total_revenue)),
      active: c.is_active ? "Yes" : "No",
    }));

  return {
    sections: [
      section("usage", "Coupon Usage", { chart: dash.charts.coupon_usage, chartType: "bar", metrics: [{ label: "Redemptions", value: formatReportNumber(filteredUsage.length) }] }),
      section("conversion", "Conversion", { metrics: [{ label: "Coupon Conversion", value: formatReportPercent(conversion) }] }),
      section("campaigns", "Campaign Performance", {
        rows: campaignRows,
        columns: [{ key: "code", header: "Coupon" }, { key: "uses", header: "Uses" }, { key: "revenue", header: "Revenue" }, { key: "active", header: "Active" }],
      }),
    ],
  };
}

export async function getFinanceReport(filters: ReportFilters = {}): Promise<FinanceReport> {
  const sales = await getSalesReport(filters);
  const revenue = sales.sections.find((s) => s.id === "revenue")?.metrics?.[0]?.value ?? formatReportMoney(0);
  const tax = sales.sections.find((s) => s.id === "tax")?.metrics?.[0]?.value ?? formatReportMoney(0);
  const refunds = sales.sections.find((s) => s.id === "refunds")?.metrics?.[0]?.value ?? formatReportMoney(0);
  const profit = sales.sections.find((s) => s.id === "margins")?.metrics?.[0]?.value ?? formatReportMoney(0);

  return {
    sections: [
      section("revenue", "Revenue", { metrics: [{ label: "Revenue", value: revenue }] }),
      section("expenses", "Expenses", { metrics: [{ label: "Refunds (Expense)", value: refunds }] }),
      section("profit", "Profit", { metrics: [{ label: "Net", value: profit }] }),
      section("gst", "GST Summary", { metrics: [{ label: "GST Collected", value: tax }] }),
    ],
  };
}

// ---------------------------------------------------------------------------
// Saved / scheduled / exports
// ---------------------------------------------------------------------------

export async function listSavedReports(userId?: string): Promise<SavedReportRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("saved_reports").select("id, name, report_type, filters, updated_at").order("updated_at", { ascending: false }).limit(20);
  if (userId) query = query.eq("created_by", userId);
  const { data } = await query;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    reportType: r.report_type,
    filters: r.filters as ReportFilters,
    updatedAt: r.updated_at,
  }));
}

export async function listScheduledReports(): Promise<ScheduledReportRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("scheduled_reports").select("*").order("created_at", { ascending: false }).limit(20);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    reportType: r.report_type,
    frequency: r.frequency as ScheduledReportRow["frequency"],
    email: r.email,
    format: r.format as ScheduledReportRow["format"],
    isEnabled: r.is_enabled,
    lastRunAt: r.last_run_at,
    nextRunAt: r.next_run_at,
  }));
}

export async function listReportExports(userId?: string): Promise<ReportExportRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("report_exports").select("*").order("created_at", { ascending: false }).limit(20);
  if (userId) query = query.eq("created_by", userId);
  const { data } = await query;
  return (data ?? []).map((r) => ({
    id: r.id,
    reportType: r.report_type,
    format: r.format as ReportExportRow["format"],
    status: r.status,
    rowCount: r.row_count,
    fileName: r.file_name,
    createdAt: r.created_at,
  }));
}

// Re-export chart keys for layout
export { CHART_KEYS, DASHBOARD_WIDGET_KEYS };
