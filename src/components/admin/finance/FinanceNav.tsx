"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FINANCE_NAV } from "@/lib/admin/finance-types";
import { cn } from "@/lib/utils";

export default function FinanceNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-cream-200 pb-1" aria-label="Finance navigation">
      {FINANCE_NAV.map((item) => {
        const active = pathname === item.href || (item.href !== "/admin/finance" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-t-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50",
              active ? "bg-white text-green-900 shadow-sm" : "text-green-700/70 hover:text-green-900",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
