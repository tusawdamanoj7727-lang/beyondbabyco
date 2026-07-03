import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  CUSTOMER_SORTABLE_COLUMNS,
  computeCustomerSegment,
  type CustomerActivityEvent,
  type CustomerAddressRow,
  type CustomerCartRow,
  type CustomerDashboard,
  type CustomerDetail,
  type CustomerListItem,
  type CustomerLoyaltyRow,
  type CustomerOrderRow,
  type CustomerReferralRow,
  type CustomerReviewRow,
  type CustomerSortColumn,
  type CustomerStatus,
  type CustomerTicketRow,
  type CustomerWishlistRow,
} from "./customer-types";

export { CUSTOMER_SORTABLE_COLUMNS, type CustomerSortColumn };

export interface CustomerListParams {
  search?: string;
  city?: string;
  state?: string;
  country?: string;
  status?: CustomerStatus | "all";
  newsletter?: boolean;
  vip?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sort?: CustomerSortColumn;
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
  trash?: boolean;
}

export interface CustomerListResult {
  rows: CustomerListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

interface OrderStats {
  orderCount: number;
  lifetimeValue: number;
  lastOrderAt: string | null;
}

async function loadOrderStats(customerIds: string[]): Promise<Map<string, OrderStats>> {
  const map = new Map<string, OrderStats>();
  if (!customerIds.length) return map;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select("customer_id, grand_total, created_at, status")
    .in("customer_id", customerIds)
    .not("status", "eq", "cancelled");

  for (const o of data ?? []) {
    if (!o.customer_id) continue;
    const cur = map.get(o.customer_id) ?? { orderCount: 0, lifetimeValue: 0, lastOrderAt: null };
    cur.orderCount += 1;
    cur.lifetimeValue += o.grand_total;
    if (!cur.lastOrderAt || o.created_at > cur.lastOrderAt) cur.lastOrderAt = o.created_at;
    map.set(o.customer_id, cur);
  }
  return map;
}

async function loadDefaultAddresses(customerIds: string[]) {
  const map = new Map<string, { city: string; state: string; country: string }>();
  if (!customerIds.length) return map;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("customer_addresses")
    .select("customer_id, city, state, country, is_default")
    .in("customer_id", customerIds)
    .order("is_default", { ascending: false });

  for (const a of data ?? []) {
    if (!map.has(a.customer_id)) {
      map.set(a.customer_id, { city: a.city, state: a.state, country: a.country });
    }
  }
  return map;
}

async function loadNewsletterEmails(emails: string[]) {
  const set = new Set<string>();
  const cleaned = emails.filter(Boolean).map((e) => e!.toLowerCase());
  if (!cleaned.length) return set;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("newsletter_subscribers").select("email").in("email", cleaned).eq("is_active", true);
  for (const s of data ?? []) set.add(s.email.toLowerCase());
  return set;
}

function startOfMonthIso() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getCustomerDashboard(): Promise<CustomerDashboard> {
  const supabase = await createSupabaseServerClient();
  const monthStart = startOfMonthIso();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ data: customers }, { data: orders }, { data: carts }] = await Promise.all([
    supabase.from("customers").select("id, status, is_vip, created_at, deleted_at"),
    supabase.from("orders").select("customer_id, grand_total, status").not("status", "eq", "cancelled"),
    supabase.from("cart").select("id, updated_at"),
  ]);

  const active = (customers ?? []).filter((c) => c.status === "active" && !c.deleted_at);
  const ltvByCustomer = new Map<string, number>();
  for (const o of orders ?? []) {
    if (!o.customer_id) continue;
    ltvByCustomer.set(o.customer_id, (ltvByCustomer.get(o.customer_id) ?? 0) + o.grand_total);
  }
  const ltvs = [...ltvByCustomer.values()];
  const avgLtv = ltvs.length ? ltvs.reduce((s, v) => s + v, 0) / ltvs.length : 0;

  let abandoned = 0;
  if (carts?.length) {
    const cartIds = carts.filter((c) => c.updated_at < dayAgo).map((c) => c.id);
    if (cartIds.length) {
      const { data: items } = await supabase.from("cart_items").select("cart_id").in("cart_id", cartIds);
      const withItems = new Set((items ?? []).map((i) => i.cart_id));
      abandoned = cartIds.filter((id) => withItems.has(id)).length;
    }
  }

  return {
    totalCustomers: (customers ?? []).filter((c) => !c.deleted_at).length,
    activeCustomers: active.length,
    vipCustomers: active.filter((c) => c.is_vip).length,
    newThisMonth: (customers ?? []).filter((c) => !c.deleted_at && c.created_at >= monthStart).length,
    averageLifetimeValue: Math.round(avgLtv * 100) / 100,
    abandonedCarts: abandoned,
  };
}

