"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Download,
  Heart,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  Package,
  Shield,
  User,
} from "lucide-react";

import NotificationCenter from "@/components/account/NotificationCenter";
import { focusRing, transitionColorsFast } from "@/lib/design/ui";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/security", label: "Security", icon: Shield },
  { href: "/account/support", label: "Support", icon: HelpCircle },
  { href: "/account/downloads", label: "Downloads", icon: Download },
] as const;

export default function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Account navigation"
      className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 flex-nowrap lg:mx-0 lg:flex-wrap">
        {NAV.map((item) => {
          const href = item.href;
          const isActive =
            "exact" in item && item.exact
              ? pathname === item.href
              : pathname === item.href || (item.href !== "/account" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-sm font-medium min-h-[44px]",
                transitionColorsFast,
                focusRing,
                isActive
                  ? "bg-green-600 text-cream-50 shadow-sm"
                  : "text-green-800 hover:bg-green-50 hover:text-green-600",
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
      <NotificationCenter />
    </nav>
  );
}
