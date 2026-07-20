"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Heart,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";

import ProductCard from "@/components/catalog/ProductCard";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";
import { Mascot } from "@/components/mascots";
import { focusRing, interactiveSurface } from "@/lib/design/ui";
import type { DashboardOrderRow, DashboardStats } from "@/lib/account/dashboard";
import type { StorefrontProduct } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";
import { fetchRecentlyViewedProducts } from "@/lib/storefront/recently-viewed-actions";
import { readRecentlyViewedIds } from "@/lib/storefront/recently-viewed";

function formatMoney(n: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(n);
}

export default function AccountDashboard({
  name,
  stats,
  recentOrders,
  recommended,
  emailVerified = false,
}: {
  name: string;
  stats: DashboardStats;
  recentOrders: DashboardOrderRow[];
  recommended: StorefrontProduct[];
  emailVerified?: boolean;
}) {
  const [recentlyViewed, setRecentlyViewed] = useState<StorefrontProduct[]>([]);

  useEffect(() => {
    const ids = readRecentlyViewedIds();
    if (ids.length === 0) return;

    const load = () => void fetchRecentlyViewedProducts(ids).then(setRecentlyViewed);

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) {
      void load();
      return;
    }

    const g = globalThis as typeof globalThis & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof g.requestIdleCallback === "function") {
      const idleId = g.requestIdleCallback(load, { timeout: 4000 });
      return () => {
        if (typeof g.cancelIdleCallback === "function") g.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(load, 2000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const quickActions = [
    { href: "/products", label: "Shop", icon: ShoppingBag },
    { href: "/account/orders", label: "Track", icon: Truck },
    { href: "/wishlist", label: "Wishlist", icon: Heart },
    { href: "/account/addresses", label: "Addresses", icon: MapPin },
  ];

  return (
    <div className="space-y-10">
      {emailVerified ? (
        <p
          role="status"
          className="rounded-3xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-800"
        >
          Email verified — your account is fully active.
        </p>
      ) : null}

      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-green-600">Dashboard</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-green-900">Hello, {name}</h1>
        <p className="mt-1 text-green-700">Your BeyondBabyCo account at a glance.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total orders" value={stats.totalOrders} icon={Package} />
        <StatCard label="Active" value={stats.activeOrders} icon={Truck} />
        <StatCard label="Delivered" value={stats.deliveredOrders} icon={Sparkles} />
      </div>

      <div className="rounded-3xl border border-green-200/80 bg-gradient-to-r from-green-50 via-cream-50 to-terra-50/40 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-green-700">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Account care
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold text-green-900">
              Need help with an order?
            </h2>
            <p className="mt-1 max-w-md text-sm text-green-700">
              Track shipments, manage addresses, or reach support — we keep your baby-care orders
              clear and easy to follow.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/account/orders"
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full bg-green-800 px-4 text-sm font-semibold text-white hover:bg-green-900",
                  focusRing,
                )}
              >
                View orders
              </Link>
              <Link
                href="/contact"
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border border-green-200 bg-white px-4 text-sm font-semibold text-green-800 hover:border-green-300",
                  focusRing,
                )}
              >
                Contact support
              </Link>
            </div>
          </div>
          <Mascot mascot="bella-bunny" pose="welcome" size={100} animated alt="" />
        </div>
      </div>

      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="font-heading text-lg font-bold text-green-900">
          Quick actions
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className={cn(
                interactiveSurface,
                "flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-green-100 bg-white/90 p-4 text-sm font-semibold text-green-800 shadow-sm",
                focusRing,
              )}
            >
              <Icon className="h-5 w-5 text-green-600" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-orders-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="recent-orders-heading" className="font-heading text-lg font-bold text-green-900">
            Recent orders
          </h2>
          <Link href="/account/orders" className="text-sm font-semibold text-terra-600 hover:underline">
            View all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="mt-4">
            <CatalogEmptyState
              title="No orders yet"
              description="When you place your first order, it will show up here."
              actionLabel="Shop collection"
              actionHref="/products"
              mascot="bella-bunny"
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className={cn(
                    interactiveSurface,
                    "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-100 bg-white/90 p-4",
                    focusRing,
                  )}
                >
                  <div>
                    <p className="font-semibold text-green-900">{order.orderNumber}</p>
                    <p className="text-xs text-green-700">
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                      {order.trackingNumber ? ` · AWB ${order.trackingNumber}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status as never} size="sm" />
                    <span className="font-semibold">{formatMoney(order.grandTotal, order.currency)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recentlyViewed.length > 0 ? (
        <section aria-labelledby="recently-viewed-account">
          <h2 id="recently-viewed-account" className="font-heading text-lg font-bold text-green-900">
            Recently viewed
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      {recommended.length > 0 ? (
        <section aria-labelledby="recommended-heading">
          <h2 id="recommended-heading" className="font-heading text-lg font-bold text-green-900">
            Recommended for you
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recommended.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Package;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white/90 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-green-700">{label}</p>
        <Icon className="h-5 w-5 text-green-600/70" aria-hidden="true" />
      </div>
      <p className="mt-2 font-heading text-3xl font-bold text-green-900">{value}</p>
    </div>
  );
}