export async function listCustomers(params: CustomerListParams): Promise<CustomerListResult> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(5, params.perPage ?? 20));
  const sort = params.sort ?? "created_at";
  const dir = params.dir === "asc";

  let query = supabase.from("customers").select("*", { count: "exact" });
  query = params.trash ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);

  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.vip) query = query.eq("is_vip", true);
  if (params.dateFrom) query = query.gte("created_at", params.dateFrom);
  if (params.dateTo) query = query.lte("created_at", params.dateTo);
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    query = query.or(`full_name.ilike.${q},email.ilike.${q},phone.ilike.${q}`);
  }

  const dbSort = ["full_name", "email", "created_at"].includes(sort) ? sort : "created_at";
  query = query.order(dbSort, { ascending: dir });

  const from = (page - 1) * perPage;
  const { data, count, error } = await query.range(from, from + perPage - 1);
  if (error) throw error;

  const customerIds = (data ?? []).map((c) => c.id);
  const [stats, addresses, newsletterSet] = await Promise.all([
    loadOrderStats(customerIds),
    loadDefaultAddresses(customerIds),
    loadNewsletterEmails((data ?? []).map((c) => c.email).filter(Boolean) as string[]),
  ]);

  let rows: CustomerListItem[] = (data ?? []).map((c) => {
    const st = stats.get(c.id) ?? { orderCount: 0, lifetimeValue: 0, lastOrderAt: null };
    const addr = addresses.get(c.id);
    const status = (c.status ?? "active") as CustomerStatus;
    return {
      id: c.id,
      fullName: c.full_name ?? c.email ?? "Guest",
      email: c.email,
      phone: c.phone,
      avatarUrl: c.avatar_url,
      city: addr?.city ?? null,
      state: addr?.state ?? null,
      country: addr?.country ?? null,
      orderCount: st.orderCount,
      lifetimeValue: st.lifetimeValue,
      lastOrderAt: st.lastOrderAt,
      status,
      isVip: c.is_vip ?? false,
      isNewsletter: c.email ? newsletterSet.has(c.email.toLowerCase()) : false,
      segment: computeCustomerSegment({
        orderCount: st.orderCount,
        lifetimeValue: st.lifetimeValue,
        lastOrderAt: st.lastOrderAt,
        isVip: c.is_vip ?? false,
        createdAt: c.created_at,
      }),
      createdAt: c.created_at,
    };
  });

  if (params.city) rows = rows.filter((r) => r.city?.toLowerCase() === params.city!.toLowerCase());
  if (params.state) rows = rows.filter((r) => r.state?.toLowerCase() === params.state!.toLowerCase());
  if (params.country) rows = rows.filter((r) => r.country?.toLowerCase() === params.country!.toLowerCase());
  if (params.newsletter) rows = rows.filter((r) => r.isNewsletter);

  if (sort === "order_count") rows.sort((a, b) => (dir ? a.orderCount - b.orderCount : b.orderCount - a.orderCount));
  if (sort === "lifetime_value") rows.sort((a, b) => (dir ? a.lifetimeValue - b.lifetimeValue : b.lifetimeValue - a.lifetimeValue));
  if (sort === "last_order_at") {
    rows.sort((a, b) => {
      const av = a.lastOrderAt ?? "";
      const bv = b.lastOrderAt ?? "";
      return dir ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  const total = count ?? rows.length;
  return { rows, total, page, perPage, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getCustomerDetail(id: string): Promise<CustomerDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: c } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  if (!c) return null;

  const stats = (await loadOrderStats([id])).get(id) ?? { orderCount: 0, lifetimeValue: 0, lastOrderAt: null };
  const newsletter = c.email
    ? await loadNewsletterEmails([c.email])
    : new Set<string>();

  const tags = Array.isArray(c.tags) ? (c.tags as string[]) : [];

  return {
    id: c.id,
    profileId: c.profile_id,
    fullName: c.full_name ?? c.email ?? "Guest",
    email: c.email,
    phone: c.phone,
    avatarUrl: c.avatar_url,
    status: (c.status ?? "active") as CustomerStatus,
    isVip: c.is_vip ?? false,
    notes: c.notes,
    internalNotes: c.internal_notes,
    tags,
    segment: computeCustomerSegment({
      orderCount: stats.orderCount,
      lifetimeValue: stats.lifetimeValue,
      lastOrderAt: stats.lastOrderAt,
      isVip: c.is_vip ?? false,
      createdAt: c.created_at,
    }),
    isNewsletter: c.email ? newsletter.has(c.email.toLowerCase()) : false,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    orderCount: stats.orderCount,
    lifetimeValue: stats.lifetimeValue,
    averageOrderValue: stats.orderCount ? stats.lifetimeValue / stats.orderCount : 0,
    lastOrderAt: stats.lastOrderAt,
  };
}

export async function getCustomerOrders(customerId: string): Promise<CustomerOrderRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, status, grand_total, currency, created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    grandTotal: o.grand_total,
    currency: o.currency,
    createdAt: o.created_at,
  }));
}

