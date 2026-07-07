"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import {
  getCustomerDashboardData,
  type DashboardOrderRow,
} from "@/lib/account/dashboard";
import { createClient } from "@/lib/supabase/client";
import type { OrderStatus } from "@/lib/supabase/database.types";

const NAV_ITEMS = [
  { icon: "📦", label: "My Orders", href: "/account/orders" },
  { icon: "❤️", label: "Wishlist", href: "/wishlist" },
  { icon: "📍", label: "Addresses", href: "/account/addresses" },
  { icon: "⚙️", label: "Profile Settings", href: "/account/profile" },
] as const;

function formatMoney(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [recentOrders, setRecentOrders] = useState<DashboardOrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function loadAccount() {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!data.user) {
        router.push("/login?redirectTo=/account");
        return;
      }

      setUser(data.user);

      const dashboard = await getCustomerDashboardData();
      if (!cancelled && dashboard) {
        setRecentOrders(dashboard.recentOrders);
      }

      setLoading(false);
    }

    void loadAccount();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push("/login?redirectTo=/account");
        return;
      }
      setUser(session.user);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf5f0]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2d5a27] border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const initial = (
    user.user_metadata?.full_name ||
    user.email ||
    "U"
  )
    .charAt(0)
    .toUpperCase();

  const displayName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "BeyondBabyCo Member";

  return (
    <div className="min-h-screen bg-[#faf5f0] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 text-3xl font-black text-[#2d5a27]">My Account</h1>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-fit rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col items-center border-b border-gray-100 pb-6 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf3de]">
                <span className="text-2xl font-black text-[#2d5a27]">{initial}</span>
              </div>
              <p className="font-bold text-gray-900">{displayName}</p>
              <p className="mt-1 text-xs text-gray-400">{user.email}</p>
            </div>

            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-[#eaf3de]"
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => void signOut()}
                className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
              >
                <span className="text-base">🚪</span>
                Sign Out
              </button>
            </nav>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm md:col-span-2">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
              {recentOrders.length > 0 ? (
                <Link
                  href="/account/orders"
                  className="text-sm font-semibold text-[#2d5a27] hover:underline"
                >
                  View all →
                </Link>
              ) : null}
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-16 text-center">
                <Image
                  src="/icons/bella-bunny/sleeping.webp"
                  alt="No orders"
                  width={160}
                  height={160}
                  sizes="160px"
                  className="mx-auto mb-4 object-contain opacity-80"
                />
                <p className="text-lg font-medium text-gray-500">No orders yet</p>
                <p className="mt-1 text-sm text-gray-400">
                  Your orders will appear here after you shop
                </p>
                <Link
                  href="/products"
                  className="mt-5 inline-block rounded-xl bg-[#2d5a27] px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-[#234821]"
                >
                  Shop Now →
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-4 transition-colors hover:bg-[#faf5f0]"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <OrderStatusBadge status={order.status as OrderStatus} />
                        <span className="text-sm font-bold text-[#2d5a27]">
                          {formatMoney(order.grandTotal, order.currency)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
