#!/usr/bin/env node
/**
 * Verify admin dashboard metrics against production Supabase.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

import { loadEnvFile } from "./env-config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

if (!existsSync(envPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

const env = loadEnvFile(envPath, readFileSync, existsSync);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

const todayStart = startOfToday();
const monthStart = startOfMonth();

const [
  { count: products },
  { count: orders },
  { count: customers },
  { data: todayOrders },
  { count: pendingOrders },
  { data: payments },
  { count: couponUsage },
  { data: inventory },
  { data: recentCustomers },
  { data: orderItems },
] = await Promise.all([
  supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active").is("deleted_at", null),
  supabase.from("orders").select("id", { count: "exact", head: true }),
  supabase.from("customers").select("id", { count: "exact", head: true }).is("deleted_at", null),
  supabase.from("orders").select("grand_total, status").gte("created_at", todayStart),
  supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "confirmed", "processing"]),
  supabase.from("payments").select("status"),
  supabase.from("coupon_usage").select("id", { count: "exact", head: true }).gte("used_at", monthStart),
  supabase.from("inventory").select("quantity, reserved, reorder_level"),
  supabase.from("customers").select("id, full_name, email, created_at").is("deleted_at", null).order("created_at", { ascending: false }).limit(5),
  supabase.from("order_items").select("product_id, quantity"),
]);

const cancelled = new Set(["cancelled", "refunded"]);
const activeToday = (todayOrders ?? []).filter((o) => !cancelled.has(o.status));
const todaysRevenue = activeToday.reduce((s, o) => s + Number(o.grand_total ?? 0), 0);
const aov = activeToday.length ? todaysRevenue / activeToday.length : 0;

let lowStock = 0;
let inventoryAlerts = 0;
for (const inv of inventory ?? []) {
  const available = inv.quantity - inv.reserved;
  if (available <= inv.reorder_level) lowStock++;
  if (available <= 0 || available <= inv.reorder_level) inventoryAlerts++;
}

const productCounts = new Map();
for (const item of orderItems ?? []) {
  if (!item.product_id) continue;
  productCounts.set(item.product_id, (productCounts.get(item.product_id) ?? 0) + item.quantity);
}
const topProducts = [...productCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

console.log("=== Production Dashboard Metrics ===");
console.log({
  todaysOrders: activeToday.length,
  todaysRevenue,
  averageOrderValue: aov,
  pendingOrders: pendingOrders ?? 0,
  failedPayments: (payments ?? []).filter((p) => p.status === "failed").length,
  lowStock,
  inventoryAlerts,
  couponUsage: couponUsage ?? 0,
  products: products ?? 0,
  orders: orders ?? 0,
  customers: customers ?? 0,
  topProductsCount: topProducts.length,
  recentCustomersCount: recentCustomers?.length ?? 0,
});
