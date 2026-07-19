import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  COUPON_SORTABLE_COLUMNS,
  computeDisplayStatus,
  type CouponDashboard,
  type CouponDetail,
  type CouponDisplayStatus,
  type CouponEligibility,
  type CouponLifecycle,
  type CouponListItem,
  type CouponSortColumn,
  type CouponType,
  type BuyXGetYRule,
  type FreeShippingRule,
  type GiftCardListItem,
} from "./coupon-types";

export { COUPON_SORTABLE_COLUMNS, type CouponSortColumn };

export interface CouponListParams {
  search?: string;
  promoType?: CouponType | "all";
  lifecycle?: CouponLifecycle | "all";
  displayStatus?: CouponDisplayStatus | "all";
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: CouponSortColumn;
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
  trash?: boolean;
}

export interface CouponListResult {
  rows: CouponListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

type CouponRow = {
  id: string;
  code: string;
  name: string | null;
  promo_type: string | null;
  type: string;
  value: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  lifecycle_status: string;
  updated_at: string;
  deleted_at: string | null;
};

function mapPromoType(row: CouponRow): CouponType {
  const pt = row.promo_type ?? (row.type === "percent" ? "percentage" : "fixed_amount");
  return pt as CouponType;
}

function mapListItem(row: CouponRow): CouponListItem {
  const lifecycleStatus = (row.lifecycle_status ?? "draft") as CouponLifecycle;
  return {
    id: row.id,
    code: row.code,
    name: row.name ?? row.code,
    promoType: mapPromoType(row),
    value: row.value,
    usageCount: row.used_count,
    maxUses: row.max_uses,
    lifecycleStatus,
    isActive: row.is_active,
    displayStatus: computeDisplayStatus({
      isActive: row.is_active,
      lifecycleStatus,
      startsAt: row.starts_at,
      expiresAt: row.expires_at,
    }),
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    updatedAt: row.updated_at,
  };
}

export async function getCouponDashboard(): Promise<CouponDashboard> {
  const supabase = await createSupabaseServerClient();
  const { data: coupons } = await supabase
    .from("coupons")
    .select("id, code, name, is_active, lifecycle_status, starts_at, expires_at, used_count, max_uses, total_revenue")
    .is("deleted_at", null);

  const rows = (coupons ?? []).map((c) => ({
    ...c,
    displayStatus: computeDisplayStatus({
      isActive: c.is_active,
      lifecycleStatus: c.lifecycle_status ?? "draft",
      startsAt: c.starts_at,
      expiresAt: c.expires_at,
    }),
  }));

  const active = rows.filter((r) => r.displayStatus === "active").length;
  const scheduled = rows.filter((r) => r.displayStatus === "scheduled").length;
  const expired = rows.filter((r) => r.displayStatus === "expired").length;
  const disabledCoupons = rows.filter(
    (r) => r.displayStatus === "inactive" || r.displayStatus === "archived" || !r.is_active,
  ).length;
  const soon = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const expiringSoon = rows.filter((r) => {
    if (!r.expires_at || r.displayStatus === "expired") return false;
    const exp = new Date(r.expires_at).getTime();
    return exp >= Date.now() && exp <= soon;
  }).length;
  const totalUses = rows.reduce((s, r) => s + (r.used_count ?? 0), 0);
  const totalMax = rows.reduce((s, r) => s + (r.max_uses ?? 0), 0);
  const rate = totalMax ? Math.round((totalUses / totalMax) * 1000) / 10 : totalUses ? 100 : 0;
  const revenue = rows.reduce((s, r) => s + Number(r.total_revenue ?? 0), 0);

  const topCoupons = [...rows]
    .sort((a, b) => (b.used_count ?? 0) - (a.used_count ?? 0))
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name ?? c.code,
      usageCount: c.used_count ?? 0,
      revenue: Number(c.total_revenue ?? 0),
    }));

  return {
    activeCoupons: active,
    scheduledCoupons: scheduled,
    expiredCoupons: expired,
    disabledCoupons,
    expiringSoon,
    redemptionRate: rate,
    revenueGenerated: revenue,
    topCoupons,
  };
}

