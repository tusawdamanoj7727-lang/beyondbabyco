import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  computeCustomerSegment,
  type CustomerActivityEvent,
  type CustomerSegment,
  type CustomerStatus,
} from "@/lib/admin/customer-types";

export interface PublicCustomerSummary {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: CustomerStatus;
  isVip: boolean;
  segment: CustomerSegment;
  orderCount: number;
  lifetimeValue: number;
  createdAt: string;
}

export interface PublicCustomerDetail extends PublicCustomerSummary {
  avatarUrl: string | null;
  lastOrderAt: string | null;
  averageOrderValue: number;
}

export interface PublicCustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number;
  currency: string;
  createdAt: string;
}

export async function getCustomers(opts?: {
  status?: CustomerStatus;
  limit?: number;
}): Promise<PublicCustomerSummary[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("customers")
    .select("id, full_name, email, phone, status, is_vip, created_at, deleted_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 50);

  if (opts?.status) query = query.eq("status", opts.status);

  const { data: customers } = await query;
  if (!customers?.length) return [];

  const ids = customers.map((c) => c.id);
  const { data: orders } = await supabase
    .from("orders")
    .select("customer_id, grand_total, created_at, status")
    .in("customer_id", ids)
    .not("status", "eq", "cancelled");

  const stats = new Map<string, { count: number; ltv: number; last: string | null }>();
  for (const o of orders ?? []) {
    if (!o.customer_id) continue;
    const s = stats.get(o.customer_id) ?? { count: 0, ltv: 0, last: null };
    s.count += 1;
    s.ltv += o.grand_total;
    if (!s.last || o.created_at > s.last) s.last = o.created_at;
    stats.set(o.customer_id, s);
  }

  return customers.map((c) => {
    const st = stats.get(c.id) ?? { count: 0, ltv: 0, last: null };
    return {
      id: c.id,
      fullName: c.full_name ?? c.email ?? "Guest",
      email: c.email,
      phone: c.phone,
      status: (c.status ?? "active") as CustomerStatus,
      isVip: c.is_vip ?? false,
      segment: computeCustomerSegment({
        orderCount: st.count,
        lifetimeValue: st.ltv,
        lastOrderAt: st.last,
        isVip: c.is_vip ?? false,
        createdAt: c.created_at,
      }),
      orderCount: st.count,
      lifetimeValue: st.ltv,
      createdAt: c.created_at,
    };
  });
}

export async function getCustomer(id: string): Promise<PublicCustomerDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: c } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  if (!c || c.deleted_at) return null;

  const { data: orders } = await supabase
    .from("orders")
    .select("grand_total, created_at, status")
    .eq("customer_id", id)
    .not("status", "eq", "cancelled")
    .order("created_at", { ascending: false });

  let orderCount = 0;
  let ltv = 0;
  let last: string | null = null;
  for (const o of orders ?? []) {
    orderCount += 1;
    ltv += o.grand_total;
    if (!last) last = o.created_at;
  }

  return {
    id: c.id,
    fullName: c.full_name ?? c.email ?? "Guest",
    email: c.email,
    phone: c.phone,
    avatarUrl: c.avatar_url,
    status: (c.status ?? "active") as CustomerStatus,
    isVip: c.is_vip ?? false,
    segment: computeCustomerSegment({
      orderCount,
      lifetimeValue: ltv,
      lastOrderAt: last,
      isVip: c.is_vip ?? false,
      createdAt: c.created_at,
    }),
    orderCount,
    lifetimeValue: ltv,
    averageOrderValue: orderCount ? ltv / orderCount : 0,
    lastOrderAt: last,
    createdAt: c.created_at,
  };
}

export async function getCustomerOrders(customerId: string, limit = 20): Promise<PublicCustomerOrder[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, status, grand_total, currency, created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    grandTotal: o.grand_total,
    currency: o.currency,
    createdAt: o.created_at,
  }));
}

export async function getCustomerActivity(customerId: string): Promise<CustomerActivityEvent[]> {
  const supabase = await createSupabaseServerClient();
  const { data: events } = await supabase
    .from("customer_events")
    .select("id, type, message, metadata, created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (events ?? []).map((e) => ({
    id: e.id,
    type: e.type,
    message: e.message,
    metadata: (e.metadata as Record<string, unknown>) ?? {},
    userName: null,
    createdAt: e.created_at,
  }));
}