export async function getCustomerAddresses(customerId: string): Promise<CustomerAddressRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false });
  return (data ?? []).map((a) => ({
    id: a.id,
    type: a.type as "billing" | "shipping",
    fullName: a.full_name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    country: a.country,
    pincode: a.pincode,
    isDefault: a.is_default,
  }));
}

export async function getCustomerWishlist(customerId: string): Promise<CustomerWishlistRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("wishlist").select("id, product_id, created_at").eq("customer_id", customerId);
  const productIds = [...new Set((data ?? []).map((w) => w.product_id))];
  if (!productIds.length) return [];

  const [{ data: products }, { data: allVariants }] = await Promise.all([
    supabase.from("products").select("id, name").in("id", productIds),
    supabase.from("product_variants").select("id, product_id").in("product_id", productIds),
  ]);
  const pMap = new Map((products ?? []).map((p) => [p.id, p.name]));
  const vToProduct = new Map((allVariants ?? []).map((v) => [v.id, v.product_id]));
  const allVIds = (allVariants ?? []).map((v) => v.id);

  const stockMap = new Map<string, boolean>();
  if (allVIds.length) {
    const { data: invRows } = await supabase.from("inventory").select("product_variant_id, quantity, reserved").in("product_variant_id", allVIds);
    for (const invRow of invRows ?? []) {
      const pid = vToProduct.get(invRow.product_variant_id);
      if (!pid) continue;
      if (invRow.quantity - invRow.reserved > 0) stockMap.set(pid, true);
    }
  }

  return (data ?? []).map((w) => ({
    id: w.id,
    productId: w.product_id,
    productName: pMap.get(w.product_id) ?? "Product",
    inStock: stockMap.get(w.product_id) ?? false,
    createdAt: w.created_at,
  }));
}

export async function getCustomerCart(customerId: string): Promise<{ items: CustomerCartRow[]; updatedAt: string | null; abandoned: boolean }> {
  const supabase = await createSupabaseServerClient();
  const { data: cart } = await supabase.from("cart").select("id, updated_at").eq("customer_id", customerId).maybeSingle();
  if (!cart) return { items: [], updatedAt: null, abandoned: false };

  const { data: items } = await supabase.from("cart_items").select("product_variant_id, quantity").eq("cart_id", cart.id);
  const variantIds = [...new Set((items ?? []).map((i) => i.product_variant_id))];
  const { data: variants } = variantIds.length
    ? await supabase.from("product_variants").select("id, name, product_id, price").in("id", variantIds)
    : { data: [] };
  const productIds = [...new Set((variants ?? []).map((v) => v.product_id))];
  const { data: products } = productIds.length
    ? await supabase.from("products").select("id, name").in("id", productIds)
    : { data: [] };
  const pMap = new Map((products ?? []).map((p) => [p.id, p.name]));
  const vMap = new Map((variants ?? []).map((v) => [v.id, v]));

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const abandoned = new Date(cart.updated_at).getTime() < dayAgo && (items?.length ?? 0) > 0;

  return {
    items: (items ?? []).map((i) => {
      const v = vMap.get(i.product_variant_id);
      return {
        variantId: i.product_variant_id,
        productName: v ? (pMap.get(v.product_id) ?? "Product") : "Product",
        variantName: v?.name ?? "—",
        quantity: i.quantity,
        unitPrice: v?.price ?? 0,
      };
    }),
    updatedAt: cart.updated_at,
    abandoned,
  };
}

export async function getCustomerReviews(customerId: string): Promise<CustomerReviewRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("reviews").select("*").eq("customer_id", customerId).order("created_at", { ascending: false });
  const productIds = [...new Set((data ?? []).map((r) => r.product_id))];
  const { data: products } = productIds.length
    ? await supabase.from("products").select("id, name").in("id", productIds)
    : { data: [] };
  const pMap = new Map((products ?? []).map((p) => [p.id, p.name]));
  return (data ?? []).map((r) => ({
    id: r.id,
    productName: pMap.get(r.product_id) ?? "Product",
    rating: r.rating,
    title: r.title,
    body: r.body,
    isPublished: r.is_published,
    createdAt: r.created_at,
  }));
}

