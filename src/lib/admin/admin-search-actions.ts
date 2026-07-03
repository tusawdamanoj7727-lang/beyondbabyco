"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/guards";

export type AdminSearchResult = {
  id: string;
  type: "product" | "order" | "customer" | "coupon" | "media" | "review" | "nav";
  label: string;
  subtitle?: string;
  href: string;
};

export async function searchAdminEntities(query: string): Promise<AdminSearchResult[]> {
  await requireStaff();

  const q = query.trim().replace(/[%_]/g, "");
  if (q.length < 2) return [];

  const supabase = await createSupabaseServerClient();

  const [products, orders, customers, coupons, media, reviews] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug")
      .is("deleted_at", null)
      .or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
      .limit(5),
    supabase
      .from("orders")
      .select("id, order_number, status")
      .ilike("order_number", `%${q}%`)
      .limit(5),
    supabase
      .from("customers")
      .select("id, full_name, email")
      .is("deleted_at", null)
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(5),
    supabase
      .from("coupons")
      .select("id, code, name")
      .is("deleted_at", null)
      .or(`code.ilike.%${q}%,name.ilike.%${q}%`)
      .limit(5),
    supabase
      .from("media_library")
      .select("id, original_name, alt")
      .or(`original_name.ilike.%${q}%,alt.ilike.%${q}%`)
      .limit(5),
    supabase
      .from("reviews")
      .select("id, title, rating, moderation_status")
      .or(`title.ilike.%${q}%,body.ilike.%${q}%`)
      .limit(5),
  ]);

  const results: AdminSearchResult[] = [];

  for (const p of products.data ?? []) {
    results.push({
      id: p.id,
      type: "product",
      label: p.name,
      subtitle: "Product",
      href: `/admin/products/${p.id}`,
    });
  }
  for (const o of orders.data ?? []) {
    results.push({
      id: o.id,
      type: "order",
      label: o.order_number,
      subtitle: `Order · ${o.status}`,
      href: `/admin/orders/${o.id}`,
    });
  }
  for (const c of customers.data ?? []) {
    results.push({
      id: c.id,
      type: "customer",
      label: c.full_name ?? c.email ?? "Customer",
      subtitle: c.email ?? "Customer",
      href: `/admin/customers/${c.id}`,
    });
  }
  for (const c of coupons.data ?? []) {
    results.push({
      id: c.id,
      type: "coupon",
      label: c.code,
      subtitle: c.name ?? "Coupon",
      href: `/admin/coupons/${c.id}`,
    });
  }
  for (const m of media.data ?? []) {
    results.push({
      id: m.id,
      type: "media",
      label: m.original_name ?? "Media asset",
      subtitle: m.alt ?? "Media",
      href: `/admin/media?selected=${m.id}`,
    });
  }
  for (const r of reviews.data ?? []) {
    results.push({
      id: r.id,
      type: "review",
      label: r.title ?? `Review (${r.rating}★)`,
      subtitle: `Review · ${r.moderation_status ?? "pending"}`,
      href: `/admin/reviews/${r.id}`,
    });
  }

  return results.slice(0, 15);
}