export async function listCoupons(params: CouponListParams): Promise<CouponListResult> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(5, params.perPage ?? 20));
  const sort = params.sort ?? "updated_at";
  const ascending = params.dir === "asc";

  let query = supabase.from("coupons").select("*", { count: "exact" });
  query = params.trash ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);

  if (params.promoType && params.promoType !== "all") query = query.eq("promo_type", params.promoType);
  if (params.lifecycle && params.lifecycle !== "all") query = query.eq("lifecycle_status", params.lifecycle);
  if (params.dateFrom) query = query.gte("updated_at", params.dateFrom);
  if (params.dateTo) query = query.lte("updated_at", params.dateTo);

  const dbSort = ["code", "name", "promo_type", "value", "updated_at", "starts_at", "expires_at"].includes(sort) ? sort : "updated_at";
  query = query.order(dbSort, { ascending });

  const from = (page - 1) * perPage;
  const { data, count, error } = await query.range(from, from + perPage - 1);
  if (error) throw error;

  let rows = (data ?? []).map((r) => mapListItem(r as CouponRow));

  if (params.displayStatus && params.displayStatus !== "all") {
    rows = rows.filter((r) => r.displayStatus === params.displayStatus);
  }

  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    rows = rows.filter((r) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
  }

  if (params.customerId) {
    const { data: usage } = await supabase.from("coupon_usage").select("coupon_id").eq("customer_id", params.customerId);
    const ids = new Set((usage ?? []).map((u) => u.coupon_id));
    rows = rows.filter((r) => ids.has(r.id));
  }

  const total = count ?? rows.length;
  return { rows, total, page, perPage, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getCouponDetail(id: string): Promise<CouponDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase.from("coupons").select("*").eq("id", id).maybeSingle();
  if (!row || row.deleted_at) return null;

  const eligibility = (row.eligibility as CouponEligibility) ?? {};
  const buyXGetY = (row.buy_x_get_y as BuyXGetYRule) ?? {};
  const freeShipping = (row.free_shipping as FreeShippingRule) ?? {};

  return {
    id: row.id,
    code: row.code,
    name: row.name ?? row.code,
    description: row.description,
    promoType: mapPromoType(row as CouponRow),
    value: row.value,
    minOrder: row.min_order,
    maxDiscount: row.max_discount,
    maxUses: row.max_uses,
    usedCount: row.used_count,
    perCustomerLimit: row.per_customer_limit,
    firstOrderOnly: row.first_order_only ?? false,
    loggedInOnly: row.logged_in_only ?? false,
    timezone: row.timezone ?? "Asia/Kolkata",
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    isActive: row.is_active,
    lifecycleStatus: (row.lifecycle_status ?? "draft") as CouponLifecycle,
    eligibility,
    allowStack: row.allow_stack ?? false,
    priority: row.priority ?? 0,
    isExclusive: row.is_exclusive ?? false,
    autoApply: row.auto_apply ?? false,
    autoConditions: (row.auto_conditions as Record<string, unknown>) ?? {},
    buyXGetY,
    freeShipping,
    totalRevenue: Number(row.total_revenue ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCouponFilterOptions() {
  const supabase = await createSupabaseServerClient();
  const [{ data: customers }, { data: products }, { data: categories }, { data: brands }] = await Promise.all([
    supabase.from("customers").select("id, full_name, email").is("deleted_at", null).order("full_name").limit(200),
    supabase.from("products").select("id, name").is("deleted_at", null).order("name").limit(200),
    supabase.from("categories").select("id, name").is("deleted_at", null).order("name").limit(200),
    supabase.from("brands").select("id, name").is("deleted_at", null).order("name").limit(200),
  ]);
  return {
    customers: (customers ?? []).map((c) => ({ id: c.id, name: c.full_name ?? c.email ?? c.id.slice(0, 8) })),
    products: products ?? [],
    categories: categories ?? [],
    brands: brands ?? [],
  };
}

export async function listGiftCards(limit = 50): Promise<GiftCardListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("gift_cards").select("*").order("created_at", { ascending: false }).limit(limit);
  if (!data?.length) return [];

  const customerIds = [...new Set(data.map((g) => g.customer_id).filter(Boolean))] as string[];
  const { data: customers } = customerIds.length
    ? await supabase.from("customers").select("id, full_name, email").in("id", customerIds)
    : { data: [] };
  const cMap = new Map((customers ?? []).map((c) => [c.id, c.full_name ?? c.email]));

  return data.map((g) => ({
    id: g.id,
    code: g.code,
    name: g.name,
    balance: g.balance,
    initialBalance: g.initial_balance,
    currency: g.currency,
    isActive: g.is_active,
    expiresAt: g.expires_at,
    customerName: g.customer_id ? cMap.get(g.customer_id) ?? null : null,
    createdAt: g.created_at,
  }));
}

export async function getCouponByCode(code: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}
