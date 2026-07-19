import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOperationsOverview } from "@/lib/admin/operations";
import { formatInr } from "@/lib/catalog/format";

export type AdminDashboardActivity = {
  id: string;
  type: "order" | "customer" | "review";
  title: string;
  subtitle: string;
  href: string;
  createdAt: string;
};

export type AdminDashboardOverview = {
  stats: {
    products: number;
    orders: number;
    customers: number;
    revenueMonth: string;
    revenueMonthRaw: number;
    aovMonth: string;
    aovMonthRaw: number;
    ordersToday: number;
    ordersWeek: number;
    ordersMonth: number;
    pendingOrders: number;
    processingOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    refundsPending: number;
    refundsMonthAmount: string;
    lowStock: number;
    outOfStock: number;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    grandTotal: number;
    createdAt: string;
    customerName: string | null;
  }[];
  topProducts: { id: string; name: string; orderCount: number }[];
  activity: AdminDashboardActivity[];
  storeHealth: {
    overall: "healthy" | "degraded" | "unknown";
    emailOk: boolean;
    dbOk: boolean;
    envWarnings: number;
  };
  homepagePublished: boolean;
};

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday start
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function mapHealthOverall(value: string | undefined): AdminDashboardOverview["storeHealth"]["overall"] {
  if (value === "ok") return "healthy";
  if (value === "degraded" || value === "error") return "degraded";
  return "unknown";
}

async function loadCustomers(ids: string[]) {
  const map = new Map<string, { full_name: string | null; email: string | null }>();
  if (!ids.length) return map;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("customers").select("id, full_name, email").in("id", ids);
  for (const c of data ?? []) map.set(c.id, { full_name: c.full_name, email: c.email });
  return map;
}

export async function getAdminDashboardOverview(): Promise<AdminDashboardOverview> {
  const supabase = await createSupabaseServerClient();
  const todayStart = startOfDay();
  const weekStart = startOfWeek();
  const monthStart = startOfMonth();

  const [
    { count: productCount },
    { count: orderCount },
    { count: customerCount },
    { data: monthOrders },
    { count: ordersToday },
    { count: ordersWeek },
    { count: pendingOrderCount },
    { count: processingOrderCount },
    { count: deliveredOrderCount },
    { count: cancelledOrderCount },
    { count: refundsPending },
    { data: monthRefunds },
    { data: recentOrderRows },
    { data: orderItems },
    { data: products },
    { data: inventory },
    { data: publishSetting },
    ops,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .is("deleted_at", null),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("customers").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase
      .from("orders")
      .select("grand_total, status, created_at")
      .gte("created_at", monthStart)
      .not("status", "in", '("cancelled","refunded")'),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekStart),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "confirmed"]),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["processing", "packed"]),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "delivered"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["cancelled", "refunded"]),
    supabase
      .from("order_refunds")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("order_refunds")
      .select("amount, status, created_at")
      .gte("created_at", monthStart),
    supabase
      .from("orders")
      .select("id, order_number, status, grand_total, created_at, customer_id")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("order_items").select("product_id, quantity").limit(800),
    supabase.from("products").select("id, name").is("deleted_at", null).limit(200),
    supabase.from("inventory").select("quantity, reserved, reorder_level"),
    supabase.from("homepage_settings").select("value").eq("key", "publish").maybeSingle(),
    getOperationsOverview().catch(() => null),
  ]);

  const customerIds = [...new Set((recentOrderRows ?? []).map((o) => o.customer_id).filter(Boolean))] as string[];
  const customerMap = await loadCustomers(customerIds);

  const monthRows = monthOrders ?? [];
  const revenueMonth = monthRows.reduce((s, o) => s + Number(o.grand_total ?? 0), 0);
  const aovMonth = monthRows.length ? revenueMonth / monthRows.length : 0;

  const refundsMonthAmount = (monthRefunds ?? [])
    .filter((r) => ["refunded", "paid", "partially_refunded", "pending"].includes(String(r.status)))
    .reduce((s, r) => s + Number(r.amount ?? 0), 0);

  let lowStock = 0;
  let outOfStock = 0;
  for (const inv of inventory ?? []) {
    const available = Number(inv.quantity) - Number(inv.reserved);
    if (available <= 0) outOfStock += 1;
    else if (available <= Number(inv.reorder_level)) lowStock += 1;
  }

  const productNameMap = new Map((products ?? []).map((p) => [p.id, p.name]));
  const productCounts = new Map<string, number>();
  for (const item of orderItems ?? []) {
    if (!item.product_id) continue;
    productCounts.set(item.product_id, (productCounts.get(item.product_id) ?? 0) + item.quantity);
  }
  const topProducts = [...productCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, sold]) => ({
      id,
      name: productNameMap.get(id) ?? "Product",
      orderCount: sold,
    }));

  const recent = (recentOrderRows ?? []).map((o) => {
    const customer = o.customer_id ? customerMap.get(o.customer_id) : undefined;
    return {
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      grandTotal: Number(o.grand_total),
      createdAt: o.created_at,
      customerName: customer?.full_name ?? customer?.email ?? null,
    };
  });

  const activity: AdminDashboardActivity[] = recent.map((o) => ({
    id: o.id,
    type: "order" as const,
    title: `Order ${o.orderNumber}`,
    subtitle: `${o.customerName ?? "Guest"} · ${formatInr(o.grandTotal)}`,
    href: `/admin/orders/${o.id}`,
    createdAt: o.createdAt,
  }));

  const publishValue = publishSetting?.value as { status?: string } | null | undefined;
  const dbProbe = ops?.health?.probes?.find((p) => p.name === "database");

  const storeHealth = {
    overall: mapHealthOverall(ops?.health?.overall),
    emailOk: ops?.email?.status === "ok",
    dbOk: dbProbe?.status === "ok",
    envWarnings: ops?.envWarnings?.length ?? 0,
  };

  return {
    stats: {
      products: productCount ?? 0,
      orders: orderCount ?? 0,
      customers: customerCount ?? 0,
      revenueMonth: formatInr(revenueMonth),
      revenueMonthRaw: revenueMonth,
      aovMonth: formatInr(aovMonth),
      aovMonthRaw: aovMonth,
      ordersToday: ordersToday ?? 0,
      ordersWeek: ordersWeek ?? 0,
      ordersMonth: monthRows.length,
      pendingOrders: pendingOrderCount ?? 0,
      processingOrders: processingOrderCount ?? 0,
      deliveredOrders: deliveredOrderCount ?? 0,
      cancelledOrders: cancelledOrderCount ?? 0,
      refundsPending: refundsPending ?? 0,
      refundsMonthAmount: formatInr(refundsMonthAmount),
      lowStock,
      outOfStock,
    },
    recentOrders: recent,
    topProducts,
    activity,
    storeHealth,
    homepagePublished: publishValue?.status === "published",
  };
}
