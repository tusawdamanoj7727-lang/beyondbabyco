"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { icon: "📦", label: "My Orders", href: "/account/orders" },
  { icon: "❤️", label: "Wishlist", href: "/wishlist" },
  { icon: "📍", label: "Addresses", href: "/account/addresses" },
  { icon: "⚙️", label: "Profile", href: "/account/profile" },
] as const;

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!data.user) {
        router.replace("/login?redirectTo=/account");
        return;
      }

      setUser(data.user);
      setLoading(false);
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace("/login?redirectTo=/account");
        return;
      }
      setUser(session.user);
      setLoading(false);
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2d5a27] border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const fullName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  const initials =
    fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-[#faf5f0] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 text-3xl font-black text-[#2d5a27]">My Account</h1>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col items-center border-b border-gray-100 pb-6 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf3de]">
                <span className="text-2xl font-black text-[#2d5a27]">{initials}</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {fullName || "BeyondBabyCo Member"}
              </p>
              <p className="mt-1 text-xs text-gray-400">{user.email}</p>
            </div>

            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-[#eaf3de]"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => void signOut()}
                className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
              >
                <span>🚪</span>
                Sign Out
              </button>
            </nav>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="mb-6 text-lg font-bold text-gray-900">Recent Orders</h2>
            <div className="py-16 text-center">
              <Image
                src="/icons/bella-bunny/sleeping.webp"
                alt="No orders yet"
                width={160}
                height={160}
                sizes="160px"
                className="mx-auto mb-4 object-contain opacity-80"
              />
              <p className="font-medium text-gray-500">No orders yet</p>
              <p className="mt-1 text-sm text-gray-400">
                Your orders will appear here once you shop
              </p>
              <Link
                href="/products"
                className="mt-4 inline-block rounded-xl bg-[#2d5a27] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#234821]"
              >
                Start Shopping →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
