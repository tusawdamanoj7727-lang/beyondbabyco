"use server";

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCustomerIdForUser, requireCustomerSession } from "@/lib/orders/customer-auth";
import { getCustomerOrders } from "@/lib/orders/customer-shipment";
import { getFeaturedStorefrontProducts } from "@/lib/catalog/storefront";

export interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  deliveredOrders: number;
}

export interface DashboardOrderRow {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number;
  currency: string;
  createdAt: string;
  trackingNumber: string | null;
  carrier: string | null;
}

export async function getCustomerDashboardData() {
  const user = await requireCustomerSession();
  if (!user) return null;

  const customerId = await getCustomerIdForUser(user.id);

  const recommended = await getFeaturedStorefrontProducts(4);

  if (!customerId) {
    return {
      stats: { totalOrders: 0, activeOrders: 0, deliveredOrders: 0 },
      recentOrders: [],
      recommended,
    };
  }

  const supabase = await createSupabaseServerClient();
  const orders = await getCustomerOrders();
  const orderIds = orders.map((o) => o.id);

  const trackingMap = new Map<string, { trackingNumber: string | null; carrier: string | null }>();
  if (orderIds.length > 0) {
    const { data: shipments } = await supabase
      .from("shipments")
      .select("order_id, tracking_number, carrier")
      .in("order_id", orderIds);
    for (const s of shipments ?? []) {
      trackingMap.set(s.order_id, {
        trackingNumber: s.tracking_number,
        carrier: s.carrier,
      });
    }
  }

  const stats: DashboardStats = {
    totalOrders: orders.length,
    activeOrders: orders.filter((o) => !["delivered", "cancelled", "completed"].includes(o.status)).length,
    deliveredOrders: orders.filter((o) => o.status === "delivered" || o.status === "completed").length,
  };

  const recentOrders: DashboardOrderRow[] = orders.slice(0, 5).map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    grandTotal: o.grandTotal,
    currency: o.currency,
    createdAt: o.createdAt,
    trackingNumber: trackingMap.get(o.id)?.trackingNumber ?? null,
    carrier: trackingMap.get(o.id)?.carrier ?? null,
  }));

  return { stats, recentOrders, recommended };
}