export async function getCustomerTickets(customerId: string): Promise<CustomerTicketRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("support_tickets")
    .select("id, ticket_number, subject, status, priority, assigned_to, created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  const staffIds = [...new Set((data ?? []).map((t) => t.assigned_to).filter(Boolean))] as string[];
  const { data: staff } = staffIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", staffIds)
    : { data: [] };
  const sMap = new Map((staff ?? []).map((s) => [s.id, s.full_name]));
  return (data ?? []).map((t) => ({
    id: t.id,
    ticketNumber: t.ticket_number,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    assignedName: t.assigned_to ? sMap.get(t.assigned_to) ?? null : null,
    createdAt: t.created_at,
  }));
}

export async function getCustomerLoyalty(customerId: string): Promise<{ balance: number; history: CustomerLoyaltyRow[] }> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("loyalty_points")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  const history = (data ?? []).map((r) => ({
    id: r.id,
    points: r.points,
    reason: r.reason,
    createdAt: r.created_at,
  }));
  const balance = history.reduce((s, h) => s + h.points, 0);
  return { balance, history };
}

export async function getCustomerReferrals(customerId: string): Promise<CustomerReferralRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_customer_id", customerId)
    .order("created_at", { ascending: false });
  const referredIds = [...new Set((data ?? []).map((r) => r.referred_customer_id).filter(Boolean))] as string[];
  const { data: referred } = referredIds.length
    ? await supabase.from("customers").select("id, full_name, email").in("id", referredIds)
    : { data: [] };
  const rMap = new Map((referred ?? []).map((c) => [c.id, c.full_name ?? c.email]));
  return (data ?? []).map((r) => ({
    id: r.id,
    referredEmail: r.referred_email,
    referredName: r.referred_customer_id ? rMap.get(r.referred_customer_id) ?? null : null,
    status: r.status,
    rewardPoints: r.reward_points,
    createdAt: r.created_at,
  }));
}

export async function getCustomerActivity(customerId: string): Promise<CustomerActivityEvent[]> {
  const supabase = await createSupabaseServerClient();
  const { data: events } = await supabase
    .from("customer_events")
    .select("id, type, message, metadata, created_by, created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(100);

  const userIds = [...new Set((events ?? []).map((e) => e.created_by).filter(Boolean))] as string[];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };
  const uMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const synthetic: CustomerActivityEvent[] = [];

  const orders = await getCustomerOrders(customerId);
  for (const o of orders.slice(0, 10)) {
    synthetic.push({
      id: `order-${o.id}`,
      type: "order",
      message: `Order ${o.orderNumber} placed`,
      metadata: { order_id: o.id },
      userName: null,
      createdAt: o.createdAt,
    });
  }

  const merged = [
    ...(events ?? []).map((e) => ({
      id: e.id,
      type: e.type,
      message: e.message,
      metadata: (e.metadata as Record<string, unknown>) ?? {},
      userName: e.created_by ? uMap.get(e.created_by) ?? null : null,
      createdAt: e.created_at,
    })),
    ...synthetic,
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return merged.slice(0, 50);
}

export async function getCustomerFilterOptions() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("customer_addresses").select("city, state, country");
  const cities = [...new Set((data ?? []).map((a) => a.city).filter(Boolean))].sort();
  const states = [...new Set((data ?? []).map((a) => a.state).filter(Boolean))].sort();
  const countries = [...new Set((data ?? []).map((a) => a.country).filter(Boolean))].sort();
  return { cities, states, countries };
}

export async function exportCustomersCsv(params: Omit<CustomerListParams, "page" | "perPage">): Promise<string> {
  const result = await listCustomers({ ...params, page: 1, perPage: 10000 });
  const header = "ID,Name,Email,Phone,City,Orders,Lifetime Value,Status,VIP,Segment,Created\n";
  const lines = result.rows.map((r) =>
    [
      r.id,
      `"${(r.fullName ?? "").replace(/"/g, '""')}"`,
      r.email ?? "",
      r.phone ?? "",
      r.city ?? "",
      r.orderCount,
      r.lifetimeValue,
      r.status,
      r.isVip ? "yes" : "no",
      r.segment,
      r.createdAt,
    ].join(","),
  );
  return header + lines.join("\n");
}

export async function getTicketMessages(ticketId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  return data ?? [];
}
